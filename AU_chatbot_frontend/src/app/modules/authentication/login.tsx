"use client";
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [showMsg, setShowMsg] = useState(false);

  return (
    <form className="space-y-4">
      <div>
        <label className="block mb-1 text-white text-lg">ID</label>
        <Input
          type="text"
          value={id}
          onChange={e => setId(e.target.value)}
          placeholder="Enter your ID"
          className="bg-black text-white border-white h-12 px-4 text-lg"
        />
      </div>
      <div>
        <label className="block mb-1 text-white text-lg">Password</label>
        <Input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Enter your password"
          className="bg-black text-white border-white h-12 px-4 text-lg"
        />
      </div>
      <Button
        type="button"
        className="w-full bg-white text-black hover:bg-gray-200 h-12 text-lg"
        onClick={() => setShowMsg(true)}
      >
        Login
      </Button>
      {showMsg && (
        <div className="mt-2 text-green-400 text-center text-lg">
          Ready to go to chatbot!
        </div>
      )}
    </form>
  );
}