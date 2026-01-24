"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface StatsOverviewProps {
  stats: {
    totalUsers: number;
    totalCards: number;
    activeSubscriptions: number;
    totalRevenue: number;
  };
}

// Generate sample data for last 30 days
function generateChartData(totalValue: number, dataPoints: number = 30) {
  const data = [];
  for (let i = 0; i < dataPoints; i++) {
    const day = i + 1;
    // Generate realistic trend data (generally increasing with some variance)
    const trendValue = (totalValue / dataPoints) * day;
    const variance = totalValue * 0.1 * (Math.random() - 0.5);
    const value = Math.max(0, trendValue + variance);
    data.push({
      day: `Day ${day}`,
      value: Math.round(value),
    });
  }
  return data;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const router = useRouter();
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const revenueData = generateChartData(stats.totalRevenue, 30);
  const userGrowthData = Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    users: Math.round((stats.totalUsers / 30) * (i + 1) * (0.8 + Math.random() * 0.4)),
  }));

  const handleExportUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/users/export");
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Failed to export users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) return;

    try {
      setIsLoading(true);
      // In a real implementation, this would send emails or in-app notifications
      console.log("Announcement:", announcementText);
      setShowAnnouncement(false);
      setAnnouncementText("");
    } catch (error) {
      console.error("Failed to send announcement:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      icon: "👥",
      color: "sky",
    },
    {
      label: "Total Cards",
      value: stats.totalCards.toLocaleString(),
      icon: "🃏",
      color: "emerald",
    },
    {
      label: "Active Subscriptions",
      value: stats.activeSubscriptions.toLocaleString(),
      icon: "💳",
      color: "purple",
    },
    {
      label: "Monthly Revenue",
      value: `$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: "💰",
      color: "yellow",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-xs font-semibold text-${stat.color}-400`}>
                {stat.label}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-100">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
                interval={4}
              />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Legend wrapperStyle={{ color: "#94a3b8" }} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                dot={false}
                strokeWidth={2}
                name="Daily Revenue"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth Chart */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">User Growth (Cumulative)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={userGrowthData}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="day"
                stroke="#94a3b8"
                tick={{ fontSize: 12 }}
                interval={4}
              />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Area
                type="monotone"
                dataKey="users"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorUsers)"
                name="Cumulative Users"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportUsers}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium hover:bg-sky-500/20 transition-colors disabled:opacity-50"
          >
            Export Users
          </button>
          <button className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium hover:bg-emerald-500/20 transition-colors">
            Export Cards
          </button>
          <button
            onClick={() => setShowAnnouncement(true)}
            className="px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium hover:bg-purple-500/20 transition-colors"
          >
            Send Announcement
          </button>
          <button
            onClick={() => router.push("/admin/analytics")}
            className="px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 transition-colors"
          >
            View Analytics
          </button>
        </div>
      </div>

      {/* Announcement Modal */}
      {showAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Send Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Message
                </label>
                <textarea
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  placeholder="Enter announcement message..."
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAnnouncement(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAnnouncement}
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                  disabled={isLoading || !announcementText.trim()}
                >
                  {isLoading ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
