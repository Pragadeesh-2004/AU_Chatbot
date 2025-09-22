"use client";
import React, { useState, useEffect } from "react";
import LoginPage from "./login";
import SignupPage from "./signup";
import GuestPage from "./guest";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Bot } from "lucide-react";

type Tab = "login" | "signup" | "guest" | "forgot";

export default function AuthenticationModule() {
  const [tab, setTab] = useState<Tab>("login");
  const [forgotId, setForgotId] = useState("");
  const [showForgotPopup, setShowForgotPopup] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<
    { left: number; top: number; duration: number; delay: number }[]
  >([]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Only generate random positions on the client
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
          {/* Floating Particles */}
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
            className="absolute w-72 h-72 bg-gradient-to-br from-cyan-300/20 via-blue-400/15 to-blue-700/20 rounded-full blur-3xl transition-all duration-1000"
            style={{
              left: `${mousePosition.x / 10}%`,
              top: `${mousePosition.y / 10}%`,
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
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    className="text-blue-700 underline hover:text-cyan-600 text-sm font-semibold transition-all duration-300 hover:scale-105"
                    onClick={() => setTab("forgot")}
                  >
                    Forgot Password?
                  </button>
                </div>
              </>
            ) : (
              <div className="bg-white/95 rounded-lg p-6 flex flex-col justify-center relative shadow-inner backdrop-blur-sm border border-white/50 animate-fade-in">
                <button
                  type="button"
                  className="text-blue-700 hover:text-cyan-600 mb-3 transition-all duration-300 hover:scale-110"
                  style={{ alignSelf: "flex-start", position: "static" }}
                  onClick={() => {
                    setTab("login");
                    setForgotId("");
                    setShowForgotPopup(false);
                  }}
                  aria-label="Back to Home"
                >
                  <ArrowLeft size={24} />
                </button>
                {!showForgotPopup ? (
                  <>
                    <h2 className="text-xl font-bold text-center mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-cyan-600">
                      Forgot Password
                    </h2>
                    <label className="block text-blue-700 text-sm mb-2 text-left font-semibold">
                      ID
                    </label>
                    <Input
                      type="text"
                      value={forgotId}
                      onChange={(e) => setForgotId(e.target.value)}
                      placeholder="Enter your ID"
                      className="bg-white border-blue-400 h-10 px-3 text-sm mb-4 w-full text-blue-900 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300"
                    />
                    <Button
                      type="button"
                      className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:from-blue-800 hover:to-cyan-500 h-10 text-sm font-bold rounded-lg transition-all duration-300 hover:scale-105"
                      onClick={() => setShowForgotPopup(true)}
                    >
                      Next
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 w-full">
                    <div className="bg-green-100 p-3 rounded-full mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="mb-4 text-sm text-center text-blue-700">
                      Link to change the password has been sent to your registered email ID.
                    </p>
                    <Button
                      type="button"
                      className="bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:from-blue-800 hover:to-cyan-500 w-full h-10 text-sm font-bold rounded-lg transition-all duration-300 hover:scale-105"
                      onClick={() => alert("Resend email placeholder")}
                    >
                      Resend
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}