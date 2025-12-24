"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsDashboardProps {
  data: {
    scans_per_day: Array<{ day: string; value: number }>;
    active_users: Array<{ day: string; value: number }>;
    top_players: Array<{ player: string; scans: number }>;
    summary: {
      total_scans: number;
      total_users: number;
    };
  };
}

export default function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-semibold">Analytics Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Total Scans</h3>
          <p className="text-3xl font-bold text-slate-100">{data.summary.total_scans.toLocaleString()}</p>
        </div>
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-sm font-medium text-slate-400 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-slate-100">{data.summary.total_users.toLocaleString()}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scans Per Day */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">Scans Per Day (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.scans_per_day}>
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
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                dot={false}
                strokeWidth={2}
                name="Scans"
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Active Users */}
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-lg font-semibold mb-4">New Users (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.active_users}>
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
              <Bar
                dataKey="value"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                name="New Users"
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Scanned Players */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
        <h3 className="text-lg font-semibold mb-4">Top 10 Scanned Players</h3>
        <div className="space-y-3">
          {data.top_players.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm text-slate-300">{item.player}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-600"
                    style={{
                      width: `${
                        data.top_players.length > 0
                          ? (item.scans / data.top_players[0].scans) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-400 w-8 text-right">
                  {item.scans}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
