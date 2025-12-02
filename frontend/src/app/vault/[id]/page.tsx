"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Spinner from "@/components/ui/Spinner";
import ListingGenerator from "@/components/listing/ListingGenerator";
import { CardRecord } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface MarketData {
  source: string;
  floor: number;
  average: number;
  ceiling: number;
  listings_count: number;
  confidence: string;
  comps?: Array<{
    title: string;
    price: number;
    sold_date: string;
    url?: string;
  }>;
}

export default function CardDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [card, setCard] = useState<CardRecord | null>(null);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isFetchingMarket, setIsFetchingMarket] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [notes, setNotes] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [soldPrice, setSoldPrice] = useState("");

  useEffect(() => {
    fetchCard();
  }, [resolvedParams.id]);

  const fetchCard = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/cards/${resolvedParams.id}`);

      if (!res.ok) {
        if (res.status === 404) {
          setError("Card not found");
          return;
        }
        throw new Error("Failed to fetch card");
      }

      const data = await res.json();
      setCard(data.card);
      setNotes(data.card.notes || "");
      setPurchasePrice(data.card.purchase_price?.toString() || "");
      setSoldPrice(data.card.sold_price?.toString() || "");
    } catch (err) {
      console.error(err);
      setError("Failed to load card");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarketData = async () => {
    if (!card) return;

    try {
      setIsFetchingMarket(true);
      const url = process.env.NEXT_PUBLIC_BACKEND_SCAN_URL?.replace("/scan", "/market") || "/api/market";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: card.player,
          set_name: card.set_name,
          year: card.year,
          grade_estimate: card.grade_estimate,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMarketData(data);
      }
    } catch (err) {
      console.error("Market data fetch failed:", err);
    } finally {
      setIsFetchingMarket(false);
    }
  };

  const handleSave = async () => {
    if (!card) return;

    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
          sold_price: soldPrice ? parseFloat(soldPrice) : null,
        }),
      });

      if (res.ok) {
        await fetchCard();
        setIsEditing(false);
      } else {
        throw new Error("Failed to update card");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save changes");
    }
  };

  const handleDelete = async () => {
    if (!card || !confirm("Are you sure you want to delete this card?")) return;

    try {
      setIsDeleting(true);
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/vault");
      } else {
        throw new Error("Failed to delete card");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete card");
      setIsDeleting(false);
    }
  };

  const calculateProfit = () => {
    if (!card) return null;
    const bought = parseFloat(purchasePrice);
    const sold = parseFloat(soldPrice);
    if (!isNaN(bought) && !isNaN(sold)) {
      return sold - bought;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">{error || "Card not found"}</h2>
        <button
          onClick={() => router.push("/vault")}
          className="text-sky-400 hover:text-sky-300"
        >
          ← Back to vault
        </button>
      </div>
    );
  }

  const profit = calculateProfit();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/vault")}
          className="text-sm text-slate-400 hover:text-sky-400 flex items-center gap-2"
        >
          ← Back to vault
        </button>
        <div className="flex gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700"
            >
              Edit
            </button>
          )}
          {isEditing && (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setNotes(card.notes || "");
                  setPurchasePrice(card.purchase_price?.toString() || "");
                  setSoldPrice(card.sold_price?.toString() || "");
                }}
                className="px-3 py-1.5 text-sm rounded-lg bg-slate-800 text-slate-100 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 text-sm rounded-lg bg-sky-500 text-slate-950 hover:bg-sky-400"
              >
                Save
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-1.5 text-sm rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Image */}
        <div className="space-y-4">
          {card.image_url ? (
            <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
              <Image
                src={card.image_url}
                alt={`${card.player} - ${card.set_name}`}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="aspect-[3/4] rounded-xl border border-dashed border-slate-700 bg-slate-900/60 flex items-center justify-center">
              <p className="text-slate-500 text-sm">No image</p>
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="space-y-6">
          {/* Card Info */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h1 className="text-2xl font-semibold text-slate-100">{card.player}</h1>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Set:</span>
                <span className="text-slate-100 font-medium">{card.set_name}</span>
              </div>
              {card.year && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Year:</span>
                  <span className="text-slate-100">{card.year}</span>
                </div>
              )}
              {card.team && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Team:</span>
                  <span className="text-slate-100">{card.team}</span>
                </div>
              )}
              {card.sport && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Sport:</span>
                  <span className="text-slate-100">{card.sport}</span>
                </div>
              )}
              {card.grade_estimate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Grade:</span>
                  <span className="text-slate-100 font-medium">{card.grade_estimate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Valuation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Estimated Value</h2>
              <span className={`text-xs px-2 py-1 rounded ${
                card.recommendation === "flip" ? "bg-emerald-500/20 text-emerald-400" :
                card.recommendation === "hold" ? "bg-sky-500/20 text-sky-400" :
                card.recommendation === "grade" ? "bg-purple-500/20 text-purple-400" :
                "bg-slate-700 text-slate-300"
              }`}>
                {card.recommendation.toUpperCase()}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Low:</span>
                <span className="text-slate-100">${card.estimated_low.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">High:</span>
                <span className="text-slate-100">${card.estimated_high.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mid-point:</span>
                <span className="text-slate-100 font-medium">
                  ${((card.estimated_low + card.estimated_high) / 2).toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={fetchMarketData}
              disabled={isFetchingMarket}
              className="w-full px-4 py-2 text-sm rounded-lg bg-sky-500 text-slate-950 font-semibold hover:bg-sky-400 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isFetchingMarket && <Spinner size="sm" />}
              {isFetchingMarket ? "Fetching..." : "Refresh Market Data"}
            </button>
          </div>

          {/* Purchase/Sale Tracking */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Tracking</h2>

            <div className="space-y-3 text-sm">
              <div>
                <label className="text-slate-500 block mb-1">Purchase Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 disabled:opacity-60"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-slate-500 block mb-1">Sold Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={soldPrice}
                  onChange={(e) => setSoldPrice(e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 disabled:opacity-60"
                  placeholder="0.00"
                />
              </div>

              {profit !== null && (
                <div className={`flex justify-between pt-2 border-t border-slate-700 ${
                  profit > 0 ? "text-emerald-400" : profit < 0 ? "text-rose-400" : "text-slate-400"
                }`}>
                  <span className="font-medium">Profit/Loss:</span>
                  <span className="font-semibold">
                    {profit > 0 ? "+" : ""}{profit.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-100">Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!isEditing}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm disabled:opacity-60 resize-none"
              placeholder="Add notes about this card..."
            />
          </div>
        </div>
      </div>

      {/* Market Data Section */}
      {marketData && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Recent Sales</h2>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Source:</span>
              <span className={`px-2 py-1 rounded ${
                marketData.confidence === "high" ? "bg-emerald-500/20 text-emerald-400" :
                marketData.confidence === "medium" ? "bg-sky-500/20 text-sky-400" :
                "bg-slate-700 text-slate-400"
              }`}>
                {marketData.source} • {marketData.confidence} confidence
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="rounded-lg bg-slate-800/60 p-4">
              <p className="text-slate-500 text-xs mb-1">Floor</p>
              <p className="text-slate-100 font-semibold text-lg">${marketData.floor.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-slate-800/60 p-4">
              <p className="text-slate-500 text-xs mb-1">Average</p>
              <p className="text-slate-100 font-semibold text-lg">${marketData.average.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-slate-800/60 p-4">
              <p className="text-slate-500 text-xs mb-1">Ceiling</p>
              <p className="text-slate-100 font-semibold text-lg">${marketData.ceiling.toLocaleString()}</p>
            </div>
          </div>

          {marketData.comps && marketData.comps.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-400">Comparable Sales</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {marketData.comps.map((comp, idx) => (
                  <div key={idx} className="rounded-lg bg-slate-800/40 p-3 text-xs">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-slate-100 flex-1 pr-2">{comp.title}</p>
                      <span className="text-emerald-400 font-semibold whitespace-nowrap">
                        ${comp.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>{new Date(comp.sold_date).toLocaleDateString()}</span>
                      {comp.url && (
                        <a
                          href={comp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:text-sky-300"
                        >
                          View →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Listing Generator */}
      <div className="mt-8">
        <ListingGenerator card={card} />
      </div>
    </div>
  );
}
