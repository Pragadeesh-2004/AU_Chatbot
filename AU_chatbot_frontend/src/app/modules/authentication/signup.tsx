"use client";
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { User, ArrowLeft, Mail, Lock, GraduationCap } from "lucide-react";
import { useSearchParams } from "next/navigation";

// --- API utility in this file ---
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

async function apiPost(path: string, data: any) {
  const url = `${API_BASE}/authentication/${path}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include", // ensure cookies are sent/received
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    let json: any = {};
    try { json = await res.json(); } catch {}
    if (!res.ok) {
      // normalize error payloads
      const errMsg =
        (typeof json?.message === "string" && json.message) ||
        (json?.message?.message) ||
        json?.error ||
        res.statusText ||
        "API error";
      throw new Error(errMsg);
    }
    return json;
  } catch (err: any) {
    console.error("apiPost failed", { url, body: data, error: err?.message || err });
    throw err;
  }
}

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}/authentication/${path}`);
  let json: any = {};
  try { json = await res.json(); } catch {}
  if (!res.ok) throw new Error(json?.message || json?.error || 'API error');
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

const collegeOptions = [
  { value: "Anna_university", label: "Anna University" },
];

type SignupPageProps = {
  showDialog?: (type: "error" | "success", message: string) => void;
  onBackToLogin?: () => void;
};

// Add password validation function at the top
const validatePassword = (password: string): string | null => {
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (password.length > 64) {
    return "Password must not exceed 64 characters";
  }
  if (/\s/.test(password)) {
    return "Password cannot contain spaces";
  }
  if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]+$/.test(password)) {
    return "Password can only contain letters, numbers, and special characters";
  }
  return null;
};

