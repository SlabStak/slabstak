"use client";

import { useState } from "react";
import StatsOverview from "./StatsOverview";
import UserManagement from "./UserManagement";
import CardModeration from "./CardModeration";
import SystemHealth from "./SystemHealth";

interface AdminDashboardProps {
  stats: {
    totalUsers: number;
    totalCards: number;
    activeSubscriptions: number;
    totalRevenue: number;
  };
  recentUsers: any[];
  recentCards: any[];
}

type Tab = "overview" | "users" | "cards" | "system";

export default function AdminDashboard({ stats, recentUsers, recentCards }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs = [
    { id: "overview" as Tab, label: "Overview" },
    { id: "users" as Tab, label: "Users" },
    { id: "cards" as Tab, label: "Cards" },
    { id: "system" as Tab, label: "System" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">Admin Dashboard</h1>
        <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          Admin
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-800">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-sky-400 text-sky-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <StatsOverview stats={stats} />}
      {activeTab === "users" && <UserManagement users={recentUsers} />}
      {activeTab === "cards" && <CardModeration cards={recentCards} />}
      {activeTab === "system" && <SystemHealth />}
    </div>
  );
}
