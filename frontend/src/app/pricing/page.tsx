"use client";

import { useState } from "react";

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create checkout session");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
      alert("Could not start checkout. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Pricing</h1>
        <p className="text-sm text-slate-300 max-w-xl">
          Start free. Upgrade only when SlabStak is clearly making you money.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Free</p>
          <h2 className="text-xl font-semibold">Collector</h2>
          <p className="text-sm text-slate-300">For casual collectors testing the tool.</p>
          <p className="text-3xl font-semibold">$0<span className="text-sm text-slate-400"> / month</span></p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• 10 scans / month</li>
            <li>• Vault up to 25 cards</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-sky-500 bg-slate-900/80 p-5 space-y-4 shadow-lg shadow-sky-900/40">
          <p className="text-xs uppercase tracking-[0.2em] text-sky-400">Most popular</p>
          <h2 className="text-xl font-semibold">Pro Flipper</h2>
          <p className="text-sm text-slate-300">For sellers, show dealers, and volume flippers.</p>
          <p className="text-3xl font-semibold">$29<span className="text-sm text-slate-400"> / month</span></p>
          <ul className="text-sm text-slate-300 space-y-1">
            <li>• High scan limits</li>
            <li>• Larger vault, history</li>
          </ul>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full mt-2 px-4 py-2.5 rounded-full bg-sky-500 text-slate-950 text-sm font-semibold hover:bg-sky-400 disabled:opacity-60"
          >
            {loading ? "Redirecting..." : "Upgrade to Pro"}
          </button>
        </div>
      </div>
    </div>
  );
}
