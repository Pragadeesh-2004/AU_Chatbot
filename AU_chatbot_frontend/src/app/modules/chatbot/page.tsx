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
  Image as ImageIcon,
  Send,
  X,
  Loader2,
  ArrowLeft  // ✅ Add ArrowLeft icon
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
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertDialogMessage, setAlertDialogMessage] = useState("");
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Remove hardcoded constants - we'll get these from userMemory
  // const MAX_FILE_COUNT = 3;
  // const MAX_FILE_SIZE_MB = 5;
  const SUPPORTED_FILE_TYPES = [".pdf", ".docx", ".txt"];
  const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

  const [tokenErrorMsg, setTokenErrorMsg] = useState<string>("");

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

  // clear token error when user types or balances change
  useEffect(() => {
    setTokenErrorMsg("");
  }, [input, balances.input, balances.output, balances.requests]);

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
    fetch(`${API_BASE}/chatbot/user-memory?role=${user.role}&id=${user.id}`)
      .then(res => res.json())
      .then(data => {
        setUserMemory(data);
        if (data.sessions && data.sessions.length > 0) {
          setSelectedSession(data.sessions[0].session_id);
        }
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

  const validateFiles = (files: File[], allowedTypes: string[]) => {
    const { maxCount, maxSizeMB } = fileLimits;
    
    if (files.length > maxCount) {
      setTokenErrorMsg(formatLimitError("file_count", files.length, maxCount));
      return false;
    }
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const mime = file.type;
      if (!allowedTypes.includes(mime) && !allowedTypes.includes("." + ext)) {
        setTokenErrorMsg(`File "${file.name}" is not a supported format.`);
        return false;
      }
      // ✅ This is already validating per file in MB
      if (file.size > maxSizeMB * 1024 * 1024) {
        setTokenErrorMsg(formatLimitError("file_size", Math.ceil(file.size / (1024 * 1024)), maxSizeMB, file.name));
        return false;
      }
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (validateFiles(files, SUPPORTED_FILE_TYPES)) {
      setSelectedFiles(files);
    }
    setShowUploadOptions(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (validateFiles(files, SUPPORTED_IMAGE_TYPES)) {
      setSelectedImages(files);
    }
    setShowUploadOptions(false);
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
    const res = await fetch(`${API_BASE}/chatbot/add-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: user.role, id: user.id, session_name })
    });

    const text = await res.text().catch(() => "");
    let json: any = null;
    try { json = text ? JSON.parse(text) : null; } catch {}

    if (res.ok) {
      setTokenErrorMsg(""); // clear any previous token messages
      return json?.session_id ?? null;
    }

    // extract meaningful message and code
    const code = json?.code ?? (json?.message?.code);
    const msg = json?.message ?? json?.error ?? json ?? text ?? "Failed to create session.";

    // If backend reports limit exhaustion, show inline message (not alert)
    if (code === "INPUT_TOKEN_EXHAUSTED" || code === "OUTPUT_TOKEN_EXHAUSTED" || code === "REQUEST_LIMIT_EXHAUSTED") {
      // derive needed/balance if backend provided numbers, else estimate
      const needed = json?.needed ?? calcTokens(input);
      const balance = json?.balance ?? (
        code === "INPUT_TOKEN_EXHAUSTED" ? (balances.input ?? 0) : 
        code === "OUTPUT_TOKEN_EXHAUSTED" ? (balances.output ?? 0) :
        (balances.requests ?? 0)
      );
      const type = code === "INPUT_TOKEN_EXHAUSTED" ? "input" : 
                   code === "OUTPUT_TOKEN_EXHAUSTED" ? "output" : "request";
      setTokenErrorMsg(formatLimitError(type as any, needed, balance));
      return null; // don't throw so caller can stop flow gracefully
    }

    // Non-token errors fallback to existing alert flow
    setAlertDialogMessage(typeof msg === "string" ? msg : JSON.stringify(msg));
    setAlertDialogOpen(true);
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
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
    if (!input.trim() && selectedFiles.length === 0 && selectedImages.length === 0) return;

    // Store current input and files
    const currentInput = input.trim();
    const currentFiles = [...selectedFiles];
    const currentImages = [...selectedImages];

    // ✅ Show question immediately and clear input
    setCurrentQuestion(currentInput);
    setInput("");
    setSelectedFiles([]);
    setSelectedImages([]);
    setIsLoading(true);

    try {
      let sessionId = selectedSession;

      // create session on first send if needed
      if (!sessionId) {
        const generatedTitle = generateTitleFromText(currentInput, 3, 2);
        sessionId = await createSession(generatedTitle);
        if (!sessionId) {
          // ✅ On error, restore everything and clear current question
          setCurrentQuestion("");
          setInput(currentInput);
          setSelectedFiles(currentFiles);
          setSelectedImages(currentImages);
          setIsLoading(false);
          return;
        }
        setSelectedSession(sessionId);
        setComposingNew(false);
      }

      // Prepare files data for backend
      const filesData = [
        ...currentFiles.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        })),
        ...currentImages.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      ];

      const res = await fetch(`${API_BASE}/chatbot/add-qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: user.role,
          id: user.id,
          session_id: sessionId,
          question: currentInput,
          answer: "This is a placeholder bot answer.",
          timestamp: new Date().toISOString(),
          files: filesData.length > 0 ? filesData : undefined
        })
      });

      const text = await res.text().catch(() => "");
      let json: any = null;
      try { json = text ? JSON.parse(text) : null; } catch {}

      if (!res.ok) {
        // ✅ On error, restore everything and clear current question
        setCurrentQuestion("");
        setInput(currentInput);
        setSelectedFiles(currentFiles);
        setSelectedImages(currentImages);
        
        const code = json?.code ?? (json?.message?.code);
        if (code === "INPUT_TOKEN_EXHAUSTED" || code === "OUTPUT_TOKEN_EXHAUSTED" || code === "REQUEST_LIMIT_EXHAUSTED" || code === "FILE_COUNT_EXHAUSTED" || code === "FILE_SIZE_EXCEEDED") {
          const needed = json?.needed ?? calcTokens(currentInput);
          const balance = json?.balance ?? (
            code === "INPUT_TOKEN_EXHAUSTED" ? (balances.input ?? 0) : 
            code === "OUTPUT_TOKEN_EXHAUSTED" ? (balances.output ?? 0) :
            code === "REQUEST_LIMIT_EXHAUSTED" ? (balances.requests ?? 0) :
            code === "FILE_COUNT_EXHAUSTED" ? (fileLimits.maxCount ?? 0) :
            (fileLimits.maxSizeMB ?? 0)
          );
          
          const type = 
            code === "INPUT_TOKEN_EXHAUSTED" ? "input" : 
            code === "OUTPUT_TOKEN_EXHAUSTED" ? "output" : 
            code === "REQUEST_LIMIT_EXHAUSTED" ? "request" :
            code === "FILE_COUNT_EXHAUSTED" ? "file_count" : "file_size";
            
          const fileName = code === "FILE_SIZE_EXCEEDED" ? json?.fileName : undefined;
          setTokenErrorMsg(formatLimitError(type as any, needed, balance, fileName));
          setIsLoading(false);
          return;
        }

        // other errors -> show alert dialog
        let msg = "Failed to send message.";
        if (json) {
          if (typeof json === "string") msg = json;
          else if (json.message) msg = typeof json.message === "string" ? json.message : (json.message.message ?? JSON.stringify(json.message));
          else if (json.error) msg = json.error;
          else msg = JSON.stringify(json);
        } else if (text) msg = text;
        setAlertDialogMessage(msg);
        setAlertDialogOpen(true);
        setIsLoading(false);
        return;
      }

      // ✅ SUCCESS: Clear current question and refresh data
      setCurrentQuestion("");
      setTokenErrorMsg("");
      
      // Refresh memory/balances to show the new message with bot response
      try {
        const memRes = await fetch(`${API_BASE}/chatbot/user-memory?role=${user.role}&id=${user.id}`);
        if (memRes.ok) {
          const memData = await memRes.json();
          setUserMemory(memData);
        }
      } catch {}

      if (!selectedSession) setSelectedSession(sessionId);
    } catch (err: any) {
      // ✅ On error, restore everything and clear current question
      setCurrentQuestion("");
      setInput(currentInput);
      setSelectedFiles(currentFiles);
      setSelectedImages(currentImages);
      setAlertDialogMessage(err?.message ?? "Failed to send message.");
      setAlertDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (session_id: string) => {
    await fetch(`${API_BASE}/chatbot/delete-session`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: user.role, id: user.id, session_id })
    });
    setSelectedSession(null);
    setInput("");
    fetch(`${API_BASE}/chatbot/user-memory?role=${user.role}&id=${user.id}`)
      .then(res => res.json())
      .then(data => setUserMemory(data));
  };

  const handleDeleteUser = async () => {
    setDeleteDialogOpen(false);
    const res = await fetch(`${API_BASE}/chatbot/delete-user`, {
      method: "DELETE",
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
      setAlertDialogMessage("Could not delete your account.");
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
  const removeImage = (idx: number) => {
    setSelectedImages(images => images.filter((_, i) => i !== idx));
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

  const currentInputTokens = calcTokens(input);
  const estimatedOutputTokens = Math.max(1, Math.ceil(currentInputTokens * 2));

  // Disable uploads when any limit is exhausted
  const uploadsDisabled = tokensExhausted || requestsExhausted || fileLimitsExhausted;

  // Disable the send button if no content, guest user, or request limit exhausted
  const sendDisabled = (!input.trim() && selectedFiles.length === 0 && selectedImages.length === 0) || 
                       user.role === "guest" || 
                       requestsExhausted;

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
                {/* ✅ Enhanced + button with tooltip and better visibility */}
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
                  {/* Tooltip */}
                  <div className="absolute left-12 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    New Chat
                  </div>
                </div>

                {/* ✅ Enhanced search button with tooltip and better visibility */}
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
                  {/* Tooltip */}
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
              {filteredSessions.map((session: any) => (
                <div key={session.session_id}
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
              {/* ✅ Updated back button to switch between sidebars instead of closing */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setProfileSidebarOpen(false);  // Close profile sidebar
                  setSidebarOpen(true);          // Open main sidebar
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
            {userMemory?.sessions?.map((session: any) => (
              <div key={session.session_id}
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
                <Button variant="ghost" size="icon" className="text-red-400 hover:bg-blue-900 ml-2"
                  onClick={e => { e.stopPropagation(); handleDeleteChat(session.session_id); }}
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
              onClick={handleLogout}
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
        {/* ✅ Normal flex direction for top-to-bottom conversation with auto-scroll to bottom */}
        <div className="flex-1 overflow-y-auto px-0 py-6 z-10 messages-scroll">
          <div className="max-w-2xl w-full mx-auto flex flex-col gap-2 px-4 min-h-full">
            {messages.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 py-16">
                <MessageCircle className="text-cyan-400 mb-4" size={32}/>
                <h2 className="text-xl lg:text-2xl font-bold text-cyan-100 mb-2 text-center">
                  Welcome, {(user.name || "Guest").split(' ')[0]}! 👋
                </h2>
                <p className="text-base lg:text-lg text-cyan-200 text-center max-w-md mb-6">
                  I'm your AU assistant. Ask me anything about campus life, academics, or just chat!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-auto">
                {/* ✅ Show all existing messages first */}
                {messages.map((msg: any, idx: number) => (
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
                
                {/* ✅ Show current question immediately when sent */}
                {currentQuestion && (
                  <div className="flex justify-end mb-2">
                    <div className="max-w-[85%] bg-cyan-700 text-white px-4 py-3 rounded-2xl">
                      <div className="text-base">{currentQuestion}</div>
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
              {/* compact token message placed directly above the input prompt (wider, subtle bg) */}
              {tokenErrorMsg && (
                <div
                  className="flex items-start gap-3 py-2 px-3 text-sm border rounded-md w-full max-w-3xl"
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
                {/* Upload button - disabled when tokens/requests/file limits exhausted */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 text-cyan-400"
                  onClick={() => { if (!uploadsDisabled) setShowUploadOptions(o => !o); }}
                  tabIndex={0}
                  aria-label="Upload"
                  disabled={uploadsDisabled}
                >
                  <Plus size={22} />
                </Button>

                {showUploadOptions && (
                  <div id="upload-menu" className="absolute left-12 top-0 bg-blue-900 border border-blue-800 rounded-lg shadow-lg z-50 flex flex-col">
                    <Button
                      variant="ghost"
                      className="flex gap-2 items-center text-cyan-200 hover:bg-blue-800"
                      onClick={() => { if (!uploadsDisabled) fileInputRef.current?.click(); }}
                      disabled={uploadsDisabled}
                    >
                      <Upload size={18} /> Upload Files
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex gap-2 items-center text-cyan-200 hover:bg-blue-800"
                      onClick={() => { if (!uploadsDisabled) imageInputRef.current?.click(); }}
                      disabled={uploadsDisabled}
                    >
                      <ImageIcon size={18} /> Upload Images
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept={SUPPORTED_FILE_TYPES.join(",")}
                  style={{ display: "none" }}
                  onChange={e => { if (!uploadsDisabled) handleFileChange(e); }}
                  disabled={uploadsDisabled}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept={SUPPORTED_IMAGE_TYPES.join(",")}
                  style={{ display: "none" }}
                  onChange={e => { if (!uploadsDisabled) handleImageChange(e); }}
                  disabled={uploadsDisabled}
                />

                <Input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full bg-blue-900/80 text-white placeholder-white border border-black h-12 px-12 pr-20 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-700/30"
                  autoComplete="off"
                  disabled={user.role === "guest"}
                />

                <Button
                  type="submit"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-cyan-700 text-white hover:bg-cyan-800 h-10 w-10 rounded-xl p-0 flex items-center justify-center"
                  disabled={sendDisabled || isLoading} // ✅ Disable when loading
                  aria-label="Send"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </Button>
              </div>

              {(selectedFiles.length > 0 || selectedImages.length > 0) && (
                <div className="mt-2 flex gap-4 flex-wrap text-cyan-200 text-sm">
                  {selectedFiles.map((file, idx) => (
                    <span key={file.name + idx} className="flex items-center bg-blue-900 px-2 py-1 rounded-lg mr-2 mb-2">
                      {file.name}
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
                      {img.name}
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
      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent className="bg-blue-950 border-blue-900 text-cyan-100">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {alertDialogMessage.includes("removed") ? "Account Deleted" : "Error"}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-2">{alertDialogMessage}</div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-blue-900 text-cyan-100 border border-blue-800"
              onClick={() => setAlertDialogOpen(false)}
            >
              OK
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}