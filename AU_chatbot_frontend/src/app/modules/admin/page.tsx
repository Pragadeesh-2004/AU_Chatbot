"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Users, Building, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// provide a loading fallback so clicking "Rate Limit" doesn't show a white page
const RateLimitDashboard = dynamic(() => import("./rate-limit"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-cyan-200 text-lg">Loading rate limit dashboard...</p>
      </div>
    </div>
  )
}) as unknown as React.ComponentType<{ onBack?: () => void }>;

const UserDataDashboard = dynamic(() => import("./user-data"), { ssr: false }) as unknown as React.ComponentType<{ onBack?: () => void }>;

export default function AdminHomePage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [adminCollege, setAdminCollege] = useState("");
  const [currentView, setCurrentView] = useState("home");

  useEffect(() => {
    // Get admin info from localStorage
    const userName = localStorage.getItem("userName");
    const userRole = localStorage.getItem("userRole");
    const userCollege = localStorage.getItem("userCollege");
    
    // Verify this is actually an admin
    if (userRole !== "admin") {
      console.log("Not an admin user, redirecting...");
      router.push("/modules/authentication");
      return;
    }
    
    setAdminName(userName || "Admin");
    setAdminCollege(userCollege === "Anna_university" ? "Anna University" : userCollege || "");
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userCollege");
    router.push("/modules/authentication");
  };

  const handleBackToChatbot = () => {
    // Admin can still access chatbot if needed
    router.push("/modules/chatbot");
  };

  // Render different views based on currentView state
  if (currentView === "rate-limit") {
    return <RateLimitDashboard onBack={() => setCurrentView("home")} />;
  }

  if (currentView === "user-data") {
    // pass onBack so the child can return to the admin home without a full route change
    return <UserDataDashboard onBack={() => setCurrentView("home")} />;
  }

  // Default home view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <div className="flex justify-between items-center p-6 border-b border-blue-800">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-cyan-100">Admin Dashboard</h1>
            {adminCollege && (
              <div className="flex items-center gap-2 text-cyan-300 text-sm">
                <Building size={14} />
                <span>{adminCollege}</span>
              </div>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          className="text-cyan-200 hover:bg-blue-900 flex items-center gap-2"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          Logout
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] p-6">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-cyan-100 mb-2">
              Welcome, {adminName}!
            </h2>
            {adminCollege && (
              <p className="text-cyan-300 text-lg mb-4">
                {adminCollege} Administrator
              </p>
            )}
            <p className="text-cyan-200 text-base">
              Manage your system settings and monitor user data from here.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="bg-blue-900/50 backdrop-blur-md border border-blue-800 rounded-2xl p-8 cursor-pointer hover:bg-blue-900/70 transition-all duration-300 hover:scale-105"
              onClick={() => setCurrentView("rate-limit")}
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-cyan-700 p-4 rounded-full mb-4">
                  <Settings size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-cyan-100 mb-2">
                  Rate Limit Dashboard
                </h3>
                <p className="text-cyan-200 text-sm">
                  Configure rate limits, file sizes, and system constraints for different user roles.
                </p>
              </div>
            </div>

            <div
              className="bg-blue-900/50 backdrop-blur-md border border-blue-800 rounded-2xl p-8 cursor-pointer hover:bg-blue-900/70 transition-all duration-300 hover:scale-105"
              onClick={() => setCurrentView("user-data")}
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-cyan-700 p-4 rounded-full mb-4">
                  <Users size={32} className="text-white" />
                </div>
                <h3 className="text-xl font-semibold text-cyan-100 mb-2">
                  User Data Dashboard
                </h3>
                <p className="text-cyan-200 text-sm">
                  View and manage user data, monitor activity, and analyze usage patterns.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}