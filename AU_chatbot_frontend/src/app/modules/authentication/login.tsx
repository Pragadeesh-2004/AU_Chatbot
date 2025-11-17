"use client";
import { useRouter } from "next/navigation";
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
import { User, Lock, Eye, EyeOff, GraduationCap } from "lucide-react";

const roleOptions = [
  { value: "admin", label: "Admin", idLabel: "Admin ID" },
  { value: "official", label: "Official", idLabel: "Official ID" },
  { value: "scholar", label: "Scholar", idLabel: "Scholar ID" },
  { value: "faculty", label: "Faculty", idLabel: "Faculty ID" },
  { value: "student", label: "Student", idLabel: "Roll No" },
];

const collegeOptions = [
  { value: "Anna_university", label: "Anna University" },
];

type LoginPageProps = {
  showDialog?: (type: "error" | "success", message: string) => void;
};

export default function LoginPage({ showDialog }: LoginPageProps) {
  const router = useRouter();
  const [college, setCollege] = useState("Anna_university");
  const [role, setRole] = useState("student");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // When role changes clear id/password and related errors
  const handleRoleChange = (value: string) => {
    setRole(value);
    setId("");
    setPassword("");
    setPasswordError(null);
    setError(null);
    setShowPassword(false);
    setShowMsg(false);
  };

  const currentRole = roleOptions.find(r => r.value === role);

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

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setError(null);
    
    if (value.length > 0) {
      const validationError = validatePassword(value);
      setPasswordError(validationError);
    } else {
      setPasswordError(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPasswordError(null);

    const passwordValidation = validatePassword(password);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/authentication/login`,
        {
          method: "POST",
          credentials: "include", // <-- ensure cookies are sent/received
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ college, role, id, password }),
        }
      );
      
      if (!res.ok) {
        let data: any = {};
        try {
          const responseText = await res.text();
          console.log("Backend response:", responseText);
          data = JSON.parse(responseText);
          console.log("Parsed data:", data);
          console.log("Message field:", data.message, typeof data.message);
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr);
          setError("Unable to connect to server");
          return;
        }
        
        let errorMessage = "Login failed";
        
        if (data && data.message) {
          if (typeof data.message === "string") {
            errorMessage = data.message;
          } else if (typeof data.message === "object") {
            errorMessage = String(JSON.stringify(data.message));
          } else {
            errorMessage = String(data.message);
          }
        } else if (data && data.error && typeof data.error === "string" && data.error !== "Bad Request") {
          errorMessage = data.error;
        }
        
        console.log("Final error message to display:", errorMessage);
        setError(errorMessage);
        return;
      }
      
      const data = await res.json();
      console.log("Login successful:", data);

      // Store user data in localStorage
      localStorage.setItem("userName", data.user.name || "Guest");
      localStorage.setItem("userRole", role);
      localStorage.setItem("userId", id);
      localStorage.setItem("userCollege", college);

      // Check if user is admin and redirect accordingly
      if (role === "admin") {
        // Admin users go to admin dashboard
        console.log("Admin login detected, redirecting to admin dashboard");
        router.push("/modules/admin");
      } else {
        // Regular users go to chatbot
        console.log("Regular user login, redirecting to chatbot");
        router.push("/modules/chatbot");
      }
    } catch (err: any) {
      console.error("Network/fetch error:", err);
      setError("Network error. Please try again.");
    }
  };

  // Hide native browser clear/reveal UI so only your custom eye toggle is visible
  const nativeInputHideStyles = `
    /* IE / Edge */
    input[type="password"]::-ms-clear,
    input[type="password"]::-ms-reveal {
      display: none;
      width: 0;
      height: 0;
    }

    /* WebKit browsers (Chrome / Safari) - common clear/reveal/auto-fill buttons */
    input[type="password"]::-webkit-clear-button,
    input[type="password"]::-webkit-contacts-auto-fill-button,
    input[type="password"]::-webkit-search-decoration,
    input[type="password"]::-webkit-search-cancel-button,
    input[type="password"]::-webkit-search-results-button,
    input[type="password"]::-webkit-search-results-decoration,
    input[type="password"]::-webkit-credentials-auto-fill-button {
      display: none !important;
      width: 0;
      height: 0;
      -webkit-appearance: none;
    }

    /* disable inner spin buttons if any */
    input[type="password"]::-webkit-inner-spin-button,
    input[type="password"]::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `;

  return (
    <>
      {/* global styles to hide native password clear/reveal so only the custom eye icon shows */}
      <style jsx global>{nativeInputHideStyles}</style>

      <form
        onSubmit={handleLogin}
        className="space-y-4 min-h-[400px] flex flex-col justify-center"
      >
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
        <div>
          <label className="block mb-2 text-blue-900 text-sm font-semibold">Role</label>
          <Select value={role} onValueChange={handleRoleChange}>
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
        <div>
          <label className="block mb-2 text-blue-900 text-sm font-semibold">
            {currentRole?.idLabel}
          </label>
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={id}
              onChange={e => setId(e.target.value.replace(/\D/, ""))}
              placeholder={`Enter your ${currentRole?.idLabel}`}
              className="bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300"
            />
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
          </div>
        </div>
        <div>
          <label className="block mb-2 text-blue-900 text-sm font-semibold">Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => handlePasswordChange(e.target.value)}
              placeholder="Enter your password"
              className={`bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300 ${
                passwordError ? "border-red-500" : ""
              }`}
              autoComplete="current-password"
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={16} />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-700 transition"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {passwordError && (
            <div className="mt-1 text-red-600 text-xs">
              {passwordError}
            </div>
          )}
        </div>
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:from-blue-800 hover:to-cyan-500 h-10 text-sm font-bold rounded-lg transition-all duration-300 hover:scale-105"
          disabled={!!passwordError}
        >
          Login
        </Button>
        {showMsg && (
          <div className="mt-2 text-green-600 text-center text-sm">
            Ready to go to {role === "admin" ? "admin dashboard" : "chatbot"}!
          </div>
        )}
        {error && (
          <div className="mt-2 text-red-600 text-center text-sm">
            {error}
          </div>
        )}
      </form>
    </>
  );
}