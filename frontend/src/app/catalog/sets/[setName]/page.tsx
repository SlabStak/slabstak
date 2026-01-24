"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import CardGrid from "@/components/catalog/CardGrid";

interface Card {
  id: string;
  player_name: string;
  set_name: string;
  card_number: string;
  year?: number;
  sport: string;
  manufacturer?: string;
  team?: string;
  position?: string;
  card_type: string;
  is_parallel: boolean;
  parallel_type?: string;
  image_url?: string;
}

export default function SetDetailPage() {
  const params = useParams();
  const setName = params.setName as string;

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [decodedSetName, setDecodedSetName] = useState("");

  useEffect(() => {
    if (!setName) return;

    const decoded = decodeURIComponent(setName);
    setDecodedSetName(decoded);

    const fetchCards = async () => {
      try {
        const response = await fetch(`/api/catalog/sets/${setName}/cards`);
        if (!response.ok) throw new Error("Set not found");

        const data = await response.json();
        setCards(data.cards);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load set");
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [setName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <Link href="/catalog/sets" className="text-blue-600 hover:underline">
            ← Back to Sets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation */}
        <div className="mb-6 space-y-2">
          <Link href="/catalog/sets" className="text-blue-600 hover:underline">
            ← Back to Sets
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{decodedSetName}</h1>
          {cards.length > 0 && (
            <p className="mt-2 text-gray-600">
              {cards.length} card{cards.length !== 1 ? "s" : ""} in this set
            </p>
          )}
        </div>

        {/* Cards Grid */}
        <CardGrid cards={cards} loading={loading} />

        {cards.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No cards found in this set.</p>
          </div>
        )}
      </div>
    </div>
  );
}
