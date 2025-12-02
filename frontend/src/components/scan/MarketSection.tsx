"use client";

import { useState } from "react";
import { MarketSnapshot, fetchMarketSnapshot } from "@/lib/market";
import { ScanResult } from "@/lib/types";
import Spinner from "@/components/ui/Spinner";

export default function MarketSection({ result }: { result: ScanResult }) {
  const [market, setMarket] = useState<MarketSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMarketSnapshot({
        player: result.player,
        set_name: result.set_name,
        year: result.year,
        grade_estimate: result.grade_estimate,
      });
      setMarket(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load market data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-3 text-xs mt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
          Live comps (beta)
        </p>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-2.5 py-1 rounded-full border border-slate-700 text-[11px] text-slate-100 hover:border-sky-400 disabled:opacity-60 flex items-center gap-1"
        >
          {loading && <Spinner size="sm" />}
          {loading ? "Refreshing..." : "Refresh comps"}
        </button>
      </div>

      {error && <p className="text-[11px] text-rose-400">{error}</p>}

      {market ? (
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-slate-500 text-[11px]">Floor</p>
            <p className="text-sm text-slate-100">
              ${market.floor.toFixed(0)} {market.currency}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-[11px]">Average</p>
            <p className="text-sm text-emerald-400 font-semibold">
              ${market.average.toFixed(0)} {market.currency}
            </p>
          </div>
          <div>
            <p className="text-slate-500 text-[11px]">Ceiling</p>
            <p className="text-sm text-slate-100">
              ${market.ceiling.toFixed(0)} {market.currency}
            </p>
          </div>
          {typeof market.listings_count === "number" && (
            <div>
              <p className="text-slate-500 text-[11px]">Listings</p>
              <p className="text-sm text-slate-100">{market.listings_count}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">
          Hit refresh to pull a live-ish market snapshot for this card.
        </p>
      )}
    </div>
  );
}
