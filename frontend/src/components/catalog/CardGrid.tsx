"use client";

import Link from "next/link";
import Image from "next/image";

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

interface CardGridProps {
  cards: Card[];
  loading: boolean;
}

export default function CardGrid({ cards, loading }: CardGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-80 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">No cards found. Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {cards.map((card) => (
        <Link key={card.id} href={`/catalog/card/${card.id}`}>
          <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer h-full">
            {/* Card Image */}
            <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
              {card.image_url ? (
                <Image
                  src={card.image_url}
                  alt={`${card.player_name} - ${card.card_number}`}
                  width={200}
                  height={300}
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              ) : (
                <div className="text-gray-400 text-sm text-center px-4">
                  <p>No Image</p>
                  <p className="text-xs mt-1">{card.card_type}</p>
                </div>
              )}

              {/* Parallel Badge */}
              {card.is_parallel && (
                <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs font-semibold">
                  {card.parallel_type || "Parallel"}
                </div>
              )}

              {/* Card Type Badge */}
              <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                {card.card_type}
              </div>
            </div>

            {/* Card Info */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
                {card.player_name}
              </h3>

              <p className="text-gray-600 text-xs mb-2 line-clamp-2">{card.set_name}</p>

              <div className="flex gap-2 mb-3 text-xs text-gray-500">
                <span>#{card.card_number}</span>
                {card.year && <span>•</span>}
                {card.year && <span>{card.year}</span>}
              </div>

              {/* Details Row */}
              <div className="space-y-1 text-xs">
                {card.team && (
                  <p className="text-gray-600">
                    <span className="font-medium">Team:</span> {card.team}
                  </p>
                )}
                {card.position && (
                  <p className="text-gray-600">
                    <span className="font-medium">Position:</span> {card.position}
                  </p>
                )}
                {card.manufacturer && (
                  <p className="text-gray-600">
                    <span className="font-medium">Mfg:</span> {card.manufacturer}
                  </p>
                )}
                <p className="text-gray-600">
                  <span className="font-medium">Sport:</span>{" "}
                  {card.sport.charAt(0).toUpperCase() + card.sport.slice(1)}
                </p>
              </div>

              {/* CTA Button */}
              <button className="mt-4 w-full py-2 bg-blue-50 text-blue-600 rounded font-medium text-sm hover:bg-blue-100 transition-colors">
                View Details
              </button>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
