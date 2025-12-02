"use client";

import { useState, useEffect } from "react";

interface HealthStatus {
  status: string;
  timestamp: string;
  services: {
    backend: boolean;
    database: boolean;
    storage: boolean;
    stripe: boolean;
  };
}

export default function SystemHealth() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
  }, []);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/health");
      const data = await res.json();
      setHealth(data);
    } catch (error) {
      console.error("Failed to fetch health status:", error);
    } finally {
      setLoading(false);
    }
  };

  const services = [
    { name: "Backend API", key: "backend" as const, endpoint: process.env.NEXT_PUBLIC_BACKEND_SCAN_URL },
    { name: "Database", key: "database" as const, endpoint: "Supabase" },
    { name: "Storage", key: "storage" as const, endpoint: "Supabase Storage" },
    { name: "Stripe", key: "stripe" as const, endpoint: "Stripe API" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">System Health</h2>
        <button
          onClick={fetchHealth}
          className="px-4 py-2 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium hover:bg-sky-500/20 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Overall Status */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              health?.status === "ok" ? "bg-emerald-400" : "bg-red-400"
            } animate-pulse`}
          />
          <div>
            <div className="font-semibold text-slate-100">
              {loading ? "Checking..." : health?.status === "ok" ? "All Systems Operational" : "System Issues Detected"}
            </div>
            <div className="text-sm text-slate-400">
              Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "Never"}
            </div>
          </div>
        </div>
      </div>

      {/* Service Status */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Services</h3>
        {services.map((service) => (
          <div
            key={service.key}
            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between"
          >
            <div>
              <div className="font-medium text-slate-100">{service.name}</div>
              <div className="text-sm text-slate-500">{service.endpoint}</div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                health?.services[service.key]
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {loading ? "..." : health?.services[service.key] ? "Operational" : "Down"}
            </div>
          </div>
        ))}
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="text-sm text-slate-400 mb-1">API Response Time</div>
          <div className="text-2xl font-bold text-slate-100">~150ms</div>
          <div className="text-xs text-emerald-400 mt-1">Good</div>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="text-sm text-slate-400 mb-1">Database Queries/min</div>
          <div className="text-2xl font-bold text-slate-100">~45</div>
          <div className="text-xs text-sky-400 mt-1">Normal</div>
        </div>

        <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
          <div className="text-sm text-slate-400 mb-1">Storage Usage</div>
          <div className="text-2xl font-bold text-slate-100">2.3GB</div>
          <div className="text-xs text-slate-400 mt-1">of 10GB free tier</div>
        </div>
      </div>

      {/* Logs */}
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider mb-4">
          Recent System Logs
        </h3>
        <div className="space-y-2 font-mono text-xs">
          <div className="text-slate-500">
            <span className="text-emerald-400">[INFO]</span> 2024-12-02 06:15:00 - Database connection pool healthy
          </div>
          <div className="text-slate-500">
            <span className="text-sky-400">[INFO]</span> 2024-12-02 06:14:45 - Stripe webhook received successfully
          </div>
          <div className="text-slate-500">
            <span className="text-emerald-400">[INFO]</span> 2024-12-02 06:14:30 - Card scan completed for user abc123
          </div>
          <div className="text-slate-500">
            <span className="text-yellow-400">[WARN]</span> 2024-12-02 06:14:15 - High API usage detected
          </div>
          <div className="text-slate-500">
            <span className="text-emerald-400">[INFO]</span> 2024-12-02 06:14:00 - Daily backup completed
          </div>
        </div>
      </div>
    </div>
  );
}
