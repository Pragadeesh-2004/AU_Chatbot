"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { User, ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";

// --- API utility in this file ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
async function apiPost(path: string, data: any) {
  const res = await fetch(`${API_BASE}/authentication/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  let json: any = {};
  try {
    json = await res.json();
  } catch {
    // ignore
  }
  if (!res.ok) throw new Error(json.error || json.message || "API error");
  return json;
}
// ---

const roleOptions = [
  { value: "student", label: "Student", idLabel: "Roll No" },
  { value: "faculty", label: "Faculty", idLabel: "Faculty ID" },
  { value: "official", label: "Official", idLabel: "Official ID" },
  { value: "scholar", label: "Scholar", idLabel: "Scholar ID" },
  { value: "admin", label: "Admin", idLabel: "Admin ID" },
];

export default function SignupPage({ onBackToLogin }: { onBackToLogin?: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [role, setRole] = useState("student");
  const [id, setId] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [verified, setVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const currentRole = roleOptions.find(r => r.value === role);

  // Step 1: Send verification email
  const handleSendEmail = async () => {
    setInputError(null);
    try {
      await apiPost("signup", { role, id });
      setEmailSent(true);
      setStep(2);
    } catch (e: any) {
      setInputError(e.message || "Failed to send verification email");
    }
  };

  // Step 2: Simulate clicking verification link (in real app, this would be via email link)
  const handleVerify = async () => {
    setVerified(true);
    setStep(3);
  };

  // Step 3: Complete signup (set password)
  const handleCompleteSignup = async () => {
    try {
      // In a real app, you'd get the token from the email link
      const token = btoa(`${role}:${id}:dummy`); // Replace with real token from email in production
      await apiPost("verify", { token, password });
      alert("Signup complete!");
      // Optionally redirect or reset state
    } catch (e: any) {
      alert(e.message || "Failed to complete signup");
    }
  };

  const handleBack = () => {
    setStep(1);
    setId("");
    setPassword("");
    setConfirm("");
    setEmailSent(false);
    setVerified(false);
    if (onBackToLogin) onBackToLogin();
  };

  return (
    <>
      {/* Step 1: Role, ID, Send Verification */}
      {step === 1 && (
        <>
          <div>
            <label className="block mb-2 text-blue-900 text-sm font-semibold">Role</label>
            <Select value={role} onValueChange={value => { setRole(value); setId(""); }}>
              <SelectTrigger className="w-full bg-white text-blue-900 border-blue-400 h-10 px-3 text-sm rounded-lg focus:ring-2 focus:ring-cyan-200">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent className="bg-white text-blue-900 border-blue-400">
                {roleOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="hover:bg-blue-100 hover:text-blue-900">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {role === "admin" ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center mt-2">
              <Mail className="mx-auto mb-2 text-blue-700" size={32} />
              <p className="text-blue-900 text-lg font-semibold mb-2">Admin Signup</p>
              <p className="text-blue-800 mb-2">
                Contact <span className="underline">support@universitychatbots.com</span> for creation of an authenticated Admin Portal for your University.
              </p>
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 h-10 text-sm mt-4 rounded-lg"
                onClick={onBackToLogin}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="mt-6">
                <label className="block mb-2 text-blue-900 text-sm font-semibold">
                  {currentRole?.idLabel} <span className="text-xs text-blue-400">(Numbers only)</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={id}
                    onChange={e => {
                      setId(e.target.value.replace(/\D/g, ""));
                      setInputError(null);
                    }}
                    placeholder={inputError ? inputError : `Enter your ${currentRole?.idLabel}`}
                    className={`bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300 ${inputError ? "border-red-500" : ""}`}
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                </div>
                {inputError && (
                  <div className="text-red-500 text-xs mt-1">{inputError}</div>
                )}
              </div>
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 h-10 text-sm rounded-lg mt-6"
                disabled={!id}
                onClick={handleSendEmail}
              >
                Send Verification Email
              </Button>
              {inputError && (
                <div className="mt-4 text-red-500 text-sm text-center">
                  {inputError}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Step 2: Email Verification */}
      {step === 2 && !verified && (
        <>
          <button
            type="button"
            className="absolute left-4 top-4 text-blue-700 hover:text-blue-900"
            onClick={handleBack}
            aria-label="Back to Login"
          >
            <ArrowLeft size={28} />
          </button>
          <div className="flex flex-col items-center justify-center mt-8">
            <Mail className="mb-4 text-blue-700" size={40} />
            <p className="text-blue-900 mb-4 mt-8 text-lg font-semibold">
              Verification link has been sent to your registered email.
            </p>
            <Button
              type="button"
              className="bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 mb-2 w-full h-12 text-lg"
              onClick={handleVerify}
            >
              I've clicked the verification link
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-lg border-blue-400 text-blue-900"
              onClick={handleSendEmail}
            >
              Resend Email
            </Button>
          </div>
        </>
      )}

      {/* Step 3: Set Password */}
      {((step === 2 && verified) || step === 3) && (
        <>
          <button
            type="button"
            className="absolute left-4 top-4 text-blue-700 hover:text-blue-900"
            onClick={handleBack}
            aria-label="Back to Login"
          >
            <ArrowLeft size={28} />
          </button>
          <div className="flex flex-col items-center justify-center mt-8">
            <p className="text-blue-900 mb-4 mt-8 text-lg font-semibold">
              Email verified! Set your password below.
            </p>
            <div className="mb-4 w-full">
              <label className="block mb-2 text-blue-900 text-base font-semibold">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-700 transition"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="mb-6 w-full">
              <label className="block mb-2 text-blue-900 text-base font-semibold">Confirm Password</label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Confirm password"
                  className="bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-700 transition"
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <Button
              type="button"
              className="bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 mb-2 w-full h-12 text-lg"
              onClick={handleCompleteSignup}
              disabled={!password || !confirm || password !== confirm}
            >
              Complete Signup
            </Button>
            {password && confirm && password !== confirm && (
              <div className="text-red-500 mt-2 text-sm">Passwords do not match.</div>
            )}
          </div>
        </>
      )}
    </>
  );
}