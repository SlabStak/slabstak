"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Set {
  set_name: string;
  year: number;
  sport: string;
  manufacturer: string;
  card_count: number;
}

export default function SetsPage() {
  const [sets, setSets] = useState<Set[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ sport: "", manufacturer: "" });

  useEffect(() => {
    fetchSets();
  }, [filters]);

  const fetchSets = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.sport) params.append("sport", filters.sport);
      if (filters.manufacturer) params.append("manufacturer", filters.manufacturer);

      const response = await fetch(`/api/catalog/sets?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch sets");

      const data = await response.json();
      setSets(data.sets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sets");
    } finally {
      setLoading(false);
    }
  };

  const SPORTS = ["basketball", "baseball", "football", "hockey", "soccer"];
  const MANUFACTURERS = ["Topps", "Panini", "Leaf", "Fleer", "Upper Deck", "Bowman", "Donruss"];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/catalog" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to Catalog
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Card Sets</h1>
          <p className="mt-2 text-gray-600">Browse card sets by year, sport, and manufacturer</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
              <select
                value={filters.sport}
                onChange={(e) => setFilters({ ...filters, sport: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sports</option>
                {SPORTS.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturer
              </label>
              <select
                value={filters.manufacturer}
                onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Manufacturers</option>
                {MANUFACTURERS.map((mfg) => (
                  <option key={mfg} value={mfg}>
                    {mfg}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ sport: "", manufacturer: "" })}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Sets Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No sets found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sets.map((set) => (
              <Link
                key={`${set.set_name}-${set.year}`}
                href={`/catalog/sets/${encodeURIComponent(set.set_name)}`}
              >
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer h-full">
                  <div className="mb-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{set.set_name}</h3>
                    <p className="text-sm text-gray-600">{set.year}</p>
                  </div>

                  <div className="space-y-2 mb-4 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Sport:</span>{" "}
                      {set.sport.charAt(0).toUpperCase() + set.sport.slice(1)}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Manufacturer:</span> {set.manufacturer}
                    </p>
                    <p className="text-gray-900 font-semibold">
                      <span className="font-medium">Cards:</span> {set.card_count}
                    </p>
                  </div>

                  <button className="w-full mt-4 py-2 bg-blue-50 text-blue-600 rounded font-medium text-sm hover:bg-blue-100 transition-colors">
                    Browse Set
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
