"use client";
import React, { useState } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type GuestType = "anonymous" | "university" | "visitor";

const guestLabels: Record<GuestType, string> = {
  anonymous: "Anonymous",
  university: "University Member",
  visitor: "Visitor",
};

export default function GuestPage() {
  const [guestType, setGuestType] = useState<GuestType>("anonymous");
  const [showUser, setShowUser] = useState(false);

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
          <SelectItem value="anonymous" className="hover:bg-blue-100 hover:text-blue-900">Anonymous</SelectItem>
          <SelectItem value="university" className="hover:bg-blue-100 hover:text-blue-900">University Member</SelectItem>
          <SelectItem value="visitor" className="hover:bg-blue-100 hover:text-blue-900">Visitor</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white hover:from-blue-800 hover:to-cyan-500 h-10 text-sm font-bold rounded-lg transition-all duration-300 hover:scale-105"
        onClick={() => setShowUser(true)}
      >
        Continue to Chatbot
      </Button>
      {showUser && (
        <div className="mt-2 text-green-600 text-center text-sm">
          Selected user: <span className="font-bold">{guestLabels[guestType]}</span>
        </div>
      )}
    </div>
  );
}