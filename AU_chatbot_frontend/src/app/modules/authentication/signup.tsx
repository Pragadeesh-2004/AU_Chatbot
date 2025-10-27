"use client";
import React, { useState, useEffect } from "react";
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
import { useSearchParams } from "next/navigation";

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
  // --- Fix: Always extract a string error message ---
  let errorMsg = "API error";
  if (json) {
    if (typeof json.message === "string") {
      errorMsg = json.message;
    } else if (json.message && typeof json.message === "object" && typeof json.message.message === "string") {
      errorMsg = json.message.message;
    } else if (typeof json.error === "string") {
      errorMsg = json.error;
    }
  }
  if (!res.ok) throw new Error(errorMsg);
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

type SignupPageProps = {
  showDialog?: (type: "error" | "success", message: string) => void;
  onBackToLogin?: () => void;
};

export default function SignupPage({ onBackToLogin, showDialog }: SignupPageProps) {
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
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendCount, setResendCount] = useState(0);

  const params = useSearchParams();
  useEffect(() => {
    const stepParam = params.get("step");
    const tokenParam = params.get("token");
    if (stepParam === "3" && tokenParam) {
      setStep(3);
      setVerified(true);
      setToken(tokenParam);
    }
  }, [params]);

  const currentRole = roleOptions.find(r => r.value === role);

  // Step 1: Check user and send verification email
  const handleSendEmail = async () => {
    setInputError(null);
    setIsLoading(true);
    try {
      const response = await apiPost("signup", { role, id });
      setEmailSent(true);
      setStep(2);
    } catch (e: any) {
      // Try to parse backend error message for user not found
      let msg = e?.message || "";
      if (
        msg.toLowerCase().includes("not found") ||
        msg.toLowerCase().includes("check your role") ||
        msg.toLowerCase().includes("no anna university data")
      ) {
        setInputError("User and ID do not exist. Please check your role and number and try again.");
      } else {
        setInputError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code from email
  const handleVerifyCode = async () => {
    setCodeError(null);
    try {
      await apiPost("verify-code", { role, id, code });
      // Move to password step
      setStep(3);
    } catch (e: any) {
      setCodeError(e.message || "Invalid or expired code.");
    }
  };

  // Step 3: Complete signup with token from URL
  const handleCompleteSignup = async () => {
  try {
    const useToken = token || btoa(`${role}:${id}:${Date.now()}`);

    // Step 1: Verify token and password
    const response = await apiPost("verify", { token: useToken, password });

    const userName = response?.name || "";

    // Step 2: Create memory for the user
    const memRes = await fetch(`${API_BASE}/chatbot/add-user`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, id, name: userName }) // Remove 'sessions' if backend does not accept it
    });

    if (!memRes.ok) {
      const err = await memRes.json().catch(() => ({}));
      console.error("Memory creation failed:", err);
      window.alert(
        "Signup succeeded but memory creation failed: " +
          (err.message || memRes.statusText)
      );
      return;
    }

    // Step 3: Success
    window.alert(`Signup complete for ${userName || "your account"}! You can now login.`);
    setStep(1);
    setId("");
    setPassword("");
    setConfirm("");
    setEmailSent(false);
    setVerified(false);
    setInputError(null);
    if (onBackToLogin) onBackToLogin();
    else window.location.href = "/modules/authentication";

  } catch (e: any) {
    window.alert(e.message || "Failed to complete signup");
  }
};


  const handleBack = () => {
    setStep(1);
    setId("");
    setPassword("");
    setConfirm("");
    setEmailSent(false);
    setVerified(false);
    setInputError(null);
    if (onBackToLogin) onBackToLogin();
  };

  return (
    <>
      {/* Step 1: Role, ID, Send Verification */}
      {step === 1 && (
        <>
          <div>
            <label className="block mb-2 text-blue-900 text-sm font-semibold">Role</label>
            <Select value={role} onValueChange={value => { setRole(value); setId(""); setInputError(null); }}>
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
                    placeholder={`Enter your ${currentRole?.idLabel}`}
                    className={`bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300 ${inputError ? "border-red-500 placeholder-red-500" : ""}`}
                  />
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
                </div>
                {inputError && (
                  <div className="text-red-500 text-xs mt-1">{inputError}</div>
                )}
              </div>
              <Button
                type="button"
                className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 h-10 text-sm rounded-lg mt-6 disabled:opacity-50"
                disabled={!id || isLoading}
                onClick={handleSendEmail}
              >
                {isLoading ? "Checking..." : "Send Verification Email"}
              </Button>
            </>
          )}
        </>
      )}

      {/* Step 2: Email Verification */}
      {step === 2 && (
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
              Enter the 6-digit code sent to your registered email.
            </p>
            <div className="w-full max-w-xs">
              <Input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                placeholder="Enter code"
                className="mb-2 text-center tracking-widest text-lg"
              />
              <Button
                onClick={handleVerifyCode}
                disabled={code.length !== 6}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 h-10 text-base rounded-lg mb-2"
              >
                Verify Code
              </Button>
              {codeError && <div className="text-red-500 text-xs mb-2">{codeError}</div>}
              <Button
                onClick={handleSendEmail}
                className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 h-10 text-base rounded-lg mb-2"
                disabled={resendCount >= 3}
              >
                Resend Code
              </Button>
              <div className="text-xs text-gray-500 mb-2 text-center">
                {resendCount >= 3
                  ? "You have reached the maximum number of resends for today."
                  : `You can resend the code ${3 - resendCount} more time(s) today.`}
              </div>
              <Button
                onClick={handleBack}
                className="w-full bg-gray-200 text-blue-900 hover:bg-gray-300 h-10 text-base rounded-lg"
              >
                Back
              </Button>
            </div>
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