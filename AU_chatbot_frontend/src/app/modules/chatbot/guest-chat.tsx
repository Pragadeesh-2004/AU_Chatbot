"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, Loader2, Menu, X, LogOut, Trash2, Copy, Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

const STORAGE_KEY = "guestChatMessages";
const GUEST_STATS_KEY = "guestStats";
const GUEST_ID_KEY = "guestId";
const GUEST_SESSION_KEY = "guestSessionId";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

function generateObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16);
  const randomHex = () => Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  return timestamp + randomHex() + randomHex();
}

export default function GuestChatPage() {
  const [input, setInput] = useState("");
  const [guestMessages, setGuestMessages] = useState<{ question: string; answer: string; timestamp: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [copiedItems, setCopiedItems] = useState<{ [key: string]: boolean }>({});
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

  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [alertDialogMessage, setAlertDialogMessage] = useState("");

  // Persist guest id and session id
  const [guestId] = useState<string>(() => {
    if (typeof window === "undefined") return generateObjectId();
    const existing = window.localStorage.getItem(GUEST_ID_KEY);
    if (existing) return existing;
    const id = generateObjectId();
    window.localStorage.setItem(GUEST_ID_KEY, id);
    return id;
  });

  const [sessionId] = useState<string>(() => {
    if (typeof window === "undefined") return generateObjectId();
    const existing = window.localStorage.getItem(GUEST_SESSION_KEY);
    if (existing) return existing;
    const id = generateObjectId();
    window.localStorage.setItem(GUEST_SESSION_KEY, id);
    return id;
  });

  const copyToClipboard = async (text: string, type: 'question' | 'answer', messageIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      const key = `${messageIndex}-${type}`;
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      setTimeout(() => setCopiedItems(prev => ({ ...prev, [key]: false })), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setAlertDialogMessage("Failed to copy text to clipboard. Please try again.");
      setAlertDialogOpen(true);
    }
  };

  useEffect(() => {
    const fetchGuestRateLimits = async () => {
      try {
        const response = await fetch(`${API_BASE}/guest-chatbot/get-limits`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          let errorMessage = 'Failed to fetch guest rate limits';
          if (response.status === 404) errorMessage = 'Guest chatbot service not available. Please contact support.';
          else if (response.status === 401) errorMessage = 'Authentication required. Guest access may be disabled.';
          else if (response.status >= 500) errorMessage = 'Server error. Please try again later.';
          setAlertDialogMessage(errorMessage);
          setAlertDialogOpen(true);
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setGuestRateLimits(data.limits);
        if (data.currentUsage) setGuestStats(data.currentUsage);
      } catch (error) {
        console.error("Failed to fetch guest rate limits:", error);
        setGuestRateLimits({
          request_per_day: 10,
          input_token_per_day: 100,
          output_token_per_day: 200,
          file_count: 0,
          file_size: 5,
          memory_count: 0
        });
      }
    };

    fetchGuestRateLimits();
  }, []);

  const getGuestLimits = () => {
    if (!guestRateLimits) return {
      maxRequests: 10,
      maxInputTokens: 100,
      maxOutputTokens: 200,
      maxFileCount: 0,
      maxFileSizeMB: 5,
      maxMemoryCount: 0
    };
    return {
      maxRequests: guestRateLimits.request_per_day || 10,
      maxInputTokens: guestRateLimits.input_token_per_day || 100,
      maxOutputTokens: guestRateLimits.output_token_per_day || 200,
      maxFileCount: guestRateLimits.file_count || 0,
      maxFileSizeMB: guestRateLimits.file_size || 5,
      maxMemoryCount: guestRateLimits.memory_count || 0
    };
  };

  const guestLimits = useMemo(() => getGuestLimits(), [guestRateLimits]);
  const calcTokens = (text = "") => Math.ceil((text || "").length / 4);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guestMessages));
    } catch (error) {
      console.warn("Failed to save guest chat history:", error);
    }
  }, [guestMessages]);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [guestMessages, isLoading, currentQuestion]);

  const simulateBotResponse = async (userQuestion: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));
    return "I apologize, but I'm unable to connect to the server right now. As a guest user, I have limited capabilities. For full access, please consider creating an account.";
  };

  const formatLimitError = (type: "input" | "output" | "request", needed: number, balance: number) => {
    if (type === "request") return `Daily request limit reached (${balance} requests per day). Limits reset at midnight.`;
    const shortType = type === "input" ? "Input" : "Output";
    return `${shortType} token limit reached. Your ${type} requires ${needed} tokens but you have ${balance} remaining. Limits reset at midnight.`;
  };

  const validateGuestLimits = (inputTokens: number, estimatedOutputTokens: number): boolean => {
    const remainingRequests = guestLimits.maxRequests - guestStats.requestsUsed;
    const remainingInputTokens = guestLimits.maxInputTokens - guestStats.inputTokensUsed;
    const remainingOutputTokens = guestLimits.maxOutputTokens - guestStats.outputTokensUsed;

    if (remainingRequests <= 0) {
      setAlertDialogMessage(formatLimitError("request", 1, guestLimits.maxRequests));
      setAlertDialogOpen(true);
      return false;
    }
    if (inputTokens > remainingInputTokens) {
      setAlertDialogMessage(formatLimitError("input", inputTokens, remainingInputTokens));
      setAlertDialogOpen(true);
      return false;
    }
    if (estimatedOutputTokens > remainingOutputTokens) {
      setAlertDialogMessage(formatLimitError("output", estimatedOutputTokens, remainingOutputTokens));
      setAlertDialogOpen(true);
      return false;
    }
    return true;
  };

  const handleGuestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim()) || isLoading) return;

    const currentInput = input.trim();
    const inputTokens = calcTokens(currentInput);
    const estimatedOutputTokens = Math.max(50, Math.ceil(inputTokens * 2));

    if (!validateGuestLimits(inputTokens, estimatedOutputTokens)) return;

    setCurrentQuestion(currentInput);
    setInput("");
    setIsLoading(true);

    try {
      let botResponse: string;
      let actualOutputTokens = estimatedOutputTokens;

      try {
        // ✅ Updated to use the new guest endpoint that connects to FastAPI
        const res = await fetch(`${API_BASE}/guest-chatbot/send-message`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: currentInput
          })
        });

        const text = await res.text().catch(() => "");
        let json: any = null;
        try { json = text ? JSON.parse(text) : null; } catch {}

        if (!res.ok) {
          if (res.status === 429) {
            setAlertDialogMessage(json?.message || 'Rate limit exceeded. Please try again later.');
            setAlertDialogOpen(true);
            setInput(currentInput);
            setCurrentQuestion("");
            setIsLoading(false);
            return;
          }
          
          console.warn('API error, falling back to local simulation:', res.status);
          botResponse = await simulateBotResponse(currentInput);
        } else {
          const data = json ?? {};
          botResponse = data.answer || "I apologize, but I couldn't generate a response.";
          
          if (data.tokens_used) {
            actualOutputTokens = data.tokens_used.output || estimatedOutputTokens;
          }
        }
      } catch (fetchErr) {
        console.warn('Network error, falling back to local simulation:', fetchErr);
        botResponse = await simulateBotResponse(currentInput);
      }

      setGuestStats(prev => ({
        ...prev,
        requestsUsed: prev.requestsUsed + 1,
        inputTokensUsed: prev.inputTokensUsed + inputTokens,
        outputTokensUsed: prev.outputTokensUsed + actualOutputTokens,
        lastReset: prev.lastReset
      }));

      const newMessage = {
        question: currentInput,
        answer: botResponse,
        timestamp: new Date().toISOString()
      };

      setGuestMessages(msgs => [...msgs, newMessage]);
      setCurrentQuestion("");
    } catch (err: any) {
      console.error("Unexpected error in guest send:", err);
      setAlertDialogMessage("An unexpected error occurred. Please try again.");
      setAlertDialogOpen(true);
      setInput(currentInput);
      setCurrentQuestion("");
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = () => {
    setGuestMessages([]);
    setCurrentQuestion("");
    localStorage.removeItem(STORAGE_KEY);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GUEST_STATS_KEY);
    localStorage.removeItem(GUEST_ID_KEY);
    localStorage.removeItem(GUEST_SESSION_KEY);
    window.location.href = "/modules/authentication";
  };

  const getRemainingLimits = () => ({
    requests: guestLimits.maxRequests - guestStats.requestsUsed,
    inputTokens: guestLimits.maxInputTokens - guestStats.inputTokensUsed,
    outputTokens: guestLimits.maxOutputTokens - guestStats.outputTokensUsed,
    fileUploads: guestLimits.maxFileCount - guestStats.filesUploaded
  });

  const remainingLimits = getRemainingLimits();

  const renderRateLimitInfo = () => {
    const requestPercent = (guestStats.requestsUsed / guestLimits.maxRequests) * 100;
    const inputTokenPercent = (guestStats.inputTokensUsed / guestLimits.maxInputTokens) * 100;
    const outputTokenPercent = (guestStats.outputTokensUsed / guestLimits.maxOutputTokens) * 100;

    return (
      <div className="px-4 py-3 border-b border-blue-900">
        <div className="text-xs text-cyan-400 mb-2">Daily Limits (Guest)</div>
        <div className="space-y-2">
          <div>
            <div className="text-xs text-cyan-300">Requests: {guestStats.requestsUsed}/{guestLimits.maxRequests}</div>
            <div className="w-full bg-blue-800 rounded-full h-1.5">
              <div className="bg-cyan-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(requestPercent, 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="text-xs text-cyan-300">Input: {guestStats.inputTokensUsed}/{guestLimits.maxInputTokens}</div>
            <div className="w-full bg-blue-800 rounded-full h-1.5">
              <div className="bg-cyan-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(inputTokenPercent, 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="text-xs text-cyan-300">Output: {guestStats.outputTokensUsed}/{guestLimits.maxOutputTokens}</div>
            <div className="w-full bg-blue-800 rounded-full h-1.5">
              <div className="bg-cyan-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(outputTokenPercent, 100)}%` }} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const sendDisabled = (!input.trim()) || isLoading || remainingLimits.requests <= 0;

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden guest-chatbot-container">
      <div className={`fixed top-0 left-0 h-full flex flex-col bg-blue-950/90 border-r border-blue-900 transition-all duration-300 z-30 ${sidebarOpen ? "w-72" : "w-16"}`}>
        <div className="flex items-center justify-between px-4 py-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-cyan-400 hover:text-white hover:bg-cyan-700 transition-all duration-200" aria-label="Toggle Sidebar">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>

        <div className="px-4 py-4 border-b border-blue-900">
          {sidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="bg-cyan-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold">G</div>
              <div>
                <div className="font-semibold text-cyan-100 text-lg">Guest User</div>
                <div className="text-xs text-cyan-400">Limited Access</div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="bg-cyan-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold">G</div>
            </div>
          )}
        </div>

        {sidebarOpen && renderRateLimitInfo()}

        <div className="flex-1 flex flex-col justify-between">
          <div className="px-2 py-4">
            {sidebarOpen ? (
              <div className="space-y-2">
                <Button variant="ghost" onClick={clearChatHistory} disabled={guestMessages.length === 0} className="w-full text-red-400 hover:bg-blue-900 hover:text-red-300 flex items-center gap-2 justify-start disabled:opacity-50">
                  <Trash2 size={18} /> Clear Chat History
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Button variant="ghost" size="icon" onClick={clearChatHistory} disabled={guestMessages.length === 0} className="text-red-400 hover:text-white hover:bg-red-600 transition-all duration-200 disabled:opacity-50" aria-label="Clear Chat History">
                  <Trash2 size={20} />
                </Button>
              </div>
            )}
          </div>

          <div className="px-2 py-4 border-t border-blue-900">
            {sidebarOpen ? (
              <Button variant="ghost" onClick={handleLogout} className="w-full text-cyan-200 hover:bg-blue-900 flex items-center gap-2 justify-start"><LogOut size={18} /> Back to Login</Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-cyan-400 hover:text-white hover:bg-cyan-700 transition-all duration-200" aria-label="Back to Login"><LogOut size={20} /></Button>
            )}
          </div>
        </div>
      </div>

      <div className={`flex-1 flex flex-col ${sidebarOpen ? "ml-72" : "ml-16"} transition-all duration-300`}>
        <div className="flex-1 overflow-y-auto px-0 py-6 z-10 guest-messages-scroll">
          <div className="max-w-2xl w-full mx-auto flex flex-col gap-2 px-4 min-h-full">
            {guestMessages.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 py-16">
                <MessageCircle className="text-cyan-400 mb-4" size={32} />
                <h2 className="text-xl lg:text-2xl font-bold text-cyan-100 mb-2 text-center">Hello Guest! 👋</h2>
                <p className="text-base lg:text-lg text-cyan-200 text-center max-w-md mb-6">I'm your AU assistant in guest mode. Ask me anything - but note you have limited daily usage!</p>
                <div className="text-sm text-cyan-300 text-center bg-blue-900/40 px-4 py-2 rounded-lg">💡 Daily limits: {guestLimits.maxRequests} requests, {guestLimits.maxInputTokens} input tokens, {guestLimits.maxOutputTokens} output tokens</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-auto">
                {guestMessages.map((msg, idx) => (
                  <div key={idx}>
                    {/* Question - keep as is */}
                    <div className="flex justify-end mb-2">
                      <div className="max-w-[90%] bg-cyan-700 text-white px-4 py-3 rounded-2xl relative group">
                        <div className="text-base">{msg.question}</div>
                        <Button variant="ghost" size="icon" 
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-cyan-200 hover:text-white hover:bg-cyan-800" 
                          onClick={() => copyToClipboard(msg.question, 'question', idx)} 
                          aria-label="Copy question">
                          {copiedItems[`${idx}-question`] ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                    </div>

                    {/* Answer - WITH MARKDOWN */}
                    <div className="flex justify-start mb-4">
                      <div className="max-w-[85%] bg-blue-900/80 text-cyan-100 px-4 py-3 rounded-2xl relative group">
                        <MarkdownRenderer content={msg.answer} />
                        <Button variant="ghost" size="icon" 
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-cyan-300 hover:text-white hover:bg-blue-800" 
                          onClick={() => copyToClipboard(msg.answer, 'answer', idx)} 
                          aria-label="Copy answer">
                          {copiedItems[`${idx}-answer`] ? <Check size={14} /> : <Copy size={14} />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {currentQuestion && (
                  <div className="flex justify-end mb-2">
                    <div className="max-w-[90%] bg-cyan-700 text-white px-4 py-3 rounded-2xl">
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

        <div className="p-4 lg:p-6 bg-transparent border-t border-blue-900 flex-shrink-0 z-10">
          <form className="max-w-2xl mx-auto w-full" onSubmit={handleGuestSend}>
            <div className="flex flex-col gap-2">
              <div className="relative flex items-center">
                <Input ref={guestInputRef} type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Type your message... (Guest Mode)" className="w-full bg-blue-900/80 text-white placeholder-white border border-black h-12 px-4 pr-20 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-700/30" autoComplete="off" disabled={isLoading} />
                <Button type="submit" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-cyan-700 text-white hover:bg-cyan-800 h-10 w-10 rounded-xl p-0 flex items-center justify-center disabled:opacity-50" disabled={sendDisabled} aria-label="Send">
                  {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <AlertDialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
        <AlertDialogContent className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-800 text-cyan-100 shadow-2xl max-w-md mx-4 z-[9999]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-semibold text-cyan-100 mb-2">
              {alertDialogMessage.includes("limit") || alertDialogMessage.includes("exceed") || alertDialogMessage.includes("exhausted") ? (
                <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-amber-600 flex items-center justify-center"><span className="text-white text-sm font-bold">!</span></div>Limit Exceeded</span>
              ) : alertDialogMessage.includes("Failed") || alertDialogMessage.includes("Error") || alertDialogMessage.includes("error") ? (
                <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center"><span className="text-white text-sm font-bold">✕</span></div>Error</span>
              ) : alertDialogMessage.includes("copy") || alertDialogMessage.includes("clipboard") ? (
                <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center"><Copy size={14} className="text-white" /></div>Copy Error</span>
              ) : (
                <span className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center"><span className="text-white text-sm font-bold">i</span></div>Notice</span>
              )}
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-2 text-cyan-200 leading-relaxed">{alertDialogMessage}</div>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-gradient-to-r from-blue-800 to-blue-700 text-cyan-100 border border-blue-600 hover:from-blue-700 hover:to-blue-600 hover:text-white transition-all duration-200 px-6 py-2 rounded-lg font-medium" onClick={() => setAlertDialogOpen(false)}>OK</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}