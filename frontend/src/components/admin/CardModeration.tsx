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
        {cards.map((card) => (
          <div
            key={card.id}
            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
          >
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

      {cards.length === 0 && (
        <div className="py-12 text-center text-slate-500">
          No cards to display.
        </div>
      )}
    </div>
  );
}
