"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function SignupPage({ onBackToLogin }: { onBackToLogin?: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const handleBack = () => {
    setStep(1);
    setId("");
    setPassword("");
    setConfirm("");
    if (onBackToLogin) onBackToLogin();
  };

  return (
    <div className="space-y-4">
      {step === 1 && (
        <>
          <div>
            <label className="block mb-1 text-white text-lg">ID (Numbers only)</label>
            <Input
              type="text"
              value={id}
              onChange={e => setId(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter your numeric ID"
              className="bg-black text-white border-white h-12 px-4 text-lg"
            />
            <div className="mt-2 text-xs text-gray-300">
              <span className="block">Student: Enter your Register Number</span>
              <span className="block">Staff: Enter your Staff ID</span>
            </div>
          </div>
          <Button
            type="button"
            className="w-full bg-white text-black hover:bg-gray-200 h-12 text-lg"
            onClick={() => setStep(2)}
          >
            Next
          </Button>
        </>
      )}
      {step === 2 && (
        <>
          <div>
            <label className="block mb-1 text-white text-lg">Password</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter password"
              className="bg-black text-white border-white h-12 px-4 text-lg"
            />
          </div>
          <div>
            <label className="block mb-1 text-white text-lg">Confirm Password</label>
            <Input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Confirm password"
              className="bg-black text-white border-white h-12 px-4 text-lg"
            />
          </div>
          <Button
            type="button"
            className="w-full bg-white text-black hover:bg-gray-200 h-12 text-lg"
            onClick={() => setStep(3)}
          >
            Next
          </Button>
        </>
      )}
      {step === 3 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-[#222] rounded-lg p-6 text-center shadow-lg w-full max-w-sm mx-auto relative">
            <button
              type="button"
              className="absolute left-4 top-4 text-white hover:text-blue-400"
              onClick={handleBack}
              aria-label="Back to Login"
            >
              <ArrowLeft size={28} />
            </button>
            <p className="text-green-400 mb-4 mt-8 text-lg">
              Verification link has been sent to your registered email.
            </p>
            <Button
              type="button"
              className="bg-white text-black hover:bg-gray-200 mb-2 w-full h-12 text-lg"
              onClick={() => alert("Resend email placeholder")}
            >
              Resend Email
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}