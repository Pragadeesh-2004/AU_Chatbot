"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Search, Sparkles, MessageCircle, Send, Plus, History, Menu } from "lucide-react";
import ProfileSidebar from "@/components/ProfileSidebar";

const chatHistory = [
    { id: 1, title: "How to apply for leave?", date: "Today" },
    { id: 2, title: "Show me today's timetable", date: "Yesterday" },
    { id: 3, title: "Tell me a joke", date: "2 days ago" },
    { id: 4, title: "Campus facilities info", date: "1 week ago" },
    { id: 5, title: "Assignment deadlines", date: "1 week ago" },
];

export default function ChatbotPage() {
    const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
    const [input, setInput] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [particles, setParticles] = useState<
        { left: number; top: number; duration: number; delay: number }[]
    >([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const userName = "John Doe";
    const userEmail = "john.doe@university.edu";
    const userRole = "Student";

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        setParticles(
            Array.from({ length: 10 }).map(() => ({
                left: Math.random() * 100,
                top: Math.random() * 100,
                duration: 3 + Math.random() * 4,
                delay: Math.random() * 5,
            }))
        );
    }, []);

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { role: "user", text: input }]);
        setInput("");
        setTimeout(() => {
            setMessages((msgs) => [
                ...msgs,
                { role: "bot", text: "This is a placeholder response from AU Chatbot." },
            ]);
        }, 500);
    };

    const filteredHistory = chatHistory.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.8; }
                    50% { transform: translateY(-15px) rotate(180deg); opacity: 1; }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
            <div className="h-screen w-full flex flex-col bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden">
                {/* Floating Particles */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    {particles.map((p, i) => (
                        <div
                            key={`particle-${i}`}
                            className="absolute w-1 h-1 bg-white/10 rounded-full animate-float"
                            style={{
                                left: `${p.left}%`,
                                top: `${p.top}%`,
                                animationDelay: `${p.delay}s`,
                                animationDuration: `${p.duration}s`
                            }}
                        />
                    ))}
                    <div 
                        className="absolute w-72 h-72 bg-gradient-to-br from-cyan-900/20 via-blue-900/15 to-blue-950/20 rounded-full blur-3xl transition-all duration-1000"
                        style={{
                            left: `10%`,
                            top: `10%`,
                        }}
                    />
                </div>
                {/* Header */}
                <header className="flex items-center justify-between gap-4 p-4 bg-blue-950/80 border-b border-blue-900 flex-shrink-0 z-10">
                    <div className="flex items-center gap-2">
                        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-cyan-300 hover:bg-blue-900"
                                >
                                    <Menu size={20} />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-80 bg-blue-950 text-cyan-100">
                                <SheetHeader className="sr-only">
                                    <SheetTitle>Chat History</SheetTitle>
                                </SheetHeader>
                                <div className="h-full flex flex-col">
                                    <div className="p-4 border-b border-blue-900">
                                        <div className="flex items-center gap-2 mb-4">
                                            <MessageCircle size={24} className="text-cyan-300" />
                                            <h2 className="text-xl font-bold text-cyan-100">AU Chatbot</h2>
                                        </div>
                                        <Button className="w-full bg-cyan-700 text-white hover:bg-cyan-800 flex items-center gap-2 h-10 text-sm rounded-lg">
                                            <Plus size={16} />
                                            New Chat
                                        </Button>
                                    </div>
                                    <div className="flex-1 p-4 overflow-y-auto">
                                        <div className="relative mb-4">
                                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cyan-400" />
                                            <Input
                                                placeholder="Search chats..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10 bg-blue-900 text-cyan-100 border border-blue-900 h-10 text-sm rounded-lg"
                                            />
                                        </div>
                                        <div className="h-px bg-blue-900 mb-4" />
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-2 text-sm text-cyan-400">
                                                <History size={16} />
                                                <span>Recent Chats</span>
                                            </div>
                                            {filteredHistory.map((chat) => (
                                                <div
                                                    key={chat.id}
                                                    className="bg-blue-900 text-cyan-100 p-3 cursor-pointer hover:bg-blue-800 transition-colors border-none rounded-lg"
                                                    onClick={() => setSidebarOpen(false)}
                                                >
                                                    <div className="text-sm font-medium truncate">{chat.title}</div>
                                                    <div className="text-xs text-cyan-400 mt-1">{chat.date}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                        <Sparkles className="text-cyan-300" size={24} />
                        <h1 className="text-lg lg:text-xl font-bold text-cyan-100 truncate">
                            Chat with AU Chatbot
                        </h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <ProfileSidebar 
                            userName={userName}
                            userEmail={userEmail}
                            userRole={userRole}
                        />
                    </div>
                </header>

                {/* Chat Messages Area */}
                <div className="flex-1 overflow-y-auto px-0 py-6 z-10 flex flex-col gap-2">
                    <div className="max-w-2xl w-full mx-auto flex flex-col gap-2">
                        {messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full py-16">
                                <Sparkles className="text-cyan-400 mb-4" size={32} />
                                <h2 className="text-xl lg:text-2xl font-bold text-cyan-100 mb-2 text-center">
                                    Welcome, {userName.split(' ')[0]}! 👋
                                </h2>
                                <p className="text-base lg:text-lg text-cyan-200 text-center max-w-md mb-6">
                                    I'm your AU assistant. Ask me anything about campus life, academics, or just chat!
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                                    <div className="bg-blue-900/80 text-cyan-100 p-4 cursor-pointer hover:bg-blue-800/90 transition-colors border-none rounded-lg">
                                        <div className="text-sm font-medium">📅 Today's Schedule</div>
                                        <div className="text-xs text-cyan-400 mt-1">View your timetable</div>
                                    </div>
                                    <div className="bg-blue-900/80 text-cyan-100 p-4 cursor-pointer hover:bg-blue-800/90 transition-colors border-none rounded-lg">
                                        <div className="text-sm font-medium">📝 Assignment Help</div>
                                        <div className="text-xs text-cyan-400 mt-1">Get academic assistance</div>
                                    </div>
                                    <div className="bg-blue-900/80 text-cyan-100 p-4 cursor-pointer hover:bg-blue-800/90 transition-colors border-none rounded-lg">
                                        <div className="text-sm font-medium">🏢 Campus Info</div>
                                        <div className="text-xs text-cyan-400 mt-1">Learn about facilities</div>
                                    </div>
                                    <div className="bg-blue-900/80 text-cyan-100 p-4 cursor-pointer hover:bg-blue-800/90 transition-colors border-none rounded-lg">
                                        <div className="text-sm font-medium">💬 General Chat</div>
                                        <div className="text-xs text-cyan-400 mt-1">Just have a conversation</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] px-4 py-3 rounded-2xl text-base ${
                                            msg.role === "user"
                                                ? "bg-cyan-700 text-white"
                                                : "bg-blue-900/80 text-cyan-100"
                                        }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 lg:p-6 bg-transparent border-t border-blue-900 flex-shrink-0 z-10">
                    <form
                        className="max-w-2xl mx-auto w-full"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSend();
                        }}
                    >
                        <div className="relative">
                            <Input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="w-full bg-blue-900/80 text-white placeholder-white border border-black h-12 px-4 pr-12 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-700/30"
                                autoComplete="off"
                            />
                            <Button
                                type="submit"
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-cyan-700 text-white hover:bg-cyan-800 h-10 w-10 rounded-xl p-0"
                                disabled={!input.trim()}
                            >
                                <Send size={18} className="text-white" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}