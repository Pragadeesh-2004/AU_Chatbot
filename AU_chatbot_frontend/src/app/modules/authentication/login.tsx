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
import { User, Lock, Eye, EyeOff } from "lucide-react";

const roleOptions = [
  { value: "admin", label: "Admin", idLabel: "Admin ID" },
  { value: "official", label: "Official", idLabel: "Official ID" },
  { value: "scholar", label: "Scholar", idLabel: "Scholar ID" },
  { value: "faculty", label: "Faculty", idLabel: "Faculty ID" },
  { value: "student", label: "Student", idLabel: "Roll No" },
];

type LoginPageProps = {
  showDialog?: (type: "error" | "success", message: string) => void;
};

export default function LoginPage({ showDialog }: LoginPageProps) {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRole = roleOptions.find(r => r.value === role);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/authentication/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, id, password }),
        }
      );
      
      if (!res.ok) {
        let data: any = {};
        try {
          const responseText = await res.text();
          console.log("Backend response:", responseText); // Debug: see what backend actually sends
          data = JSON.parse(responseText);
          console.log("Parsed data:", data); // Debug: see parsed object
          console.log("Message field:", data.message, typeof data.message); // Debug: check message field
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr);
          setError("Unable to connect to server");
          return;
        }
        
        // Extract ONLY the message string from backend JSON
        let errorMessage = "Login failed";
        
        if (data && data.message) {
          // Ensure we get a clean string, not an object
          if (typeof data.message === "string") {
            errorMessage = data.message.message;
          } else if (typeof data.message === "object") {
            // If somehow message is an object, stringify it
            errorMessage = String(JSON.stringify(data.message.message));
          } else {
            // Convert any other type to string
            errorMessage = String(data.message.message);
          }
        } else if (data && data.error && typeof data.error === "string" && data.error !== "Bad Request") {
          errorMessage = data.error;
        }
        
        console.log("Final error message to display:", errorMessage); // Debug: see what will be shown
        setError(errorMessage);
        return;
      }
      
      // Success case
      const data = await res.json();
      console.log("Login successful:", data);

      // Store user info in localStorage
      localStorage.setItem("userName", data.user.name || "Guest");
      localStorage.setItem("userRole", role);
      localStorage.setItem("userId", id);

      router.push("/modules/chatbot");
    } catch (err: any) {
      console.error("Network/fetch error:", err);
      setError("Network error. Please try again.");
    }
  };

  return (
    <form
      onSubmit={handleLogin}
      className="space-y-4 min-h-[350px] flex flex-col justify-center"
    >
      <div>
        <label className="block mb-2 text-blue-900 text-sm font-semibold">Role</label>
        <Select value={role} onValueChange={setRole}>
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
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="bg-white text-blue-900 border-blue-400 h-10 px-10 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300"
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
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:from-blue-800 hover:to-cyan-500 h-10 text-sm font-bold rounded-lg transition-all duration-300 hover:scale-105"
      >
        Login
      </Button>
      {showMsg && (
        <div className="mt-2 text-green-600 text-center text-sm">
          Ready to go to chatbot!
        </div>
      )}
      {error && (
        <div className="mt-2 text-red-600 text-center text-sm">
          {error}
        </div>
      )}
    </form>
  );
}