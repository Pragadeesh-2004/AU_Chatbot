"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Users, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic imports for the components
const RateLimitDashboard = dynamic(() => import("./rate-limit"), { ssr: false });
const UserDataDashboard = dynamic(() => import("./user-data"), { ssr: false });

export default function AdminHomePage() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");
  const [currentView, setCurrentView] = useState("home");

  useEffect(() => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    setAdminName("Admin");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    router.push("/modules/authentication");
  };

  // Render different views based on currentView state
  if (currentView === "rate-limit") {
    return <RateLimitDashboard />;
  }

  if (currentView === "user-data") {
    return <UserDataDashboard />;
  }

  // Default home view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <div className="flex justify-between items-center p-6 border-b border-blue-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-cyan-300 hover:bg-blue-900"
            onClick={() => router.push("/modules/chatbot")}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-cyan-100">Admin Dashboard</h1>
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
            <h2 className="text-4xl font-bold text-cyan-100 mb-4">
              Welcome, {adminName}!
            </h2>
            <p className="text-cyan-200 text-lg">
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