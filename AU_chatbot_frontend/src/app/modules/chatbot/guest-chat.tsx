"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Loader2, Menu, X, LogOut, Trash2, Plus, Upload, Image as ImageIcon, X as XIcon } from "lucide-react";

const STORAGE_KEY = "guestChatMessages";
const GUEST_STATS_KEY = "guestStats";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function GuestChatPage() {
  const [input, setInput] = useState("");
  const [guestMessages, setGuestMessages] = useState<{ question: string; answer: string; timestamp: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // File upload states
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [tokenErrorMsg, setTokenErrorMsg] = useState<string>("");

  // ✅ Add guest rate limit states
  const [guestRateLimits, setGuestRateLimits] = useState<any>(null);
  const [guestStats, setGuestStats] = useState({
    requestsUsed: 0,
    inputTokensUsed: 0,
    outputTokensUsed: 0,
    filesUploaded: 0,
    lastReset: new Date().toDateString()
  });
  
  const guestInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const SUPPORTED_FILE_TYPES = [".pdf", ".docx", ".txt"];
  const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

  // ✅ Fetch guest rate limits from database
  useEffect(() => {
    const fetchGuestRateLimits = async () => {
      try {
        const response = await fetch(`${API_BASE}/rate-limit/guest-limits`);
        if (response.ok) {
          const data = await response.json();
          setGuestRateLimits(data);
        }
      } catch (error) {
        console.error("Failed to fetch guest rate limits:", error);
        // Set fallback defaults if API fails
        setGuestRateLimits({
          request_per_day: 10,
          input_token_per_day: 10,
          output_token_per_day: 100,
          file_count: 10,
          file_size: 50,
          memory_count: 10
        });
      }
    };

    fetchGuestRateLimits();
  }, []);

  // ✅ Get dynamic limits from database
  const getGuestLimits = () => {
    if (!guestRateLimits) return {
      maxRequests: 10,
      maxInputTokens: 10,
      maxOutputTokens: 100,
      maxFileCount: 10,
      maxFileSizeMB: 50,
      maxMemoryCount: 10
    };
    
    return {
      maxRequests: guestRateLimits.request_per_day || 10,
      maxInputTokens: guestRateLimits.input_token_per_day || 10,
      maxOutputTokens: guestRateLimits.output_token_per_day || 100,
      maxFileCount: guestRateLimits.file_count || 10,
      maxFileSizeMB: guestRateLimits.file_size || 50,
      maxMemoryCount: guestRateLimits.memory_count || 10
    };
  };

  const guestLimits = useMemo(() => getGuestLimits(), [guestRateLimits]);

  // ✅ Token calculation helper (same as main page)
  const calcTokens = (text = "") => Math.ceil((text || "").length / 4);

  // ✅ Load guest stats from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(GUEST_STATS_KEY);
      if (saved) {
        const stats = JSON.parse(saved);
        const today = new Date().toDateString();
        
        // Reset daily limits if it's a new day
        if (stats.lastReset !== today) {
          const resetStats = {
            requestsUsed: 0,
            inputTokensUsed: 0,
            outputTokensUsed: 0,
            filesUploaded: 0,
            lastReset: today
          };
          setGuestStats(resetStats);
          localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(resetStats));
        } else {
          setGuestStats(stats);
        }
      }
    } catch (error) {
      console.warn("Failed to load guest stats:", error);
    }
  }, []);

  // ✅ Save guest stats to localStorage
  useEffect(() => {
    localStorage.setItem(GUEST_STATS_KEY, JSON.stringify(guestStats));
  }, [guestStats]);

  // ✅ Format error messages (same as main page)
  const formatLimitError = (type: "input" | "output" | "request" | "file_count" | "file_size", needed: number, balance: number, fileName?: string) => {
    if (type === "request") {
      return `Daily request limit reached (${balance} requests per day). Limits reset at midnight.`;
    }
    if (type === "file_count") {
      return `File count limit exceeded. You can upload up to ${balance} files per day. Limits reset at midnight.`;
    }
    if (type === "file_size") {
      return `File "${fileName}" exceeds the size limit of ${balance}MB.`;
    }
    const shortType = type === "input" ? "Input" : "Output";
    return `${shortType} token limit reached. Your ${type} requires ${needed} tokens but you have ${balance} remaining. Limits reset at midnight.`;
  };

  // ✅ Validate guest limits before actions
  const validateGuestLimits = (inputTokens: number, estimatedOutputTokens: number, fileCount: number = 0) => {
    const remainingRequests = guestLimits.maxRequests - guestStats.requestsUsed;
    const remainingInputTokens = guestLimits.maxInputTokens - guestStats.inputTokensUsed;
    const remainingOutputTokens = guestLimits.maxOutputTokens - guestStats.outputTokensUsed;
    const remainingFileUploads = guestLimits.maxFileCount - guestStats.filesUploaded;

    if (remainingRequests <= 0) {
      setTokenErrorMsg(formatLimitError("request", 1, guestLimits.maxRequests));
      return false;
    }

    if (inputTokens > remainingInputTokens) {
      setTokenErrorMsg(formatLimitError("input", inputTokens, remainingInputTokens));
      return false;
    }

    if (estimatedOutputTokens > remainingOutputTokens) {
      setTokenErrorMsg(formatLimitError("output", estimatedOutputTokens, remainingOutputTokens));
      return false;
    }

    if (fileCount > 0 && guestStats.filesUploaded + fileCount > guestLimits.maxFileCount) {
      setTokenErrorMsg(formatLimitError("file_count", fileCount, remainingFileUploads));
      return false;
    }

    return true;
  };

  // ✅ File validation with guest limits
  const validateFiles = (files: File[], allowedTypes: string[]) => {
    // Check if adding these files would exceed daily limit
    if (guestStats.filesUploaded + files.length > guestLimits.maxFileCount) {
      setTokenErrorMsg(formatLimitError("file_count", files.length, guestLimits.maxFileCount - guestStats.filesUploaded));
      return false;
    }
    
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const mime = file.type;
      
      if (!allowedTypes.includes(mime) && !allowedTypes.includes("." + ext)) {
        setTokenErrorMsg(`File "${file.name}" is not a supported format.`);
        return false;
      }
      
      if (file.size > guestLimits.maxFileSizeMB * 1024 * 1024) {
        setTokenErrorMsg(formatLimitError("file_size", Math.ceil(file.size / (1024 * 1024)), guestLimits.maxFileSizeMB, file.name));
        return false;
      }
    }
    return true;
  };

  // File change handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (validateFiles(files, SUPPORTED_FILE_TYPES)) {
      setSelectedFiles(files);
      setTokenErrorMsg("");
    }
    setShowUploadOptions(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (validateFiles(files, SUPPORTED_IMAGE_TYPES)) {
      setSelectedImages(files);
      setTokenErrorMsg("");
    }
    setShowUploadOptions(false);
  };

  // File removal functions
  const removeFile = (idx: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== idx));
  };

  const removeImage = (idx: number) => {
    setSelectedImages(images => images.filter((_, i) => i !== idx));
  };

  // Clear token error when user types
  useEffect(() => {
    setTokenErrorMsg("");
  }, [input]);

  // Close upload menu when clicking outside
  useEffect(() => {
    if (!showUploadOptions) return;
    const handler = (e: MouseEvent) => {
      const menu = document.getElementById("guest-upload-menu");
      if (menu && !menu.contains(e.target as Node)) setShowUploadOptions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUploadOptions]);

  // Inject scrollbar styles matching the main page
  useEffect(() => {
    const styleId = 'guest-chatbot-scrollbar-styles';
    
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .guest-chatbot-container ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .guest-chatbot-container ::-webkit-scrollbar-track {
        background: rgba(30, 58, 138, 0.4);
        border-radius: 4px;
      }

      .guest-chatbot-container ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(14, 165, 233, 0.8), rgba(6, 182, 212, 0.8));
        border-radius: 4px;
        border: 1px solid rgba(30, 58, 138, 0.6);
      }

      .guest-chatbot-container ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(14, 165, 233, 1), rgba(6, 182, 212, 1));
      }

      .guest-chatbot-container ::-webkit-scrollbar-corner {
        background: rgba(30, 58, 138, 0.4);
      }

      .guest-chatbot-container * {
        scrollbar-width: thin;
        scrollbar-color: rgba(6, 182, 212, 0.8) rgba(30, 58, 138, 0.4);
      }

      .guest-messages-scroll ::-webkit-scrollbar {
        width: 6px;
      }

      .guest-messages-scroll ::-webkit-scrollbar-track {
        background: rgba(30, 58, 138, 0.2);
        border-radius: 3px;
      }

      .guest-messages-scroll ::-webkit-scrollbar-thumb {
        background: rgba(6, 182, 212, 0.6);
        border-radius: 3px;
      }

      .guest-messages-scroll ::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.8);
      }

      .sidebar-scroll ::-webkit-scrollbar {
        width: 6px;
      }

      .sidebar-scroll ::-webkit-scrollbar-track {
        background: rgba(30, 58, 138, 0.3);
        border-radius: 3px;
      }

      .sidebar-scroll ::-webkit-scrollbar-thumb {
        background: rgba(6, 182, 212, 0.7);
        border-radius: 3px;
      }

      .sidebar-scroll ::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.9);
      }
    `;
    
    document.head.appendChild(style);

    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  // Load messages from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedMessages = JSON.parse(saved);
        const formattedMessages = parsedMessages.map((msg: any) => ({
          question: msg.question || "",
          answer: msg.answer || "",
          timestamp: msg.timestamp || new Date().toISOString()
        }));
        setGuestMessages(formattedMessages);
      }
    } catch (error) {
      console.warn("Failed to load guest chat history:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guestMessages));
    } catch (error) {
      console.warn("Failed to save guest chat history:", error);
    }
  }, [guestMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [guestMessages, isLoading, currentQuestion]);

  // Simulate bot response with rate limit enforcement
  const simulateBotResponse = async (userQuestion: string, files: File[] = []): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    if (files.length > 0) {
      const fileNames = files.map(f => f.name).join(", ");
      return `I can see you've uploaded ${files.length} file(s): ${fileNames}. As a guest user, I can acknowledge your files but cannot process their content. For full file analysis capabilities, please create an account!`;
    }

    const responses = [
      "As a guest user, I can help with general information. For personalized assistance, please consider creating an account.",
      "That's an interesting question! While I can provide basic help as you're using guest mode, full features are available to registered users.",
      "I'd be happy to help with that! Note that as a guest, your conversation history is stored locally on your device.",
      "Great question! For more detailed academic information and personalized responses, you might want to sign up for a full account.",
      "I can assist you with general inquiries. Keep in mind that guest sessions have limited functionality compared to registered accounts."
    ];

    const lowerQuestion = userQuestion.toLowerCase();
    if (lowerQuestion.includes("hello") || lowerQuestion.includes("hi")) {
      return "Hello! I'm your AU assistant. I'm currently running in guest mode, which means limited features but I can still help with basic questions!";
    }
    if (lowerQuestion.includes("account") || lowerQuestion.includes("sign up")) {
      return "You can create an account by clicking the login/signup option. This will give you access to full features like saving chat history across devices and personalized responses!";
    }
    if (lowerQuestion.includes("campus") || lowerQuestion.includes("university")) {
      return "I can help with general campus information! For detailed academic guidance and personalized recommendations, consider creating a registered account.";
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  // ✅ Updated handleGuestSend with rate limiting
  const handleGuestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && selectedFiles.length === 0 && selectedImages.length === 0) || isLoading) return;

    const currentInput = input.trim();
    const currentFiles = [...selectedFiles, ...selectedImages];
    const inputTokens = calcTokens(currentInput);
    const estimatedOutputTokens = Math.max(50, Math.ceil(inputTokens * 2)); // Estimate output tokens

    // ✅ Validate against guest rate limits
    if (!validateGuestLimits(inputTokens, estimatedOutputTokens, currentFiles.length)) {
      return; // Error message already set by validateGuestLimits
    }

    // Show question immediately and clear input/files
    setCurrentQuestion(currentInput);
    setInput("");
    setSelectedFiles([]);
    setSelectedImages([]);
    setTokenErrorMsg("");
    setIsLoading(true);

    try {
      // Get bot response
      const botResponse = await simulateBotResponse(currentInput, currentFiles);
      const actualOutputTokens = calcTokens(botResponse);
      
      // ✅ Update guest stats after successful request
      setGuestStats(prev => ({
        ...prev,
        requestsUsed: prev.requestsUsed + 1,
        inputTokensUsed: prev.inputTokensUsed + inputTokens,
        outputTokensUsed: prev.outputTokensUsed + actualOutputTokens,
        filesUploaded: prev.filesUploaded + currentFiles.length
      }));

      // Add message to history
      const newMessage = {
        question: currentInput + (currentFiles.length > 0 ? ` [Uploaded ${currentFiles.length} file(s)]` : ""),
        answer: botResponse,
        timestamp: new Date().toISOString()
      };

      setGuestMessages(msgs => [...msgs, newMessage]);
      setCurrentQuestion("");
    } catch (error) {
      console.error("Error generating response:", error);
      // On error, restore input and files
      setInput(currentInput);
      setSelectedFiles(currentFiles.filter(f => SUPPORTED_FILE_TYPES.some(type => f.name.toLowerCase().endsWith(type))));
      setSelectedImages(currentFiles.filter(f => SUPPORTED_IMAGE_TYPES.includes(f.type)));
      setCurrentQuestion("");
      setTokenErrorMsg("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear chat history function
  const clearChatHistory = () => {
    setGuestMessages([]);
    setCurrentQuestion("");
    setSelectedFiles([]);
    setSelectedImages([]);
    setTokenErrorMsg("");
    localStorage.removeItem(STORAGE_KEY);
    setSidebarOpen(false);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GUEST_STATS_KEY);
    window.location.href = "/modules/authentication";
  };

  // ✅ Calculate remaining limits for UI display
  const getRemainingLimits = () => {
    return {
      requests: guestLimits.maxRequests - guestStats.requestsUsed,
      inputTokens: guestLimits.maxInputTokens - guestStats.inputTokensUsed,
      outputTokens: guestLimits.maxOutputTokens - guestStats.outputTokensUsed,
      fileUploads: guestLimits.maxFileCount - guestStats.filesUploaded
    };
  };

  const remainingLimits = getRemainingLimits();

  // ✅ Render rate limit info in sidebar
  const renderRateLimitInfo = () => {
    const requestPercent = (guestStats.requestsUsed / guestLimits.maxRequests) * 100;
    const inputTokenPercent = (guestStats.inputTokensUsed / guestLimits.maxInputTokens) * 100;
    const outputTokenPercent = (guestStats.outputTokensUsed / guestLimits.maxOutputTokens) * 100;
    const filePercent = (guestStats.filesUploaded / guestLimits.maxFileCount) * 100;

    return (
      <div className="px-4 py-3 border-b border-blue-900">
        <div className="text-xs text-cyan-400 mb-2">Daily Limits (Guest)</div>
        <div className="space-y-2">
          <div>
            <div className="text-xs text-cyan-300">
              Requests: {guestStats.requestsUsed}/{guestLimits.maxRequests}
            </div>
            <div className="w-full bg-blue-800 rounded-full h-1.5">
              <div 
                className="bg-cyan-500 h-1.5 rounded-full transition-all" 
                style={{ width: `${Math.min(requestPercent, 100)}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="text-xs text-cyan-300">
              Input: {guestStats.inputTokensUsed}/{guestLimits.maxInputTokens}
            </div>
            <div className="w-full bg-blue-800 rounded-full h-1.5">
              <div 
                className="bg-cyan-500 h-1.5 rounded-full transition-all" 
                style={{ width: `${Math.min(inputTokenPercent, 100)}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="text-xs text-cyan-300">
              Output: {guestStats.outputTokensUsed}/{guestLimits.maxOutputTokens}
            </div>
            <div className="w-full bg-blue-800 rounded-full h-1.5">
              <div 
                className="bg-cyan-500 h-1.5 rounded-full transition-all" 
                style={{ width: `${Math.min(outputTokenPercent, 100)}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="text-xs text-cyan-300">
              Files: {guestStats.filesUploaded}/{guestLimits.maxFileCount}
            </div>
            <div className="w-full bg-blue-800 rounded-full h-1.5">
              <div 
                className="bg-cyan-500 h-1.5 rounded-full transition-all" 
                style={{ width: `${Math.min(filePercent, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ✅ Check if send should be disabled based on limits
  const sendDisabled = (!input.trim() && selectedFiles.length === 0 && selectedImages.length === 0) || 
                       isLoading ||
                       remainingLimits.requests <= 0 ||
                       calcTokens(input) > remainingLimits.inputTokens ||
                       Math.ceil(calcTokens(input) * 2) > remainingLimits.outputTokens;

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden guest-chatbot-container">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full flex flex-col bg-blue-950/90 border-r border-blue-900 transition-all duration-300 z-30 ${sidebarOpen ? "w-72" : "w-16"}`}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-cyan-400 hover:text-white hover:bg-cyan-700 transition-all duration-200"
            aria-label="Toggle Sidebar"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        {/* Profile Section */}
        <div className="px-4 py-4 border-b border-blue-900">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="bg-cyan-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold">
                G
              </div>
              <div>
                <div className="font-semibold text-cyan-100 text-lg">Guest User</div>
                <div className="text-xs text-cyan-400">Rate limited</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="bg-cyan-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">
                G
              </div>
            </div>
          )}
        </div>

        {/* ✅ Rate Limit Info - only show when sidebar is open */}
        {sidebarOpen && renderRateLimitInfo()}

        {/* Sidebar Actions */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="px-2 py-4">
            {sidebarOpen ? (
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  onClick={clearChatHistory}
                  disabled={guestMessages.length === 0}
                  className="w-full text-red-400 hover:bg-blue-900 hover:text-red-300 flex items-center gap-2 justify-start disabled:opacity-50"
                >
                  <Trash2 size={18} /> Clear Chat History
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearChatHistory}
                    disabled={guestMessages.length === 0}
                    className="text-red-400 hover:text-white hover:bg-red-600 transition-all duration-200 disabled:opacity-50"
                    aria-label="Clear Chat History"
                  >
                    <Trash2 size={20} />
                  </Button>
                  <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Clear Chat
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="px-2 py-4 border-t border-blue-900">
            {sidebarOpen ? (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full text-cyan-200 hover:bg-blue-900 flex items-center gap-2 justify-start"
              >
                <LogOut size={18} /> Back to Login
              </Button>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleLogout}
                    className="text-cyan-400 hover:text-white hover:bg-cyan-700 transition-all duration-200"
                    aria-label="Back to Login"
                  >
                    <LogOut size={20} />
                  </Button>
                  <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Back to Login
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${sidebarOpen ? "ml-72" : "ml-16"} transition-all duration-300`}>
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-0 py-6 z-10 guest-messages-scroll">
          <div className="max-w-2xl w-full mx-auto flex flex-col gap-2 px-4 min-h-full">
            {guestMessages.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 py-16">
                <MessageCircle className="text-cyan-400 mb-4" size={32}/>
                <h2 className="text-xl lg:text-2xl font-bold text-cyan-100 mb-2 text-center">
                  Hello Guest! 👋
                </h2>
                <p className="text-base lg:text-lg text-cyan-200 text-center max-w-md mb-6">
                  I'm your AU assistant in guest mode. You have limited daily usage - check your limits in the sidebar!
                </p>
                <div className="text-sm text-cyan-300 text-center bg-blue-900/40 px-4 py-2 rounded-lg">
                  💡 Daily limits: {guestLimits.maxRequests} requests, {guestLimits.maxInputTokens} input tokens, {guestLimits.maxOutputTokens} output tokens
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-auto">
                {guestMessages.map((msg, idx) => (
                  <div key={idx}>
                    <div className="flex justify-end mb-2">
                      <div className="max-w-[85%] bg-cyan-700 text-white px-4 py-3 rounded-2xl">
                        <div className="text-base">{msg.question}</div>
                      </div>
                    </div>
                    <div className="flex justify-start mb-4">
                      <div className="max-w-[85%] bg-blue-900/80 text-cyan-100 px-4 py-3 rounded-2xl">
                        <div className="text-base">{msg.answer}</div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {currentQuestion && (
                  <div className="flex justify-end mb-2">
                    <div className="max-w-[85%] bg-cyan-700 text-white px-4 py-3 rounded-2xl">
                      <div className="text-base">{currentQuestion}</div>
                    </div>
                  </div>
                )}
                
                {isLoading && (
                  <div className="flex justify-start mb-4">
                    <div className="max-w-[85%] bg-blue-900/80 text-cyan-100 px-4 py-3 rounded-2xl flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <div className="text-base">Thinking...</div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Section */}
        <div className="p-4 lg:p-6 bg-transparent border-t border-blue-900 flex-shrink-0 z-10">
          <form 
            className="max-w-2xl mx-auto w-full" 
            onSubmit={handleGuestSend}
          >
            <div className="flex flex-col gap-2">
              {/* ✅ Token/error message display */}
              {tokenErrorMsg && (
                <div
                  className="flex items-start gap-3 py-2 px-3 text-sm border rounded-md w-full"
                  style={{ backgroundColor: "rgba(220,38,38,0.06)", borderColor: "rgba(220,38,38,0.16)" }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    className="text-red-600 flex-shrink-0"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden
                  >
                    <path d="M13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V12Z" fill="currentColor"></path>
                    <path d="M12 9.5C12.6904 9.5 13.25 8.94036 13.25 8.25C13.25 7.55964 12.6904 7 12 7C11.3096 7 10.75 7.55964 10.75 8.25C10.75 8.94036 11.3096 9.5 12 9.5Z" fill="currentColor"></path>
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12C20 16.4183 16.4183 20 12 20C7.58172 20 4 16.4183 4 12Z" fill="currentColor"></path>
                  </svg>
                  <div className="text-red-700 leading-5">{tokenErrorMsg}</div>
                </div>
              )}

              <div className="relative flex items-center">
                {/* Upload button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-cyan-400 hover:text-white hover:bg-cyan-700"
                  onClick={() => setShowUploadOptions(o => !o)}
                  tabIndex={0}
                  aria-label="Upload files"
                  disabled={remainingLimits.fileUploads <= 0}
                >
                  <Plus size={22} />
                </Button>

                {/* Upload options menu */}
                {showUploadOptions && (
                  <div id="guest-upload-menu" className="absolute left-2 bottom-14 bg-blue-900 border border-blue-800 rounded-lg shadow-lg z-50 flex flex-col min-w-[140px]">
                    <Button
                      variant="ghost"
                      className="flex gap-2 items-center text-cyan-200 hover:bg-blue-800 px-3 py-2 justify-start rounded-t-lg"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={remainingLimits.fileUploads <= 0}
                    >
                      <Upload size={18} /> Upload Files
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex gap-2 items-center text-cyan-200 hover:bg-blue-800 px-3 py-2 justify-start rounded-b-lg"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={remainingLimits.fileUploads <= 0}
                    >
                      <ImageIcon size={18} /> Upload Images
                    </Button>
                  </div>
                )}

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={SUPPORTED_FILE_TYPES.join(",")}
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept={SUPPORTED_IMAGE_TYPES.join(",")}
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />

                <Input
                  ref={guestInputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your message or upload files... (Guest Mode - Limited)"
                  className="w-full bg-blue-900/80 text-white placeholder-white border border-black h-12 px-12 pr-20 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-700/30"
                  autoComplete="off"
                  disabled={isLoading}
                />
                
                {/* Send button */}
                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-cyan-700 text-white hover:bg-cyan-800 h-10 w-10 rounded-xl p-0 flex items-center justify-center disabled:opacity-50"
                  disabled={sendDisabled}
                  aria-label="Send"
                >
                  <Send size={20} />
                </Button>
              </div>

              {/* Selected files display */}
              {(selectedFiles.length > 0 || selectedImages.length > 0) && (
                <div className="mt-2 flex gap-4 flex-wrap text-cyan-200 text-sm">
                  {selectedFiles.map((file, idx) => (
                    <span key={file.name + idx} className="flex items-center bg-blue-900 px-2 py-1 rounded-lg mr-2 mb-2">
                      📄 {file.name}
                      <button
                        type="button"
                        className="ml-2 text-red-400 hover:text-red-600"
                        onClick={() => removeFile(idx)}
                        aria-label="Remove file"
                      >
                        <XIcon size={16} />
                      </button>
                    </span>
                  ))}
                  {selectedImages.map((img, idx) => (
                    <span key={img.name + idx} className="flex items-center bg-blue-900 px-2 py-1 rounded-lg mr-2 mb-2">
                      🖼️ {img.name}
                      <button
                        type="button"
                        className="ml-2 text-red-400 hover:text-red-600"
                        onClick={() => removeImage(idx)}
                        aria-label="Remove image"
                      >
                        <XIcon size={16} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}