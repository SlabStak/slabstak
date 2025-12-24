"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

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
  print_run?: number;
  is_parallel: boolean;
  parallel_type?: string;
  description?: string;
  image_url?: string;
  unique_key: string;
  created_at: string;
}

interface PriceHistory {
  id: string;
  card_id: string;
  psa_10_value?: number;
  psa_9_value?: number;
  psa_8_value?: number;
  raw_value?: number;
  source?: string;
  recorded_at: string;
}

export default function CardDetailPage() {
  const params = useParams();
  const cardId = params.cardId as string;

  const [card, setCard] = useState<Card | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cardId) return;

    const fetchCard = async () => {
      try {
        const response = await fetch(`/api/catalog/cards/${cardId}`);
        if (!response.ok) throw new Error("Card not found");

        const data = await response.json();
        setCard(data.card);
        setPriceHistory(data.price_history);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load card");
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [cardId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-red-600 text-lg mb-4">{error || "Card not found"}</p>
          <Link href="/catalog" className="text-blue-600 hover:underline">
            ← Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link href="/catalog" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Catalog
        </Link>

        {/* Main Card Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-8">
            {/* Card Image */}
            <div>
              <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                {card.image_url ? (
                  <Image
                    src={card.image_url}
                    alt={`${card.player_name} - ${card.card_number}`}
                    width={300}
                    height={450}
                    className="object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <p className="text-2xl mb-2">🃏</p>
                    <p>No Image Available</p>
                  </div>
                )}
              </div>

              {/* Card Badges */}
              <div className="mt-4 flex gap-2 flex-wrap">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {card.card_type}
                </span>
                {card.is_parallel && (
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {card.parallel_type || "Parallel"}
                  </span>
                )}
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {card.sport}
                </span>
              </div>
            </div>

            {/* Card Details */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{card.player_name}</h1>
              <p className="text-xl text-gray-600 mb-6">{card.set_name}</p>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Card Number</p>
                  <p className="text-lg font-bold text-gray-900">#{card.card_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Year</p>
                  <p className="text-lg font-bold text-gray-900">{card.year || "—"}</p>
                </div>
                {card.team && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Team</p>
                    <p className="text-lg font-bold text-gray-900">{card.team}</p>
                  </div>
                )}
                {card.position && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Position</p>
                    <p className="text-lg font-bold text-gray-900">{card.position}</p>
                  </div>
                )}
                {card.manufacturer && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Manufacturer</p>
                    <p className="text-lg font-bold text-gray-900">{card.manufacturer}</p>
                  </div>
                )}
                {card.print_run && (
                  <div>
                    <p className="text-sm text-gray-600 font-medium">Print Run</p>
                    <p className="text-lg font-bold text-gray-900">{card.print_run.toLocaleString()}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              {card.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                  <p className="text-gray-600">{card.description}</p>
                </div>
              )}

              {/* Unique Key */}
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Unique Identifier</p>
                <p className="font-mono text-sm text-gray-900 break-all">{card.unique_key}</p>
              </div>
            </div>
          </div>

          {/* Price History Section */}
          {priceHistory.length > 0 && (
            <div className="border-t p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Price History</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Date</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Raw</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">PSA 8</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">PSA 9</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">PSA 10</th>
                      <th className="px-4 py-2 text-left font-semibold text-gray-900">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2">
                          {new Date(entry.recorded_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          {entry.raw_value ? `$${entry.raw_value.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {entry.psa_8_value ? `$${entry.psa_8_value.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {entry.psa_9_value ? `$${entry.psa_9_value.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-2">
                          {entry.psa_10_value ? `$${entry.psa_10_value.toFixed(2)}` : "—"}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{entry.source || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Similar Cards Link */}
        <div className="mt-8 text-center">
          <Link
            href={`/catalog?q=${encodeURIComponent(card.player_name)}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            View all {card.player_name} cards
          </Link>
        </div>
      </div>
    </div>
  );
}
