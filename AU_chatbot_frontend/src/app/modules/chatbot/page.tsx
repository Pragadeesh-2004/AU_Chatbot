"use client";

import React, { useState, useEffect, useMemo, useRef  } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Menu,
  Search,
  MessageCircle,
  Trash2,
  LogOut,
  UserMinus,
  History,
  Plus,
  X as XIcon,
  Upload,
  Send,
  X,
  Loader2,
  ArrowLeft,
  Copy,
  Check
} from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import dynamic from "next/dynamic";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const GuestChatPage = dynamic(() => import("./guest-chat"), { ssr: false });

export default function ChatbotPage() {
  // Add useEffect to inject scrollbar styles at component mount
  useEffect(() => {
    // Create and inject custom scrollbar styles
    const styleId = 'chatbot-scrollbar-styles';
    
    // Remove existing styles if they exist
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new style element
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Custom scrollbar for the entire chatbot */
      .chatbot-container ::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }

      .chatbot-container ::-webkit-scrollbar-track {
        background: rgba(30, 58, 138, 0.4); /* blue-900 */
        border-radius: 4px;
      }

      .chatbot-container ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(14, 165, 233, 0.8), rgba(6, 182, 212, 0.8)); /* blue to cyan gradient */
        border-radius: 4px;
        border: 1px solid rgba(30, 58, 138, 0.6);
      }

      .chatbot-container ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, rgba(14, 165, 233, 1), rgba(6, 182, 212, 1)); /* darker on hover */
      }

      .chatbot-container ::-webkit-scrollbar-corner {
        background: rgba(30, 58, 138, 0.4);
      }

      /* Firefox scrollbar */
      .chatbot-container * {
        scrollbar-width: thin;
        scrollbar-color: rgba(6, 182, 212, 0.8) rgba(30, 58, 138, 0.4);
      }

      /* Sidebar specific scrollbar (thinner) */
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

      /* Messages area scrollbar */
      .messages-scroll ::-webkit-scrollbar {
        width: 6px;
      }

      .messages-scroll ::-webkit-scrollbar-track {
        background: rgba(30, 58, 138, 0.2);
        border-radius: 3px;
      }

      .messages-scroll ::-webkit-scrollbar-thumb {
        background: rgba(6, 182, 212, 0.6);
        border-radius: 3px;
      }

      .messages-scroll ::-webkit-scrollbar-thumb:hover {
        background: rgba(6, 182, 212, 0.8);
      }
    `;
    
    document.head.appendChild(style);

    // Cleanup function
    return () => {
      const styleElement = document.getElementById(styleId);
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, []);

  const [user, setUser] = useState({ id: "guest", name: "Guest", role: "guest" });
  const [userMemory, setUserMemory] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [composingNew, setComposingNew] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileSidebarOpen, setProfileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [input, setInput] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // Confirmation dialog state for deleting a session from profile
  const [deleteSessionDialogOpen, setDeleteSessionDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  // Confirmation dialog state for logout
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertDialogMessage, setAlertDialogMessage] = useState("");
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  // ✅ Remove selectedImages state - only keep selectedFiles for PDFs
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // ✅ Add copy state management
  const [copiedItems, setCopiedItems] = useState<{[key: string]: boolean}>({});

  // ✅ Update file types - only PDF support
  const SUPPORTED_FILE_TYPES = [".pdf", "application/pdf"];

  // helper: 1 token = 4 characters
  const calcTokens = (text = "") => Math.ceil((text || "").length / 4);

  // Get dynamic file limits from userMemory (from rate_limit data)
  const getFileLimits = () => {
    if (!userMemory) return { 
      maxCount: 3,    // fallback defaults
      maxSizeMB: 5 
    };
    return {
      maxCount: typeof userMemory.balance_file_count === "number" 
        ? Number(userMemory.balance_file_count) 
        : 3,
      maxSizeMB: typeof userMemory.file_size === "number" 
        ? Number(userMemory.file_size) 
        : 5,
    };
  };

  const fileLimits = useMemo(() => getFileLimits(), [userMemory]);

  // derive user token balances from userMemory
  const getBalances = () => {
    if (!userMemory) return { 
      input: undefined as number | undefined, 
      output: undefined as number | undefined,
      requests: undefined as number | undefined 
    };
    return {
      input: typeof userMemory.balance_input_token_per_day === "number"
        ? Number(userMemory.balance_input_token_per_day)
        : undefined,
      output: typeof userMemory.balance_output_token_per_day === "number"
        ? Number(userMemory.balance_output_token_per_day)
        : undefined,
      requests: typeof userMemory.balance_request_per_day === "number"
        ? Number(userMemory.balance_request_per_day)
        : undefined,
    };
  };

  const balances = useMemo(() => getBalances(), [userMemory]);

  const formatLimitError = (type: "input" | "output" | "request" | "file_count" | "file_size", needed: number, balance: number, fileName?: string) => {
    if (type === "request") {
      return `Request limit exhausted. You have ${balance} requests remaining. Balances reset daily at 12:00 AM.`;
    }
    if (type === "file_count") {
      return `File count limit exceeded. You can upload up to ${balance} files at once. Current limits reset daily at 12:00 AM.`;
    }
    if (type === "file_size") {
      return `File "${fileName}" exceeds the size limit of ${balance}MB. Current limits reset daily at 12:00 AM.`;
    }
    const shortType = type === "input" ? "Input" : "Output";
    return `${shortType} token exhausted. Your ${type} requires ${needed} tokens but you have ${balance}. Balances reset daily at 12:00 AM.`;
  };

  // ✅ Add copy functionality
  const copyToClipboard = async (text: string, type: 'question' | 'answer', messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      const key = `${messageIndex}-${type}`;
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      
      // Reset copy state after 2 seconds
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // ✅ Show error in alert dialog
      setAlertDialogMessage("Failed to copy text to clipboard. Please try again.");
      setAlertDialogOpen(true);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const id = window.localStorage.getItem("userId") || "guest";
      const name = window.localStorage.getItem("userName") || "Guest";
      const role = window.localStorage.getItem("userRole") || "guest";
      setUser({ id, name, role });
    }
  }, []);

  useEffect(() => {
    if (user.role === "guest") {
      setUserMemory(null);
      return;
    }
    fetch(`${API_BASE}/chatbot/user-memory?role=${user.role}&id=${user.id}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUserMemory(data);
        if (data.sessions && data.sessions.length > 0) {
          setSelectedSession(data.sessions[0].session_id);
        }
      })
      .catch(error => {
        console.error('Failed to fetch user memory:', error);
        // ✅ Show error in alert dialog
        setAlertDialogMessage("Failed to load chat history. Please refresh the page.");
        setAlertDialogOpen(true);
      });
  }, [user]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // ✅ Auto-scroll to bottom when new messages arrive or loading changes
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [userMemory, selectedSession, isLoading]);

  useEffect(() => {
    setInput("");
  }, [selectedSession]);

  const filteredSessions = userMemory?.sessions?.filter((session: any) =>
    session.session_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const messages = userMemory?.sessions?.find((s: any) => s.session_id === selectedSession)?.qa || [];

  // ✅ Update validateFiles to only handle PDF files and show errors in alert dialog
  // ✅ Limit to 1 PDF per request
  const validateFiles = (files: File[]) => {
    const { maxCount, maxSizeMB } = fileLimits;
    
    // ✅ Only allow 1 PDF per request
    if (files.length > 1) {
      setAlertDialogMessage("You can only upload 1 PDF file per message. Please select only one file.");
      setAlertDialogOpen(true);
      return false;
    }
    
    if (files.length > maxCount) {
      const errorMsg = formatLimitError("file_count", files.length, maxCount);
      setAlertDialogMessage(errorMsg);
      setAlertDialogOpen(true);
      return false;
    }
    
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const mime = file.type;
      
      // ✅ Only allow PDF files
      if (mime !== "application/pdf" && ext !== "pdf") {
        setAlertDialogMessage(`File "${file.name}" is not supported. Only PDF files are allowed.`);
        setAlertDialogOpen(true);
        return false;
      }
      
      // ✅ File size limit is in MB per file
      if (file.size > maxSizeMB * 1024 * 1024) {
        const errorMsg = formatLimitError("file_size", Math.ceil(file.size / (1024 * 1024)), maxSizeMB, file.name);
        setAlertDialogMessage(errorMsg);
        setAlertDialogOpen(true);
        return false;
      }
    }
    return true;
  };

  // ✅ Update handleFileChange to only handle PDFs - limit to 1 file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // ✅ Only take the first file if multiple are selected
    const singleFile = files.length > 0 ? [files[0]] : [];
    
    if (validateFiles(singleFile)) {
      setSelectedFiles(singleFile);
    }
    setShowUploadOptions(false);
    
    // Reset file input to allow selecting the same file again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  // Simple heuristic title generator (produce 2-3 meaningful words)
  function generateTitleFromText(text: string, maxWords = 3, minWords = 2) {
    if (!text) return "New Chat";
    const cleaned = text
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[^\w\s'-]/g, ""); // remove punctuation

    if (!cleaned) return "New Chat";

    const stopwords = new Set([
      "the","a","an","to","for","of","in","on","and","or","is","are","was","were",
      "with","my","me","i","how","what","why","when","where","please","please:"
    ]);

    const tokens = cleaned.split(" ").map(t => t.trim()).filter(Boolean);
    const meaningful = tokens.filter(w => !stopwords.has(w.toLowerCase()));

    const pick = meaningful.length > 0 ? meaningful : tokens;

    // prefer 2-3 words; if there are many tokens pick the most informative first few
    const count = Math.min(maxWords, Math.max(minWords, pick.length));
    const titleWords = pick.slice(0, count);

    const capitalize = (w: string) => w[0]?.toUpperCase() + w.slice(1).toLowerCase();
    let title = titleWords.map(capitalize).join(" ");

    // fallback: if title too short or still generic, try using first 2 content words from full tokens
    if ((titleWords.length < minWords || title.match(/^(New|Chat)$/i)) && tokens.length > titleWords.length) {
      const fallback = tokens.filter(w => !stopwords.has(w.toLowerCase())).slice(0, minWords);
      if (fallback.length) title = fallback.map(capitalize).join(" ");
    }

    // limit length
    if (title.length > 40) {
      title = title.split(" ").slice(0, 3).map(capitalize).join(" ");
    }

    return title || "New Chat";
  }

  // Helper to get memory limits for the current user
  const getUserMemoryLimits = () => {
    // userMemory from /chatbot/user-memory returns the user object (or null)
    if (!userMemory) return { used: 0, max: 0 };
    return {
      used: userMemory.memory_count_used ?? 0,
      max: userMemory.memory_count ?? 0,
    };
  };

  // create session helper that shows dialog on memory-limit error
  async function createSession(session_name: string) {
    try {
      const res = await fetch(`${API_BASE}/chatbot/add-session`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: user.role, id: user.id, session_name })
      });

      const text = await res.text().catch(() => "");
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {}

      if (res.ok) {
        return json?.session_id ?? null;
      }

      // ✅ For session creation errors, throw error to be caught by handleSend
      const msg = json?.message ?? json?.error ?? json ?? text ?? "Failed to create session.";
      throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));

    } catch (error) {
      console.error('Error creating session:', error);
      throw error; // Re-throw to be handled by handleSend
    }
  }

  const handleNewChat = async () => {
    const { used, max } = getUserMemoryLimits();
    if (max > 0 && used >= max) {
      setAlertDialogMessage(
        `Memory limit reached. You have used ${used}/${max} saved chats. Please delete old chats to create a new one.`
      );
      setAlertDialogOpen(true);
      return;
    }
    setSelectedSession(null);
    setInput("");
    setComposingNew(true);
    // leave userMemory unchanged; UI will show empty message area for new chat
  };

  // Update the handleSend function to show the question immediately
  const [currentQuestion, setCurrentQuestion] = useState<string>("");

  const handleSend = async () => {
    // ✅ Remove selectedImages from validation
    if (!input.trim() && selectedFiles.length === 0) return;

    // Store current input and files
    const currentInput = input.trim();
    const currentFiles = [...selectedFiles];

    // ✅ Only check input tokens and requests upfront - let server handle output token validation
    const currentInputTokens = calcTokens(currentInput);
    
    // Check if user has sufficient input tokens and requests before proceeding
    if (balances.input !== undefined && currentInputTokens > balances.input) {
      const errorMsg = formatLimitError("input", currentInputTokens, balances.input);
      setAlertDialogMessage(errorMsg);
      setAlertDialogOpen(true);
      return;
    }
    
    if (balances.requests !== undefined && balances.requests <= 0) {
      const errorMsg = formatLimitError("request", 1, balances.requests);
      setAlertDialogMessage(errorMsg);
      setAlertDialogOpen(true);
      return;
    }

    // ✅ Remove the output token pre-validation - let the server handle it with actual response

    // ✅ Show question immediately and clear input
    setCurrentQuestion(currentInput);
    setInput("");
    setSelectedFiles([]);
    setIsLoading(true); // Start loading immediately

    try {
      let sessionId = selectedSession;

      // create session on first send if needed
      if (!sessionId) {
        const generatedTitle = generateTitleFromText(currentInput, 3, 2);
        sessionId = await createSession(generatedTitle);
        if (!sessionId) {
          // ✅ On session creation error, restore everything and show error in alert
          setCurrentQuestion("");
          setInput(currentInput);
          setSelectedFiles(currentFiles);
          setIsLoading(false);
          setAlertDialogMessage("Failed to create new chat session. Please try again.");
          setAlertDialogOpen(true);
          return;
        }
        setSelectedSession(sessionId);
        setComposingNew(false);
      }

      // Prepare files data for backend - only PDF files now
      const filesData = currentFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      }));

      // ✅ Make the API call - keep loader running during this time
      const res = await fetch(`${API_BASE}/chatbot/add-qa`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: user.role,
          id: user.id,
          session_id: sessionId,
          question: currentInput,
          timestamp: new Date().toISOString(),
          files: filesData.length > 0 ? filesData : undefined
        })
      });

      const text = await res.text().catch(() => "");
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {}

      if (!res.ok) {
        // ✅ On API error, restore form and show error in alert dialog
        setCurrentQuestion("");
        setInput(currentInput);
        setSelectedFiles(currentFiles);
        setIsLoading(false);
        
        // ✅ Extract error message for alert dialog - handle the exact error format you're getting
        let errorMessage = "Failed to send message. Please try again.";
        
        console.log('Error response:', { json, text, status: res.status }); // Debug log
        
        // ✅ Handle the specific error format from your backend
        const code = json?.code;
        if (code === "INPUT_TOKEN_EXHAUSTED" || 
            code === "OUTPUT_TOKEN_EXHAUSTED" || 
            code === "REQUEST_LIMIT_EXHAUSTED" || 
            code === "FILE_COUNT_EXHAUSTED" || 
            code === "FILE_SIZE_EXCEEDED") {
          
          // ✅ Use the server's error message directly since it has the actual token counts
          errorMessage = json.message || json.error || errorMessage;
          
          console.log('Token limit error detected:', { code, message: errorMessage }); // Debug log
          
        } else if (json?.message) {
          errorMessage = typeof json.message === "string" ? json.message : JSON.stringify(json.message);
        } else if (json?.error) {
          errorMessage = json.error;
        } else if (json) {
          errorMessage = JSON.stringify(json);
        } else if (text) {
          errorMessage = text;
        }
        
        console.log('Final error message:', errorMessage); // Debug log
        
        // ✅ Show error in alert dialog
        setAlertDialogMessage(errorMessage);
        setAlertDialogOpen(true);
        return;
      }

      // ✅ SUCCESS: Keep loading while refreshing data
      setCurrentQuestion("");
      
      // Refresh memory/balances to show the new message with real bot response
      try {
        const memRes = await fetch(`${API_BASE}/chatbot/user-memory?role=${user.role}&id=${user.id}`, { credentials: 'include' });
        if (memRes.ok) {
          const memData = await memRes.json();
          setUserMemory(memData);
        } else {
          throw new Error('Failed to refresh conversation');
        }
      } catch (refreshError) {
        console.error('Failed to refresh conversation:', refreshError);
        setAlertDialogMessage("Message sent but failed to refresh conversation. Please reload the page.");
        setAlertDialogOpen(true);
      }

      if (!selectedSession) setSelectedSession(sessionId);

    } catch (err: any) {
      console.error('Unexpected error in handleSend:', err);
      
      // ✅ On unexpected error, restore form and show error in alert dialog
      setCurrentQuestion("");
      setInput(currentInput);
      setSelectedFiles(currentFiles);
      
      let errorMessage = "An unexpected error occurred while sending your message.";
      if (err?.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // ✅ Show error in alert dialog
      setAlertDialogMessage(errorMessage);
      setAlertDialogOpen(true);
    } finally {
      // ✅ Always stop loading when everything is done
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (session_id: string) => {
    try {
      const res = await fetch(`${API_BASE}/chatbot/delete-session`, {
        method: "DELETE",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: user.role, id: user.id, session_id })
      });

      if (!res.ok) {
        throw new Error('Failed to delete chat session');
      }

      setSelectedSession(null);
      setInput("");
      
      // Refresh user memory
      const memRes = await fetch(`${API_BASE}/chatbot/user-memory?role=${user.role}&id=${user.id}`, { credentials: 'include' });
      if (memRes.ok) {
        const data = await memRes.json();
        setUserMemory(data);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      setAlertDialogMessage("Failed to delete chat session. Please try again.");
      setAlertDialogOpen(true);
    }
  };

  const handleDeleteUser = async () => {
    setDeleteDialogOpen(false);
    try {
      const res = await fetch(`${API_BASE}/chatbot/delete-user`, {
        method: "DELETE",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: user.role, id: user.id })
      });
      
      if (res.ok) {
        setAlertDialogMessage("Your account and memory have been removed. Redirecting to login...");
        setAlertDialogOpen(true);
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("userId");
          window.localStorage.removeItem("userName");
          window.localStorage.removeItem("userRole");
        }
        setUser({ id: "guest", name: "Guest", role: "guest" });
        setUserMemory(null);
        setSelectedSession(null);
        setInput("");
        setTimeout(() => {
          setAlertDialogOpen(false);
          window.location.href = "/modules/authentication";
        }, 1800);
      } else {
        setAlertDialogMessage("Could not delete your account. Please try again.");
        setAlertDialogOpen(true);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setAlertDialogMessage("An error occurred while deleting your account. Please try again.");
      setAlertDialogOpen(true);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("userId");
      window.localStorage.removeItem("userName");
      window.localStorage.removeItem("userRole");
    }
    setUser({ id: "guest", name: "Guest", role: "guest" });
    setUserMemory(null);
    setSelectedSession(null);
    setInput("");
    window.location.href = "/modules/authentication";
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    if (!showUploadOptions) return;
    const handler = (e: MouseEvent) => {
      const menu = document.getElementById("upload-menu");
      if (menu && !menu.contains(e.target as Node)) setShowUploadOptions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showUploadOptions]);

  if (user.role === "guest") {
    return <GuestChatPage />;
  }

  // compute upload disable flag and token estimates (used by JSX)
  // treat balances as "not loaded" while userMemory is null — don't block sends until loaded
  const balancesLoaded = userMemory !== null;
  const tokensExhausted =
    typeof balances.input === "number" &&
    typeof balances.output === "number" &&
    balances.input <= 0 &&
    balances.output <= 0;

  // Check if user has insufficient file limits
  const fileLimitsExhausted = 
    typeof fileLimits.maxCount === "number" && fileLimits.maxCount <= 0 ||
    typeof fileLimits.maxSizeMB === "number" && fileLimits.maxSizeMB <= 0;

  const requestsExhausted = 
    typeof balances.requests === "number" && balances.requests <= 0;

  // Disable uploads when any limit is exhausted
  const uploadsDisabled = tokensExhausted || requestsExhausted || fileLimitsExhausted;

  // Disable the send button if no content, guest user, or request limit exhausted
  const sendDisabled = (!input.trim() && selectedFiles.length === 0) || 
                       user.role === "guest" || 
                       requestsExhausted;

  // ✅ Disable upload button when a PDF is already selected
  const uploadButtonDisabled = uploadsDisabled || selectedFiles.length > 0;

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden chatbot-container">
      {!profileSidebarOpen && (
        <div className={`fixed top-0 left-0 h-full flex flex-col bg-blue-950/90 border-r border-blue-900 transition-all duration-300 z-30 ${sidebarOpen ? "w-72" : "w-16"}`}>
          <div className="flex items-center gap-2 px-3 py-4 justify-start">
            <Button variant="ghost" size="icon" className="text-cyan-300 hover:bg-blue-900"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
            <span className={`ml-2 text-cyan-100 font-bold text-lg transition-all duration-300 ${sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}>
              AU Chatbot
            </span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 cursor-pointer"
            onClick={() => { setSidebarOpen(false); setProfileSidebarOpen(true); }}
          >
            <div className={`bg-cyan-700 text-white rounded-full flex items-center justify-center font-bold transition-all duration-300 ${sidebarOpen ? "w-10 h-10 text-lg" : "w-8 h-8 text-base"}`}>
              {user.name ? user.name.split(" ").map(s => s[0]).join("").toUpperCase() : "G"}
            </div>
            {sidebarOpen && <span className="text-cyan-100 font-semibold text-base">{user.name || "Guest"}</span>}
          </div>
          <div className="flex flex-col gap-2 px-4 py-2">
            {sidebarOpen ? (
              <>
                <Button onClick={handleNewChat} disabled={user.role === "guest"}
                  className="bg-cyan-700 hover:bg-cyan-800 text-white flex items-center gap-2 justify-start rounded-lg w-full">
                  <Plus size={18} /> New Chat
                </Button>
                <div className="relative w-full">
                  <Input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search chats..." className="bg-blue-900/80 text-cyan-100 placeholder-cyan-400 border border-blue-800 h-9 pl-9 pr-2 text-sm rounded-lg"/>
                  <Search size={16} className="absolute left-2 top-2.5 text-cyan-400" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleNewChat} 
                    disabled={user.role === "guest"}
                    className="text-cyan-400 hover:text-white hover:bg-cyan-700 transition-all duration-200"
                    aria-label="New Chat"
                  >
                    <Plus size={20} />
                  </Button>
                  <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    New Chat
                  </div>
                </div>

                <div className="relative group">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setSidebarOpen(true)}
                    className="text-cyan-400 hover:text-white hover:bg-cyan-700 transition-all duration-200"
                    aria-label="Search Chats"
                  >
                    <Search size={20} />
                  </Button>
                  <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Search Chats
                  </div>
                </div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto px-4 py-2 sidebar-scroll">
              <div className="text-cyan-400 font-semibold mb-2">
                <History size={16} className="inline-block mr-1" /> Chats
              </div>
              {filteredSessions.length === 0 && <div className="text-cyan-300 text-xs">No chats found.</div>}
              {filteredSessions.map((session: any, idx: number) => (
                <div key={`${session.session_id}-${idx}`}
                  className={`flex items-center group px-2 py-2 rounded-lg cursor-pointer mb-1 transition-colors hover:bg-blue-900/80 ${selectedSession === session.session_id ? "bg-cyan-800/80" : ""}`}
                  onClick={() => {
                    setSelectedSession(session.session_id);
                    setInput("");
                  }}
                >
                  <MessageCircle size={20} className="text-cyan-400 flex-shrink-0"/>
                  <div className="flex-1 ml-2">
                    <div className="text-cyan-100 text-sm font-medium truncate">{session.session_name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {profileSidebarOpen && (
        <div className="fixed top-0 left-0 h-full w-72 bg-blue-950/95 border-r border-blue-900 z-40 flex flex-col shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between px-4 py-4 border-b border-blue-900">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setProfileSidebarOpen(false);  
                  setSidebarOpen(true);          
                }}
                className="bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg mr-2"
                aria-label="Back to main sidebar"
              >
                <ArrowLeft size={20} />
              </Button>
              <div className="bg-cyan-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold">
                {user.name ? user.name.split(" ").map(s => s[0]).join("").toUpperCase() : "G"}
              </div>
              <div>
                <div className="font-semibold text-cyan-100 text-lg">{user.name || "Guest"}</div>
                <div className="text-xs text-cyan-400">{user.role || "guest"}</div>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 sidebar-scroll">
            <div className="text-cyan-400 font-semibold mb-2">
              <History size={16} className="inline-block mr-1" /> Chats
            </div>
            {userMemory?.sessions?.length === 0 && <div className="text-cyan-300 text-xs">No chats found.</div>}
            {userMemory?.sessions?.map((session: any, idx: number) => (
              <div key={`${session.session_id}-${idx}`}
                className={`flex items-center group px-2 py-2 rounded-lg cursor-pointer mb-1 transition-colors hover:bg-blue-900/80 ${selectedSession === session.session_id ? "bg-cyan-800/80" : ""}`}
                onClick={() => {
                  setSelectedSession(session.session_id);
                  setInput("");
                }}
              >
                <MessageCircle size={20} className="text-cyan-400 flex-shrink-0"/>
                <div className="flex-1 ml-2">
                  <div className="text-cyan-100 text-sm font-medium truncate">{session.session_name}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:bg-blue-900 ml-2"
                  onClick={e => {
                    e.stopPropagation();
                    if (user.role === "guest") return;
                    setSessionToDelete(session.session_id);
                    setDeleteSessionDialogOpen(true);
                  }}
                  disabled={user.role === "guest"}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 px-4 py-4 border-t border-blue-900">
            <Button
              variant="ghost"
              className="text-cyan-200 hover:bg-blue-900 flex items-center gap-2 justify-start"
              onClick={() => setLogoutDialogOpen(true)}
            >
              <LogOut size={18}/> Logout
            </Button>
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-red-400 hover:bg-blue-900 flex items-center gap-2 justify-start"
                  disabled={user.role === "guest"}
                >
                  <UserMinus size={18}/> Delete Account
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-blue-950 border-blue-900 text-cyan-100 max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-bold text-lg text-red-400">
                    Delete Account?
                  </DialogTitle>
                </DialogHeader>
                <div className="py-2 text-cyan-200">
                  Are you sure you want to delete your account? This action cannot be undone and all your chats will be permanently removed.
                </div>
                <DialogFooter className="gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setDeleteDialogOpen(false)}
                    className="bg-blue-900 text-cyan-100 border-blue-800 hover:bg-blue-800 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteUser}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Yes, Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
      <div className={`flex-1 flex flex-col ${sidebarOpen || profileSidebarOpen ? "ml-16 md:ml-72" : "ml-16"} transition-all duration-300`}>
        <div className="flex-1 overflow-y-auto px-0 py-6 z-10 messages-scroll">
          <div className="max-w-2xl w-full mx-auto flex flex-col gap-2 px-4 min-h-full">
            {messages.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 py-16">
                <MessageCircle className="text-cyan-400 mb-4" size={32}/>
                <h2 className="text-xl lg:text-2xl font-bold text-cyan-100 mb-2 text-center">
                  Welcome, {(user.name || "Guest").split(' ')[0]}! 👋
                </h2>
                <p className="text-base lg:text-lg text-cyan-200 text-center max-w-md mb-6">
                  I'm your AU assistant. Ask me anything about campus life, academics, or upload a PDF for analysis!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-auto">
                {/* ✅ Show all existing messages with copy functionality and PDF indicators */}
                {messages.map((msg: any, idx: number) => (
                  <div key={idx}>
                    {/* User Question */}
                    <div className="flex justify-end mb-2">
                      <div className="max-w-[90%] flex flex-col items-end gap-1">
                        {/* ✅ Show PDF indicator if files were attached to this message */}
                        {msg.files && msg.files.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-1">
                            {msg.files.map((file: any, fileIdx: number) => (
                              <div 
                                key={fileIdx}
                                className="flex items-center gap-1 bg-cyan-800 text-white px-2 py-1 rounded-lg text-xs"
                              >
                                <span>📄</span>
                                <span className="max-w-[150px] truncate">{file.name || 'Document.pdf'}</span>
                                <span className="text-cyan-300 text-[10px]">
                                  ({file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'PDF'})
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Question bubble */}
                        <div className="bg-cyan-700 text-white px-4 py-3 rounded-2xl relative group">
                          <div className="text-base">{msg.question}</div>
                          {/* ✅ Copy button for question */}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-cyan-200 hover:text-white hover:bg-cyan-800"
                            onClick={() => copyToClipboard(msg.question, 'question', idx)}
                            aria-label="Copy question"
                          >
                            {copiedItems[`${idx}-question`] ? <Check size={14} /> : <Copy size={14} />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bot Answer */}
                    <div className="flex justify-start mb-4">
                      <div className="max-w-[85%] bg-blue-900/80 text-cyan-100 px-4 py-3 rounded-2xl relative group">
                        <MarkdownRenderer content={msg.answer} />
                        {/* <div className="text-base whitespace-pre-wrap">{msg.answer}</div> */}
                        {/* ✅ Copy button for answer */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-cyan-300 hover:text-white hover:bg-blue-800"
                          onClick={() => copyToClipboard(msg.answer, 'answer', idx)}
                          aria-label="Copy answer"
                        >
                          {copiedItems[`${idx}-answer`] ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* ✅ Show current question immediately when sent with PDF indicator */}
                {currentQuestion && (
                  <div className="flex justify-end mb-2">
                    <div className="max-w-[90%] flex flex-col items-end gap-1">
                      {/* Show the PDF that was just uploaded */}
                      {selectedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1">
                          {selectedFiles.map((file, fileIdx) => (
                            <div 
                              key={fileIdx}
                              className="flex items-center gap-1 bg-cyan-800 text-white px-2 py-1 rounded-lg text-xs"
                            >
                              <span>📄</span>
                              <span className="max-w-[150px] truncate">{file.name}</span>
                              <span className="text-cyan-300 text-[10px]">
                                ({(file.size / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="bg-cyan-700 text-white px-4 py-3 rounded-2xl">
                        <div className="text-base">{currentQuestion}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ✅ Show loader only when waiting for response */}
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
            
            {/* ✅ Scroll target at the very bottom */}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Input section remains at bottom */}
        <div className="p-4 lg:p-6 bg-transparent border-t border-blue-900 flex-shrink-0 z-10">
          <form className="max-w-2xl mx-auto w-full" onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <div className="flex flex-col gap-2">
              <div className="relative flex items-center">
                {/* ✅ Upload button - disabled when a PDF is already selected */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`absolute left-2 top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
                    uploadButtonDisabled 
                      ? 'text-gray-500 cursor-not-allowed opacity-50' 
                      : 'text-cyan-400 hover:text-white hover:bg-cyan-700'
                  }`}
                  onClick={() => { 
                    if (!uploadButtonDisabled) setShowUploadOptions(o => !o); 
                  }}
                  tabIndex={0}
                  aria-label="Upload PDF"
                  disabled={uploadButtonDisabled}
                  title={selectedFiles.length > 0 ? "Remove current PDF to upload another" : "Upload PDF"}
                >
                  <Plus size={22} />
                </Button>

                {/* ✅ Simplified upload options - only PDF */}
                {showUploadOptions && !uploadButtonDisabled && (
                  <div id="upload-menu" className="absolute left-2 bottom-14 bg-blue-900 border border-blue-800 rounded-lg shadow-lg z-50 flex flex-col min-w-[140px]">
                    <Button
                      variant="ghost"
                      className="flex gap-2 items-center text-cyan-200 hover:bg-blue-800 px-3 py-2 justify-start rounded-lg"
                      onClick={() => { 
                        if (!uploadButtonDisabled) fileInputRef.current?.click(); 
                        setShowUploadOptions(false);
                      }}
                      disabled={uploadButtonDisabled}
                    >
                      <Upload size={18} /> Upload PDF
                    </Button>
                  </div>
                )}

                {/* ✅ Only PDF file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                  disabled={uploadButtonDisabled}
                />

                <Input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={selectedFiles.length > 0 ? "Add a message about this PDF..." : "Type your message or upload a PDF..."}
                  className="w-full bg-blue-900/80 text-white placeholder-white border border-black h-12 px-12 pr-20 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-700/30"
                  autoComplete="off"
                  disabled={user.role === "guest"}
                />

                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-cyan-700 text-white hover:bg-cyan-800 h-10 w-10 rounded-xl p-0 flex items-center justify-center disabled:opacity-50"
                  disabled={sendDisabled || isLoading}
                  aria-label="Send"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </Button>
              </div>

              {/* ✅ Show PDF files with improved styling and remove button */}
              {selectedFiles.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap text-cyan-200 text-sm">
                  {selectedFiles.map((file, idx) => (
                    <div 
                      key={file.name + idx} 
                      className="flex items-center bg-blue-900/90 border border-blue-800 px-3 py-2 rounded-lg group hover:bg-blue-800 transition-colors duration-200"
                    >
                      <span className="text-lg mr-2">📄</span>
                      <div className="flex flex-col mr-3">
                        <span className="text-cyan-100 font-medium text-sm">{file.name}</span>
                        <span className="text-cyan-400 text-xs">
                          {(file.size / 1024).toFixed(1)} KB • PDF
                        </span>
                      </div>
                      <button
                        type="button"
                        className="ml-auto text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded p-1 transition-colors duration-200"
                        onClick={() => removeFile(idx)}
                        aria-label="Remove PDF"
                        title="Remove PDF"
                      >
                        <XIcon size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* ✅ Show helper text when PDF is selected */}
              {selectedFiles.length > 0 && (
                <div className="text-cyan-400 text-xs flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-cyan-400 rounded-full"></span>
                  <span>Remove the PDF above to upload a different file</span>
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
      
      {/* ✅ Enhanced AlertDialog with UI-matching colors */}
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 text-cyan-100 shadow-2xl max-w-md mx-4 z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-cyan-100 mb-2">
              {alertDialogMessage.includes("removed") || alertDialogMessage.includes("deleted") ? (
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  Account Deleted
                </span>
              ) : alertDialogMessage.includes("limit") || alertDialogMessage.includes("exhausted") || alertDialogMessage.includes("exceeded") ? (
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  Limit Exceeded
                </span>
              ) : alertDialogMessage.includes("Failed") || alertDialogMessage.includes("Error") || alertDialogMessage.includes("error") ? (
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✕</span>
                  </div>
                  Error
                </span>
              ) : alertDialogMessage.includes("copy") || alertDialogMessage.includes("clipboard") ? (
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center">
                    <Copy size={14} className="text-white" />
                  </div>
                  Copy Error
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">i</span>
                  </div>
                  Notice
                </span>
              )}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-2 text-cyan-200 leading-relaxed">
            {alertDialogMessage}
          </div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              className="bg-gradient-to-r from-blue-800 to-blue-700 text-cyan-100 border border-blue-600 hover:from-blue-700 hover:to-blue-600 hover:text-white transition-all duration-200 px-6 py-2 rounded-lg font-medium"
              onClick={() => setAlertDialogOpen(false)}
            >
              OK
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Session (from profile) */}
      <AlertDialog open={deleteSessionDialogOpen} onOpenChange={(v) => { if (!v) { setSessionToDelete(null); } setDeleteSessionDialogOpen(v); }}>
        <AlertDialogContent className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 text-cyan-100 shadow-2xl max-w-md mx-4 z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-amber-400 mb-2">
              Delete Chat?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-2 text-cyan-200 leading-relaxed">
            Are you sure you want to permanently delete this chat? This action cannot be undone.
          </div>
          <AlertDialogFooter className="mt-4 flex gap-2">
            <AlertDialogCancel
              className="bg-gradient-to-r from-blue-800 to-blue-700 text-cyan-100 border border-blue-600 hover:from-blue-700 hover:to-blue-600 hover:text-white transition-all duration-200 px-6 py-2 rounded-lg font-medium"
              onClick={() => {
                setDeleteSessionDialogOpen(false);
                setSessionToDelete(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 rounded-lg"
              onClick={() => {
                const id = sessionToDelete;
                setDeleteSessionDialogOpen(false);
                setSessionToDelete(null);
                if (id) handleDeleteChat(id);
              }}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Logout */}
      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 text-cyan-100 shadow-2xl max-w-md mx-4 z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-amber-400 mb-2">
              Confirm Logout
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-2 text-cyan-200 leading-relaxed">
            Are you sure you want to logout? You will be returned to the login screen.
          </div>
          <AlertDialogFooter className="mt-4 flex gap-2">
            <AlertDialogCancel
              className="bg-gradient-to-r from-blue-800 to-blue-700 text-cyan-100 border border-blue-600 hover:from-blue-700 hover:to-blue-600 hover:text-white transition-all duration-200 px-6 py-2 rounded-lg font-medium"
              onClick={() => setLogoutDialogOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="bg-red-600 text-white hover:bg-red-700 px-6 py-2 rounded-lg"
              onClick={() => {
                setLogoutDialogOpen(false);
                handleLogout();
              }}
            >
              Logout
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}