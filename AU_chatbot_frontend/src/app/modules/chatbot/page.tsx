"use client";

import { useState, useEffect, useRef } from "react";
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
  X
} from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter } from "@/components/ui/dialog";
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

  const MAX_FILE_COUNT = 3;
  const MAX_FILE_SIZE_MB = 5;
  const SUPPORTED_FILE_TYPES = [".pdf", ".docx", ".txt"];
  const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png"];

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [userMemory, selectedSession]);

  useEffect(() => {
    setInput("");
  }, [selectedSession]);

  const filteredSessions = userMemory?.sessions?.filter((session: any) =>
    session.session_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const messages = userMemory?.sessions?.find((s: any) => s.session_id === selectedSession)?.qa || [];

  const validateFiles = (files: File[], allowedTypes: string[], maxCount: number, maxSizeMB: number) => {
    if (files.length > maxCount) {
      setAlertDialogMessage(`You can upload up to ${maxCount} files at once.`);
      setAlertDialogOpen(true);
      return false;
    }
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const mime = file.type;
      if (!allowedTypes.includes(mime) && !allowedTypes.includes("." + ext)) {
        setAlertDialogMessage(`File "${file.name}" is not a supported format.`);
        setAlertDialogOpen(true);
        return false;
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        setAlertDialogMessage(`File "${file.name}" exceeds the size limit of ${maxSizeMB}MB.`);
        setAlertDialogOpen(true);
        return false;
      }
    }
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (validateFiles(files, SUPPORTED_FILE_TYPES, MAX_FILE_COUNT, MAX_FILE_SIZE_MB)) {
      setSelectedFiles(files);
    }
    setShowUploadOptions(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (validateFiles(files, SUPPORTED_IMAGE_TYPES, MAX_FILE_COUNT, MAX_FILE_SIZE_MB)) {
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

  // create session helper (calls backend add-session)
  const createSession = async (session_name: string) => {
    const res = await fetch(`${API_BASE}/chatbot/add-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: user.role, id: user.id, session_name })
    });
    if (!res.ok) throw new Error("Failed to create session");
    const data = await res.json();
    return data.session_id;
  };

  // Helper to get memory limits for the current user
  const getUserMemoryLimits = () => {
    // Find the user object in the current role array (students, faculty, etc.)
    if (!userMemory || !userMemory[user.role + "s"]) return { used: 0, max: 0 };
    const userObj = userMemory[user.role + "s"].find((u: any) => u[`${user.role}_id`] === user.id);
    return {
      used: userObj?.memory_count_used ?? 0,
      max: userObj?.memory_count ?? 0,
    };
  };

  const handleNewChat = async () => {
    const { used, max } = getUserMemoryLimits();
    if (max > 0 && used >= max) {
      setAlertDialogMessage(
        `You have reached your memory limit (${max} chats). Please delete old chats to create a new one.`
      );
      setAlertDialogOpen(true);
      return;
    }
    setSelectedSession(null);
    setInput("");
    setComposingNew(true);
    // leave userMemory unchanged; UI will show empty message area for new chat
  };

  const handleSend = async () => {
    if (!input.trim() && selectedFiles.length === 0 && selectedImages.length === 0) return;

    try {
      let sessionId = selectedSession;

      // If composing a new chat (no session yet) create session on first send
      if (!sessionId) {
        const generatedTitle = generateTitleFromText(input, 5);
        sessionId = await createSession(generatedTitle);
        setSelectedSession(sessionId);
        setComposingNew(false);
      }

      // send QA to backend with the resolved session id
      await fetch(`${API_BASE}/chatbot/add-qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: user.role,
          id: user.id,
          session_id: sessionId,
          question: input.trim(),
          answer: "This is a placeholder bot answer.",
          timestamp: new Date().toISOString()
        })
      });

      setInput("");
      setSelectedFiles([]);
      setSelectedImages([]);

      // refresh memory and ensure new session is visible
      const memRes = await fetch(`${API_BASE}/chatbot/user-memory?role=${user.role}&id=${user.id}`);
      const memData = await memRes.json();
      setUserMemory(memData);
      // if backend returned newly created session position is first, ensure selectedSession remains set
      if (!selectedSession) setSelectedSession(sessionId);
    } catch (err) {
      setAlertDialogMessage("Failed to send message.");
      setAlertDialogOpen(true);
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

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden">
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
                <Button variant="ghost" size="icon" onClick={handleNewChat} disabled={user.role === "guest"}>
                  <Plus size={18} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                  <Search size={18} />
                </Button>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto px-4 py-2">
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
              <div className="bg-cyan-700 text-white rounded-full w-12 h-12 flex items-center justify-center text-2xl font-bold">
                {user.name ? user.name.split(" ").map(s => s[0]).join("").toUpperCase() : "G"}
              </div>
              <div>
                <div className="font-semibold text-cyan-100 text-lg">{user.name || "Guest"}</div>
                <div className="text-xs text-cyan-400">{user.role || "guest"}</div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setProfileSidebarOpen(false)}>
              <X size={24} />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
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
              <DialogContent>
                <DialogHeader>
                  <span className="font-bold text-lg text-red-600">Delete Account?</span>
                </DialogHeader>
                <div className="py-2 text-cyan-100">
                  Are you sure you want to delete your account? This action cannot be undone and all your chats will be permanently removed.
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteUser}>
                    Yes, Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )}
      <div className={`flex-1 flex flex-col ${sidebarOpen || profileSidebarOpen ? "ml-16 md:ml-72" : "ml-16"} transition-all duration-300`}>
        <div className="flex-1 overflow-y-auto px-0 py-6 z-10 flex flex-col gap-2">
          <div className="max-w-2xl w-full mx-auto flex flex-col gap-2 px-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16">
                <MessageCircle className="text-cyan-400 mb-4" size={32}/>
                <h2 className="text-xl lg:text-2xl font-bold text-cyan-100 mb-2 text-center">
                  Welcome, {(user.name || "Guest").split(' ')[0]}! 👋
                </h2>
                <p className="text-base lg:text-lg text-cyan-200 text-center max-w-md mb-6">
                  I'm your AU assistant. Ask me anything about campus life, academics, or just chat!
                </p>
              </div>
            ) : (
              messages.map((msg: any, idx: number) => (
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
              ))
            )}
            <div ref={messagesEndRef}/>
          </div>
        </div>
        <div className="p-4 lg:p-6 bg-transparent border-t border-blue-900 flex-shrink-0 z-10">
          <form className="max-w-2xl mx-auto w-full" onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <div className="relative flex items-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-cyan-400"
                onClick={() => setShowUploadOptions(o => !o)}
                tabIndex={0}
                aria-label="Upload"
              >
                <Plus size={22} />
              </Button>
              {showUploadOptions && (
                <div id="upload-menu" className="absolute left-12 top-0 bg-blue-900 border border-blue-800 rounded-lg shadow-lg z-50 flex flex-col">
                  <Button
                    variant="ghost"
                    className="flex gap-2 items-center text-cyan-200 hover:bg-blue-800"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={18} /> Upload Files
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex gap-2 items-center text-cyan-200 hover:bg-blue-800"
                    onClick={() => imageInputRef.current?.click()}
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
                disabled={
                  (!input.trim() && selectedFiles.length === 0 && selectedImages.length === 0) ||
                  user.role === "guest"
                }
                aria-label="Send"
              >
                <Send size={20} />
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