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
      <label className="block mb-1 text-white text-lg">Select Guest Type</label>
      <Select
        value={guestType}
        onValueChange={(value: string) => setGuestType(value as GuestType)}
      >
        <SelectTrigger className="bg-black text-white border-white h-12 px-4 text-lg flex items-center">
          {guestLabels[guestType]}
        </SelectTrigger>
        <SelectContent className="bg-black text-white border-white">
          <SelectItem value="anonymous">Anonymous</SelectItem>
          <SelectItem value="university">University Member</SelectItem>
          <SelectItem value="visitor">Visitor</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        className="w-full bg-white text-black hover:bg-gray-200 h-12 text-lg"
        onClick={() => setShowUser(true)}
      >
        Continue to Chatbot
      </Button>
      {showUser && (
        <div className="mt-2 text-green-400 text-center text-lg">
          Selected user: <span className="font-bold">{guestLabels[guestType]}</span>
        </div>
      )}
    </div>
  );
}