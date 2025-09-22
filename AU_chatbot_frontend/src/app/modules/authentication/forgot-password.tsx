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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-700 to-cyan-400 px-2">
      <div className="w-full max-w-md rounded-2xl shadow-2xl bg-white/95 border border-blue-200/40 backdrop-blur-2xl p-8 relative overflow-hidden">
        {/* Decorative glassy blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-gradient-to-br from-cyan-300/40 via-blue-400/30 to-blue-900/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-gradient-to-tl from-blue-200/40 via-cyan-400/30 to-blue-700/30 rounded-full blur-3xl" />
        </div>
        <button
          type="button"
          className="absolute left-4 top-4 text-blue-700 hover:text-cyan-600"
          onClick={handleBack}
          aria-label="Back to Main"
        >
          <ArrowLeft size={28} />
        </button>
        <div className="relative z-10">
          {!showPopup ? (
            <>
              <h2 className="text-2xl font-bold text-center mb-6 text-blue-800">Forgot Password</h2>
              <label className="block mb-1 text-blue-900 text-lg">ID</label>
              <Input
                type="text"
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="Enter your ID"
                className="bg-white border-cyan-400 h-12 px-4 text-lg mb-4 text-blue-900"
              />
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-700 text-white hover:from-blue-600 hover:to-cyan-400 h-12 text-lg font-bold rounded-xl"
                onClick={() => setShowPopup(true)}
              >
                Send Reset Link
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64">
              <p className="text-blue-700 mb-6 text-lg text-center">
                Link to change the password has been sent to your registered email ID.
              </p>
              <Button
                type="button"
                className="bg-gradient-to-r from-cyan-500 to-blue-700 text-white hover:from-blue-600 hover:to-cyan-400 w-full h-12 text-lg font-bold rounded-xl"
                onClick={handleBack}
              >
                Back to Main
              </Button>
            </div>
          )}
        </div>
      </div>
      <style jsx global>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(16px);}
          100% { opacity: 1; transform: translateY(0);}
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(.4,0,.2,1);
        }
      `}</style>
    </div>
  );
}