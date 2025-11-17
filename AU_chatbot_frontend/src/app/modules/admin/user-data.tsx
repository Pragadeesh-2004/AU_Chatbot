"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, UserCheck, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale } from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale);

interface UserStats {
  students: number;
  faculty: number;
  scholars: number;
  officials: number;
  total: number;
}

interface GuestStats {
  visitor: number;
  university_member: number;
  total: number;
}

export default function UserDataDashboard({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Back handler: prefer parent callback (page.tsx) else navigate to admin route
  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
    } else {
      router.push("/modules/admin");
    }
  };

  useEffect(() => {
    // Verify admin access
    const userRole = localStorage.getItem("userRole");
    if (userRole !== "admin") {
      router.push("/modules/authentication");
      return;
    }

    fetchStatistics();
  }, [router]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
      
      // Fetch user statistics
      const userResponse = await fetch(`${baseUrl}/admin/statistics/users`, { credentials: 'include' });
      if (!userResponse.ok) throw new Error("Failed to fetch user statistics");
      const userData = await userResponse.json();
      setUserStats(userData);

      // Fetch guest statistics  
      const guestResponse = await fetch(`${baseUrl}/admin/statistics/guests`, { credentials: 'include' });
      if (!guestResponse.ok) throw new Error("Failed to fetch guest statistics");
      const guestData = await guestResponse.json();
      setGuestStats(guestData);

    } catch (err) {
      console.error("Error fetching statistics:", err);
      setError("Failed to load statistics");
    } finally {
      setLoading(false);
    }
  };

  // User chart data
  const userChartData = userStats ? {
    labels: ['Students', 'Faculty', 'Scholars', 'Officials'],
    datasets: [
      {
        label: 'Users',
        data: [userStats.students, userStats.faculty, userStats.scholars, userStats.officials],
        backgroundColor: [
          '#3B82F6', // Blue for Students
          '#10B981', // Green for Faculty  
          '#F59E0B', // Yellow for Scholars
          '#EF4444', // Red for Officials
        ],
        borderColor: [
          '#1D4ED8',
          '#059669', 
          '#D97706',
          '#DC2626',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          '#2563EB',
          '#047857',
          '#B45309', 
          '#B91C1C',
        ],
      },
    ],
  } : null;

  // Guest chart data
  const guestChartData = guestStats ? {
    labels: ['Visitors', 'University Members'],
    datasets: [
      {
        label: 'Guests',
        data: [guestStats.visitor, guestStats.university_member],
        backgroundColor: [
          '#8B5CF6', // Purple for Visitors
          '#06B6D4', // Cyan for University Members
        ],
        borderColor: [
          '#7C3AED',
          '#0891B2',
        ],
        borderWidth: 2,
        hoverBackgroundColor: [
          '#6D28D9',
          '#0E7490',
        ],
      },
    ],
  } : null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          color: '#E2E8F0',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        cornerRadius: 8,
        displayColors: true,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-cyan-200 text-lg">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-blue-800">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-cyan-300 hover:bg-blue-900 transition-colors"
            onClick={handleBack}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-2xl font-bold text-cyan-100">User Data Dashboard</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {error ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-900/30 backdrop-blur-md border border-red-800 rounded-2xl p-8 text-center">
              <p className="text-red-200 text-lg">{error}</p>
              <Button 
                onClick={fetchStatistics}
                className="mt-4 bg-red-700 hover:bg-red-600 text-white"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-900/30 backdrop-blur-md border border-blue-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="text-cyan-400" size={24} />
                  <h3 className="text-xl font-semibold text-cyan-100">Total Registered Users</h3>
                </div>
                <p className="text-3xl font-bold text-white">{userStats?.total || 0}</p>
                <p className="text-cyan-300 text-sm mt-1">Active system users</p>
              </div>

              <div className="bg-blue-900/30 backdrop-blur-md border border-blue-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-2">
                  <UserCheck className="text-purple-400" size={24} />
                  <h3 className="text-xl font-semibold text-cyan-100">Total Guest Visits</h3>
                </div>
                <p className="text-3xl font-bold text-white">{guestStats?.total || 0}</p>
                <p className="text-cyan-300 text-sm mt-1">Anonymous visitors</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Users Pie Chart */}
              <div className="bg-blue-900/30 backdrop-blur-md border border-blue-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-cyan-100 mb-6 text-center">
                  Registered Users Distribution
                </h3>
                {userStats && userStats.total > 0 ? (
                  <div className="h-80">
                    {userChartData && <Pie data={userChartData} options={chartOptions} />}
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-cyan-300 text-center">No registered users found</p>
                  </div>
                )}
                {userStats && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="text-cyan-200">
                      <span className="text-blue-400">●</span> Students: {userStats.students}
                    </div>
                    <div className="text-cyan-200">
                      <span className="text-green-400">●</span> Faculty: {userStats.faculty}
                    </div>
                    <div className="text-cyan-200">
                      <span className="text-yellow-400">●</span> Scholars: {userStats.scholars}
                    </div>
                    <div className="text-cyan-200">
                      <span className="text-red-400">●</span> Officials: {userStats.officials}
                    </div>
                  </div>
                )}
              </div>

              {/* Guests Pie Chart */}
              <div className="bg-blue-900/30 backdrop-blur-md border border-blue-800 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-cyan-100 mb-6 text-center">
                  Guest Visits Distribution
                </h3>
                {guestStats && guestStats.total > 0 ? (
                  <div className="h-80">
                    {guestChartData && <Pie data={guestChartData} options={chartOptions} />}
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-cyan-300 text-center">No guest visits recorded</p>
                  </div>
                )}
                {guestStats && (
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                    <div className="text-cyan-200">
                      <span className="text-purple-400">●</span> Visitors: {guestStats.visitor}
                    </div>
                    <div className="text-cyan-200">
                      <span className="text-cyan-400">●</span> University Members: {guestStats.university_member}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Statistics */}
            <div className="bg-blue-900/30 backdrop-blur-md border border-blue-800 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-cyan-100 mb-4">Detailed Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="text-lg font-medium text-cyan-200">User Categories</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Students:</span>
                      <span className="text-white font-medium">{userStats?.students || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Faculty:</span>
                      <span className="text-white font-medium">{userStats?.faculty || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Scholars:</span>
                      <span className="text-white font-medium">{userStats?.scholars || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Officials:</span>
                      <span className="text-white font-medium">{userStats?.officials || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-medium text-cyan-200">Guest Categories</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Visitors:</span>
                      <span className="text-white font-medium">{guestStats?.visitor || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">University Members:</span>
                      <span className="text-white font-medium">{guestStats?.university_member || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-medium text-cyan-200">Total Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Total Registered:</span>
                      <span className="text-white font-medium">{userStats?.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-cyan-300">Total Guest Visits:</span>
                      <span className="text-white font-medium">{guestStats?.total || 0}</span>
                    </div>
                    <div className="flex justify-between border-t border-blue-700 pt-2 mt-2">
                      <span className="text-cyan-200 font-medium">Grand Total:</span>
                      <span className="text-white font-bold">{(userStats?.total || 0) + (guestStats?.total || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}