export default function SignupPage({ onBackToLogin, showDialog }: SignupPageProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [college, setCollege] = useState("Anna_university");
  const [role, setRole] = useState("student");
  const [id, setId] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [verified, setVerified] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [modal, setModal] = useState<{ visible: boolean; type: "success" | "error"; message: string }>({
    visible: false,
    type: "success",
    message: "",
  });
  const timerRef = useRef<number | null>(null);

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

  // When role or id changes, fetch existing verification status (if any)
  useEffect(() => {
    const fetchStatus = async () => {
      if (!id || role === "admin") {
        setResendCount(0);
        return;
      }
      try {
        const q = `verification?role=${encodeURIComponent(role)}&id=${encodeURIComponent(id)}`;
        const status = await apiGet(q);
        setResendCount(Number(status.resendCount || 0));
      } catch {
        // ignore - no existing record or fetch error -> leave resendCount at 0
        setResendCount(0);
      }
    };

    // debounce a bit to avoid calling on every keystroke
    const t = window.setTimeout(fetchStatus, 300);
    return () => window.clearTimeout(t);
  }, [role, id]);

  // Step 1: Check user and send verification email
  const handleSendEmail = async () => {
    setInputError(null);
    setCodeError(null);
    setIsLoading(true);

    try {
      const response = await apiPost("signup", { college, role, id });

      // backend returns resendCount (number of sends including this one)
      const rc = Number(response?.resendCount ?? 0);

      // Update state from authoritative backend value when available.
      if (rc > 0) {
        setResendCount(rc);
      } else {
        // fallback increment if backend didn't return a count
        setResendCount(prev => Math.min(prev + 1, 3));
      }

      setEmailSent(true);
      // If user is already on step 2 (resend), keep them there; otherwise advance.
      setStep(prev => (prev === 2 ? 2 : 2));

      // Don't show intermediate alert dialog - only final modal at completion
    } catch (e: any) {
      // Do NOT increment resendCount on failure.
      const msg = e?.message || "Something went wrong. Please try again.";
      // Show error inline only
      setInputError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify code from email
  const handleVerifyCode = async () => {
    setCodeError(null);
    try {
      await apiPost("verify-code", { college, role, id, code });
      // Move to password step
      setStep(3);
    } catch (e: any) {
      setCodeError(e.message || "Invalid or expired code.");
    }
  };

  // ✅ Add password change handlers with validation
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setInputError(null);
    
    if (value.length > 0) {
      const validationError = validatePassword(value);
      setPasswordError(validationError);
    } else {
      setPasswordError(null);
    }

    // Check confirm match if confirm field has value
    if (confirm && value !== confirm) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError(null);
    }
  };

  const handleConfirmChange = (value: string) => {
    setConfirm(value);
    setInputError(null);
    
    if (value && password && value !== password) {
      setConfirmError("Passwords do not match");
    } else {
      setConfirmError(null);
    }
  };

  const goToLoginImmediate = () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    // prefer callback if provided
    if (onBackToLogin) onBackToLogin();
    else window.location.href = "/modules/authentication";
  };

  // Step 3: Complete signup with token from URL
  const handleCompleteSignup = async () => {
    // ✅ Validate password before submission - show inline validation only
    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    if (password !== confirm) {
      setConfirmError("Passwords do not match.");
      return;
    }

    try {
      const useToken = token || btoa(`${role}:${id}:${Date.now()}`);

      // Verify token and set password (server now creates memory/rate-limit and returns warnings)
      const response = await apiPost("verify", { token: useToken, password, college });

      // after successful verify (response from /authentication/verify)
      // 1) ask backend to set JWT cookie
      await fetch(`${API_BASE}/authentication/set-cookie`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, role, name: response?.name || '' }),
      });
      // 2) optional: verify cookie by calling /authentication/me
      const meRes = await fetch(`${API_BASE}/authentication/me`, { credentials: 'include' });
      if (!meRes.ok) {
        console.warn('auth/me returned', meRes.status);
      }

      const userName = response?.name || "";

      // Prepare modal content - ONLY show this final modal
      if (response?.warnings && Array.isArray(response.warnings) && response.warnings.length > 0) {
        const warnMsg = response.warnings.join("\n\n");
        setModal({
          visible: true,
          type: "error",
          message: `Signup completed with warnings:\n\n${warnMsg}\n\nRedirecting to login in 5 seconds...`,
        });
      } else {
        setModal({
          visible: true,
          type: "success",
          message: `Signup complete for ${userName || "your account"}! Redirecting to login in 5 seconds...`,
        });
      }

      // auto-redirect after 5s; user can click the button to go immediately
      timerRef.current = window.setTimeout(goToLoginImmediate, 5000);

      // Reset form locally
      setStep(1);
      setId("");
      setPassword("");
      setConfirm("");
      setEmailSent(false);
      setVerified(false);
      setInputError(null);
    } catch (e: any) {
      const errMsg = e?.message || "Failed to complete signup";
      setModal({ visible: true, type: "error", message: `${errMsg}\n\nRedirecting to login in 5 seconds...` });
      timerRef.current = window.setTimeout(goToLoginImmediate, 5000);
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

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <>
      {/* Step 1: College, Role, ID, Send Verification */}
      {step === 1 && (
        <>
          {role !== "admin" && (
            <div>
              <label className="block mb-2 text-blue-900 text-sm font-semibold">College</label>
              <div className="relative">
                <Select value={college} onValueChange={setCollege}>
                  <SelectTrigger className="w-full bg-white text-blue-900 border-blue-400 h-10 px-3 text-sm rounded-lg focus:ring-2 focus:ring-cyan-200">
                    <SelectValue placeholder="Select college" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-blue-900 border-blue-400">
                    {collegeOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="hover:bg-blue-100 hover:text-blue-900">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
               
              </div>
            </div>
          )}
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
                  {currentRole?.idLabel} <span className="text-xs text-blue-400"></span>
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
                className="w-full bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 h-10 text-base rounded-lg mb-2 disabled:opacity-50"
                disabled={isLoading || resendCount >= 3}
              >
                {isLoading ? "Sending..." : resendCount >= 3 ? "Resend Disabled" : `Resend Code (${Math.max(0, 3 - resendCount)} left)`}
              </Button>

              <div className="text-xs text-gray-500 mb-2 text-center">
                {resendCount <= 0
                  ? "You can resend the code 3 more time(s) today."
                  : resendCount >= 3
                  ? "You have reached the maximum number of resends for today."
                  : `You can resend the code ${Math.max(0, 3 - resendCount)} more time(s) today.`}
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
                  type="password"
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)} 
                  placeholder="Enter password (8-64 chars, no spaces)"
                  className={`bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300 ${
                    passwordError ? "border-red-500" : ""
                  }`}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
              </div>
              {passwordError && (
                <div className="mt-1 text-red-500 text-xs">
                  {passwordError}
                </div>
              )}
            </div>
            <div className="mb-6 w-full">
              <label className="block mb-2 text-blue-900 text-base font-semibold">Confirm Password</label>
              <div className="relative">
                <Input
                  type="password"
                  value={confirm}
                  onChange={e => handleConfirmChange(e.target.value)} 
                  placeholder="Confirm password"
                  className={`bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300 ${
                    confirmError ? "border-red-500" : ""
                  }`}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
              </div>
              {confirmError && (
                <div className="mt-1 text-red-500 text-xs">
                  {confirmError}
                </div>
              )}
            </div>
            <Button
              type="button"
              className="bg-gradient-to-r from-blue-700 to-blue-400 text-white hover:from-blue-800 hover:to-blue-500 mb-2 w-full h-12 text-lg"
              onClick={handleCompleteSignup}
              disabled={!password || !confirm || !!passwordError || !!confirmError} 
            >
              Complete Signup
            </Button>
          </div>
        </>
      )}

      {/* Modal / toast overlay shown ONLY at final completion (warning/success) */}
      {modal.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative max-w-lg w-full mx-4 bg-white rounded-lg shadow-lg p-6 text-center">
            <h3 className={`text-lg font-semibold mb-2 ${modal.type === "error" ? "text-red-600" : "text-green-600"}`}>
              {modal.type === "error" ? "Notice" : "Success"}
            </h3>
            <p className="whitespace-pre-wrap text-sm text-gray-800 mb-4">{modal.message}</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={goToLoginImmediate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Login Now
              </button>
              <button
                onClick={() => {
                  // close modal but still redirect after timeout if running
                  setModal(v => ({ ...v, visible: false }));
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}