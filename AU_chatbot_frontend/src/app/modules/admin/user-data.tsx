"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UserDataDashboard() {
  const router = useRouter();

  useEffect(() => {
    // Clear any existing localStorage items
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <div className="flex items-center justify-between p-6 border-b border-blue-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-cyan-300 hover:bg-blue-900"
            onClick={() => router.push("/modules/admin")}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-cyan-100">User Data Dashboard</h1>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-blue-900/30 backdrop-blur-md border border-blue-800 rounded-2xl p-8 text-center">
          <Users size={64} className="text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-cyan-100 mb-4">User Data Dashboard</h2>
          <p className="text-cyan-200 text-lg">
            This dashboard will show user statistics, activity logs, and data management tools.
          </p>
          <p className="text-cyan-300 text-sm mt-4">
            Coming Soon...
          </p>
        </div>
      </div>
    </div>
  );
}