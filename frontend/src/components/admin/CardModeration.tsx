"use client";

import { useState } from "react";
import Image from "next/image";

interface Card {
  id: string;
  player: string;
  set_name: string;
  year: number | null;
  grade_estimate: string | null;
  image_url: string | null;
  is_flagged?: boolean;
  flagged_reason?: string | null;
  flagged_at?: string | null;
  created_at: string;
  user_profiles?: {
    email: string;
  };
}

interface CardModerationProps {
  cards: Card[];
}

export default function CardModeration({ cards: initialCards }: CardModerationProps) {
  const [cards, setCards] = useState(initialCards);
  const [filter, setFilter] = useState<"all" | "flagged" | "recent">("recent");
  const [flaggingCardId, setFlaggingCardId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredCards = cards.filter((card) => {
    if (filter === "flagged") return card.is_flagged;
    if (filter === "recent") return !card.is_flagged;
    return true;
  });

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this card?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/cards/${cardId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCards(cards.filter((c) => c.id !== cardId));
      }
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  };

  const handleToggleFlag = async (cardId: string, currentFlagStatus: boolean) => {
    if (!currentFlagStatus) {
      // Show modal to flag the card
      setFlaggingCardId(cardId);
      setFlagReason("");
      return;
    }

    // Unflag directly
    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_flagged: false }),
      });

      if (res.ok) {
        setCards(
          cards.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  is_flagged: false,
                  flagged_reason: null,
                  flagged_at: null,
                }
              : c
          )
        );
      }
    } catch (error) {
      console.error("Failed to unflag card:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitFlag = async () => {
    if (!flaggingCardId) return;

    try {
      setIsLoading(true);
      const res = await fetch(`/api/admin/cards/${flaggingCardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_flagged: true,
          flagged_reason: flagReason || null,
        }),
      });

      if (res.ok) {
        setCards(
          cards.map((c) =>
            c.id === flaggingCardId
              ? {
                  ...c,
                  is_flagged: true,
                  flagged_reason: flagReason || null,
                  flagged_at: new Date().toISOString(),
                }
              : c
          )
        );
        setFlaggingCardId(null);
        setFlagReason("");
      }
    } catch (error) {
      console.error("Failed to flag card:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("recent")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "recent"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-300"
          }`}
        >
          Recent
        </button>
        <button
          onClick={() => setFilter("flagged")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "flagged"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-300"
          }`}
        >
          Flagged
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === "all"
              ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-300"
          }`}
        >
          All Cards
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => (
          <div
            key={card.id}
            className={`p-4 rounded-xl border transition-colors ${
              card.is_flagged
                ? "bg-red-500/10 border-red-500/30"
                : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
            }`}
          >
            {card.is_flagged && (
              <div className="mb-2 px-2 py-1 rounded bg-red-500/20 border border-red-500/30">
                <p className="text-xs font-semibold text-red-400">🚩 Flagged</p>
                {card.flagged_reason && (
                  <p className="text-xs text-red-400 mt-1">{card.flagged_reason}</p>
                )}
              </div>
            )}

            {card.image_url && (
              <div className="relative aspect-[3/4] mb-3 rounded-lg overflow-hidden bg-slate-800">
                <Image
                  src={card.image_url}
                  alt={card.player}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-semibold text-slate-100">{card.player}</h3>
              <p className="text-sm text-slate-400">
                {card.year && `${card.year} `}
                {card.set_name}
              </p>
              {card.grade_estimate && (
                <div className="text-xs text-slate-500">Grade: {card.grade_estimate}</div>
              )}

              <div className="text-xs text-slate-500">
                User: {card.user_profiles?.email || "Unknown"}
              </div>

              <div className="text-xs text-slate-500">
                {new Date(card.created_at).toLocaleDateString()}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => window.open(`/vault/${card.id}`, "_blank")}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => handleToggleFlag(card.id, card.is_flagged ?? false)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    card.is_flagged
                      ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20"
                      : "bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                  }`}
                  disabled={isLoading}
                >
                  {card.is_flagged ? "Unflag" : "Flag"}
                </button>
                <button
                  onClick={() => handleDeleteCard(card.id)}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCards.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          No cards to display.
        </div>
      )}

      {/* Flag Modal */}
      {flaggingCardId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-4">Flag Card for Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Reason (optional)
                </label>
                <textarea
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  placeholder="e.g., Duplicate, Inappropriate content, Quality issue..."
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFlaggingCardId(null)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitFlag}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? "Flagging..." : "Flag"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
