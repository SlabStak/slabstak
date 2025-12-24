"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Match {
  catalog_card_id: string;
  player_name: string;
  set_name: string;
  card_number: string;
  year?: number;
  sport: string;
  manufacturer?: string;
  team?: string;
  image_url?: string;
  confidence: number;
}

interface CardMatchSuggestionsProps {
  userCardId: string;
  userCardData: {
    player?: string;
    set_name?: string;
    year?: number;
  };
  onMatchSelected?: (match: Match) => void;
}

export default function CardMatchSuggestions({
  userCardId,
  userCardData,
  onMatchSelected,
}: CardMatchSuggestionsProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [bestMatch, setBestMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, [userCardId]);

  const fetchMatches = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/cards/${userCardId}/match`);
      if (!response.ok) throw new Error("Failed to find matches");

      const data = await response.json();
      setMatches(data.matches);
      setBestMatch(data.best_match);

      // Auto-select best match if confidence is high
      if (data.best_match && data.best_match.confidence >= 0.85) {
        setSelectedMatch(data.best_match.catalog_card_id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load matches");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMatch = async (catalogCardId: string) => {
    const match = matches.find((m) => m.catalog_card_id === catalogCardId);
    if (!match) return;

    setConfirming(true);

    try {
      const response = await fetch(`/api/cards/${userCardId}/match-confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          catalog_card_id: catalogCardId,
          confidence: match.confidence,
        }),
      });

      if (!response.ok) throw new Error("Failed to confirm match");

      if (onMatchSelected) {
        onMatchSelected(match);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm match");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">{error}</p>
        <button
          onClick={fetchMatches}
          className="mt-2 text-red-600 hover:text-red-800 font-medium text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 font-medium">No matches found</p>
        <p className="text-yellow-700 text-sm mt-1">
          We couldn't find matching cards for:
        </p>
        <p className="text-sm text-yellow-700 mt-2">
          {userCardData.player && <span>{userCardData.player}</span>}
          {userCardData.player && userCardData.set_name && <span> • </span>}
          {userCardData.set_name && <span>{userCardData.set_name}</span>}
        </p>
        <Link
          href="/catalog/search"
          className="mt-3 inline-block text-yellow-600 hover:text-yellow-800 font-medium text-sm"
        >
          Search Catalog Manually →
        </Link>
      </div>
    );
  }

  // Confidence color indicator
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return "bg-green-100 border-green-300 text-green-900";
    if (confidence >= 0.60) return "bg-blue-100 border-blue-300 text-blue-900";
    return "bg-gray-100 border-gray-300 text-gray-900";
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.85) return "High Confidence";
    if (confidence >= 0.60) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {matches.length} Potential Match{matches.length !== 1 ? "es" : ""}
        </h3>
        {bestMatch && (
          <span className="text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
            ⭐ Best Match
          </span>
        )}
      </div>

      <div className="space-y-3">
        {matches.map((match) => (
          <div
            key={match.catalog_card_id}
            className={`p-4 border-2 rounded-lg transition-all ${
              selectedMatch === match.catalog_card_id
                ? "border-blue-500 bg-blue-50"
                : getConfidenceColor(match.confidence)
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="radio"
                    name="match-selection"
                    value={match.catalog_card_id}
                    checked={selectedMatch === match.catalog_card_id}
                    onChange={(e) => setSelectedMatch(e.target.value)}
                    disabled={confirming}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <h4 className="font-semibold text-gray-900">{match.player_name}</h4>
                </div>

                <div className="ml-6 space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Set:</span> {match.set_name}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Card #:</span> {match.card_number}
                    {match.year && <span> • {match.year}</span>}
                  </p>
                  {match.team && (
                    <p className="text-gray-600">
                      <span className="font-medium">Team:</span> {match.team}
                    </p>
                  )}
                  {match.manufacturer && (
                    <p className="text-gray-600">
                      <span className="font-medium">Mfg:</span> {match.manufacturer}
                    </p>
                  )}
                </div>
              </div>

              {/* Confidence Indicator */}
              <div className="ml-4 text-right">
                <div className="text-2xl font-bold text-gray-900">
                  {(match.confidence * 100).toFixed(0)}%
                </div>
                <p className="text-xs text-gray-600">
                  {getConfidenceLabel(match.confidence)}
                </p>
              </div>
            </div>

            {/* Action Button */}
            {selectedMatch === match.catalog_card_id && (
              <button
                onClick={() => handleConfirmMatch(match.catalog_card_id)}
                disabled={confirming}
                className="mt-4 w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {confirming ? "Confirming..." : "Confirm this match"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Manual Search Option */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-600 mb-2">Not seeing the right card?</p>
        <Link
          href={`/catalog${
            userCardData.player ? `?q=${encodeURIComponent(userCardData.player)}` : ""
          }`}
          className="inline-block text-blue-600 hover:text-blue-800 font-medium text-sm"
        >
          Search the full catalog →
        </Link>
      </div>
    </div>
  );
}
