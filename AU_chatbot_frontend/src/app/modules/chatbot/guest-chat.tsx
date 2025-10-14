"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

const STORAGE_KEY = "guestChatMessages";

export default function GuestChatPage() {
  const [input, setInput] = useState("");
  const [guestMessages, setGuestMessages] = useState<{ question: string; answer: string }[]>([]);
  const guestInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setGuestMessages(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(guestMessages));
  }, [guestMessages]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [guestMessages]);

  const handleGuestSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setGuestMessages(msgs => [
      ...msgs,
      { question: input, answer: "This is a reply from the chatbot." }
    ]);
    setInput("");
    guestInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <div className="flex-1 flex flex-col items-center w-full">
        <div className="w-full max-w-xl flex flex-col flex-1 px-4 pt-8 pb-0 h-full">
          {guestMessages.length === 0 && (
            <h2 className="text-2xl font-bold text-cyan-100 text-center mb-2 mt-16">Hello Guest</h2>
          )}
          <div
            ref={chatContainerRef}
            className="flex-1 flex flex-col gap-2 justify-end overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 120px)" }}
          >
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
          </div>
        </div>
      </div>
      <form
        className="w-full max-w-xl mx-auto px-4 pb-8 fixed left-1/2 bottom-0 -translate-x-1/2"
        style={{ zIndex: 20 }}
        onSubmit={handleGuestSend}
      >
        <div className="relative flex items-center bg-blue-900/70 backdrop-blur-md rounded-2xl border border-blue-800 shadow-lg">
          <Input
            ref={guestInputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your question..."
            className="w-full bg-transparent text-white placeholder-white border-none h-12 px-4 pr-14 text-base rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-700/30"
            autoComplete="off"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-cyan-700 text-white hover:bg-cyan-800 h-10 w-10 rounded-xl p-0 flex items-center justify-center"
            disabled={!input.trim()}
            aria-label="Send"
          >
            <Send size={20} />
          </Button>
        </div>
      </form>
      <div className="h-24" />
    </div>
  );
}