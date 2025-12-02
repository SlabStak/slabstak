"use client";

import { useEffect, useState } from "react";
import type { DealerShow } from "@/lib/types";

export default function DealerDashboardPage() {
  const [shows, setShows] = useState<DealerShow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/dealer/shows");
        const data = await res.json();
        setShows(data.shows ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/dealer/shows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, location }),
      });
      if (!res.ok) throw new Error("Failed to create show");
      const data = await res.json();
      setShows((prev) => [data.show, ...prev]);
      setName("");
      setLocation("");
    } catch (err) {
      console.error(err);
      alert("Could not create show");
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Dealer dashboard</h1>
        <p className="text-sm text-slate-300 max-w-xl">
          Track shows, table inventory, and profits in one place.
        </p>
      </div>

      <form
        onSubmit={handleCreate}
        className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3 text-sm"
      >
        <p className="font-semibold text-slate-100 text-sm">Create new show</p>
        <div className="flex flex-wrap gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Show name"
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 flex-1 min-w-[160px]"
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location"
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-100 flex-1 min-w-[160px]"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-full bg-sky-500 text-slate-950 text-xs font-semibold hover:bg-sky-400"
          >
            Add show
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <p className="text-xs text-slate-400 uppercase tracking-[0.18em]">Shows</p>
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : !shows.length ? (
          <p className="text-sm text-slate-400">
            No shows yet. Create your first one above.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {shows.map((show) => (
              <a
                key={show.id}
                href={`/dealer/shows/${show.id}`}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs hover:border-sky-500 transition"
              >
                <p className="font-semibold text-sm">{show.name}</p>
                <p className="text-slate-400">{show.location ?? "Location TBA"}</p>
                <p className="text-[11px] text-slate-500">
                  Created {new Date(show.created_at).toLocaleDateString()}
                </p>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
