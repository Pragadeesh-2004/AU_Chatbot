"use client";
import React, { useState } from "react";
import LoginPage from "./login";
import SignupPage from "./signup";
import GuestPage from "./guest";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";

type Tab = "login" | "signup" | "guest" | "forgot";

export default function AuthenticationModule() {
  const [tab, setTab] = useState<Tab>("login");
  const [forgotId, setForgotId] = useState("");
  const [showForgotPopup, setShowForgotPopup] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-2">
      <div className="w-full max-w-lg rounded-xl shadow-lg bg-[#1a1a1a] text-white p-4 sm:p-8 relative">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">
          AU Chatbot
        </h1>
        {tab !== "forgot" ? (
          <>
            <Tabs
              defaultValue={tab}
              value={tab}
              onValueChange={(value: string) => setTab(value as Tab)}
              className="w-full"
            >
              <TabsList className="flex justify-center gap-2 sm:gap-4 bg-[#222] rounded-lg mb-4 sm:mb-6 p-1 sm:p-2">
                <TabsTrigger
                  value="login"
                  className="flex-1 px-4 sm:px-8 py-3 rounded-lg text-lg data-[state=active]:bg-white data-[state=active]:text-black transition-colors"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="flex-1 px-4 sm:px-8 py-3 rounded-lg text-lg data-[state=active]:bg-white data-[state=active]:text-black transition-colors"
                >
                  Signup
                </TabsTrigger>
                <TabsTrigger
                  value="guest"
                  className="flex-1 px-4 sm:px-8 py-3 rounded-lg text-lg data-[state=active]:bg-white data-[state=active]:text-black transition-colors"
                >
                  Guest
                </TabsTrigger>
              </TabsList>
              <div className="bg-[#222] rounded-lg p-3 sm:p-6">
                <TabsContent value="login">
                  <LoginPage />
                </TabsContent>
                <TabsContent value="signup">
                  <SignupPage />
                </TabsContent>
                <TabsContent value="guest">
                  <GuestPage />
                </TabsContent>
              </div>
            </Tabs>
            <div className="mt-4 sm:mt-6 flex justify-center">
              <button
                type="button"
                className="text-blue-400 underline hover:text-blue-200 text-lg"
                style={{ position: "relative", zIndex: 1 }}
                onClick={() => setTab("forgot")}
              >
                Forgot Password?
              </button>
            </div>
          </>
        ) : (
          <div className="bg-[#222] rounded-lg p-6 flex flex-col justify-center relative">
            <button
              type="button"
              className="text-white hover:text-blue-400 mb-4"
              style={{ alignSelf: "flex-start", position: "static" }}
              onClick={() => {
                setTab("login");
                setForgotId("");
                setShowForgotPopup(false);
              }}
              aria-label="Back to Home"
            >
              <ArrowLeft size={28} />
            </button>
            {!showForgotPopup ? (
              <>
                <h2 className="text-2xl font-bold text-center mb-6">
                  Forgot Password
                </h2>
                <label className="block text-white text-lg mb-2 text-left">
                  ID
                </label>
                <Input
                  type="text"
                  value={forgotId}
                  onChange={(e) => setForgotId(e.target.value)}
                  placeholder="Enter your ID"
                  className="bg-black text-white border-white h-12 px-4 text-lg mb-4 w-full"
                />
                <Button
                  type="button"
                  className="w-full bg-white text-black hover:bg-gray-200 h-12 text-lg"
                  onClick={() => setShowForgotPopup(true)}
                >
                  Next
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 w-full">
                <p className="mb-6 text-lg text-center text-white rounded">
                  Link to change the password has been sent to your registered email ID.
                </p>
                <Button
                  type="button"
                  className="bg-white text-black hover:bg-gray-200 w-full h-12 text-lg"
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
  );
}