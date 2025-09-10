"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage({ onBack }: { onBack?: () => void }) {
  const [id, setId] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  // Reset state and call parent handler if provided
  const handleBack = () => {
    setId("");
    setShowPopup(false);
    if (onBack) onBack();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-2">
      <div className="w-full max-w-md rounded-xl shadow-lg bg-[#1a1a1a] text-white p-6 relative">
        <button
          type="button"
          className="absolute left-4 top-4 text-white hover:text-blue-400"
          onClick={handleBack}
          aria-label="Back to Main"
        >
          <ArrowLeft size={28} />
        </button>
        {!showPopup ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-6">Forgot Password</h2>
            <label className="block mb-1 text-white text-lg">ID</label>
            <Input
              type="text"
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="Enter your ID"
              className="bg-black text-white border-white h-12 px-4 text-lg mb-4"
            />
            <Button
              type="button"
              className="w-full bg-white text-black hover:bg-gray-200 h-12 text-lg"
              onClick={() => setShowPopup(true)}
            >
              Send Reset Link
            </Button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-green-400 mb-6 text-lg text-center">
              Link to change the password has been sent to your registered email ID.
            </p>
            <Button
              type="button"
              className="bg-white text-black hover:bg-gray-200 w-full h-12 text-lg"
              onClick={handleBack}
            >
              Back to Main
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}