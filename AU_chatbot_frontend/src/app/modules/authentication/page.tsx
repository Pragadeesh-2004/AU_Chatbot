"use client";
import React, { useState, useEffect, useRef } from "react";
import LoginPage from "./login";
import SignupPage from "./signup";
import GuestPage from "./guest";
import ForgotPasswordPage from "./forgot-password";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Bot } from "lucide-react";

type Tab = "login" | "signup" | "guest" | "forgot";

export default function AuthenticationModule() {
  const [tab, setTab] = useState<Tab>("login");
  const [forgotId, setForgotId] = useState("");
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [particles, setParticles] = useState<
    { left: number; top: number; duration: number; delay: number }[]
  >([]);
  const [forgotRole, setForgotRole] = useState("student");

  // NEW: Use ref for background blur
  const blurRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (blurRef.current) {
        blurRef.current.style.left = `${(e.clientX / window.innerWidth) * 10}%`;
        blurRef.current.style.top = `${(e.clientY / window.innerHeight) * 10}%`;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  return (
    <>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
            opacity: 0.8;
          }
          50% { 
            transform: translateY(-15px) rotate(180deg); 
            opacity: 1;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        
        @keyframes gradient-x {
          0%, 100% { 
            background-size: 200% 200%; 
            background-position: left center; 
          }
          50% { 
            background-size: 200% 200%; 
            background-position: right center; 
          }
        }
        .animate-gradient-x {
          animation: gradient-x 4s ease infinite;
        }
      `}</style>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-600 to-cyan-400 px-2 py-2 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {particles.map((p, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 bg-white/20 rounded-full"
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animation: `float ${p.duration}s ease-in-out infinite`,
                animationDelay: `${p.delay}s`
              }}
            />
          ))}
          <div 
            ref={blurRef}
            className="absolute w-72 h-72 bg-gradient-to-br from-cyan-300/20 via-blue-400/15 to-blue-700/20 rounded-full blur-3xl transition-all duration-1000"
            style={{
              left: `5%`,
              top: `5%`,
            }}
          />
        </div>

        <div className="w-full max-w-xl rounded-2xl shadow-xl bg-white/90 border border-white/30 backdrop-blur-3xl p-0 relative overflow-hidden hover:shadow-2xl transition-all duration-500 group">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -left-16 w-72 h-72 bg-gradient-to-br from-blue-300/10 via-blue-500/8 to-blue-800/5 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute -bottom-16 -right-16 w-72 h-72 bg-gradient-to-tl from-cyan-200/15 via-blue-400/10 to-blue-600/8 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
          </div>

          <div className="relative z-10 p-6">
            {/* Enhanced Header */}
            <div className="flex flex-col items-center mb-6">
              <div className="bg-gradient-to-br from-blue-500 via-blue-700 to-cyan-500 p-2 rounded-xl shadow-lg mb-3 hover:rotate-6 transition-transform duration-300">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-600 to-cyan-500 text-center tracking-tight animate-gradient-x">
                University Chatbot
              </h1>
              <p className="text-gray-600 text-sm mt-1 font-medium animate-fade-in">Your intelligent campus assistant</p>
            </div>

            {tab !== "forgot" ? (
              <>
                <Tabs
                  defaultValue={tab}
                  value={tab}
                  onValueChange={(value: string) => setTab(value as Tab)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-blue-100/80 via-cyan-100/80 to-blue-200/80 rounded-lg mb-4 p-1 shadow-md backdrop-blur-sm">
                    <TabsTrigger
                      value="login"
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-blue-500 data-[state=active]:text-white transition-all duration-300 hover:scale-105"
                    >
                      Login
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-400 data-[state=active]:text-white transition-all duration-300 hover:scale-105"
                    >
                      Signup
                    </TabsTrigger>
                    <TabsTrigger
                      value="guest"
                      className="px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-400 data-[state=active]:to-blue-700 data-[state=active]:text-white transition-all duration-300 hover:scale-105"
                    >
                      Guest
                    </TabsTrigger>
                  </TabsList>
                  <div className="bg-white/95 rounded-lg p-4 shadow-inner backdrop-blur-sm border border-white/50">
                    <TabsContent value="login" className="animate-fade-in">
                      <LoginPage />
                    </TabsContent>
                    <TabsContent value="signup" className="animate-fade-in">
                      <SignupPage />
                    </TabsContent>
                    <TabsContent value="guest" className="animate-fade-in">
                      <GuestPage />
                    </TabsContent>
                  </div>
                </Tabs>
                {/* Only show Forgot Password on Login tab */}
                {tab === "login" && (
                  <div className="mt-4 flex justify-center">
                    <button
                      type="button"
                      className="text-blue-700 underline hover:text-cyan-600 text-sm font-semibold transition-all duration-300 hover:scale-105"
                      onClick={() => setTab("forgot")}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
              </>
            ) : (
              <ForgotPasswordPage
                onBack={() => {
                  setTab("login");
                  setForgotId("");
                  setShowForgotPopup(false);
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}