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

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState("student");
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const currentRole = roleOptions.find(r => r.value === role);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // ...your login logic...
    // If login is successful:
    router.push("/modules/chatbot");
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
    </form>
  );
}