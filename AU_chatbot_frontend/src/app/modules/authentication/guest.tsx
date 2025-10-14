"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type GuestType = "university" | "visitor";

const guestLabels: Record<GuestType, string> = {
  university: "University Member",
  visitor: "Visitor",
};

export default function GuestPage() {
  const [guestType, setGuestType] = useState<GuestType>("university");
  const router = useRouter();

  const handleContinue = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"}/authentication/guest-visit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guestType }),
        }
      );
    } catch (e) {
      // handle error if needed
    }
    router.push("/modules/chatbot");
  };

  return (
    <div className="space-y-4">
      <label className="block mb-2 text-blue-900 text-sm font-semibold">Select Guest Type</label>
      <Select
        value={guestType}
        onValueChange={(value: string) => setGuestType(value as GuestType)}
      >
        <SelectTrigger className="bg-white text-blue-900 border-blue-400 h-10 px-3 text-sm rounded-lg focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all duration-300">
          {guestLabels[guestType]}
        </SelectTrigger>
        <SelectContent className="bg-white text-blue-900 border-blue-400">
          <SelectItem value="university" className="hover:bg-blue-100 hover:text-blue-900">University Member</SelectItem>
          <SelectItem value="visitor" className="hover:bg-blue-100 hover:text-blue-900">Visitor</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:from-blue-800 hover:to-cyan-500 h-10 text-sm font-bold rounded-lg transition-all duration-300 hover:scale-105"
        onClick={handleContinue}
      >
        Continue to Chatbot
      </Button>
    </div>
  );
}