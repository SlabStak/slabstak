"use client";

import { useState, useEffect } from "react";
import CardSearchBar from "@/components/catalog/CardSearchBar";
import CardFilters from "@/components/catalog/CardFilters";
import CardGrid from "@/components/catalog/CardGrid";
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
}

interface SearchFilters {
  q: string;
  sport: string;
  year: string;
  manufacturer: string;
}

export default function CatalogPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState<SearchFilters>({
    q: "",
    sport: "",
    year: "",
    manufacturer: "",
  });

  const LIMIT = 50;

  useEffect(() => {
    searchCards();
  }, [filters]);

  const searchCards = async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.q) params.append("q", filters.q);
      if (filters.sport) params.append("sport", filters.sport);
      if (filters.year) params.append("year", filters.year);
      if (filters.manufacturer) params.append("manufacturer", filters.manufacturer);
      params.append("limit", LIMIT.toString());
      params.append("offset", (page * LIMIT).toString());

      const response = await fetch(`/api/catalog/search?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to search cards");

      const data = await response.json();
      setCards(data.cards);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    setPage(0);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Card Catalog</h1>
          <p className="mt-2 text-gray-600">
            Browse and search our master database of {total.toLocaleString()} sports cards
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6 flex gap-4">
          <Link
            href="/catalog"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            🔍 Search
          </Link>
          <Link
            href="/catalog/sets"
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            📊 Browse Sets
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <CardSearchBar onSearch={(q) => handleFilterChange({ ...filters, q })} />
          <div className="mt-4">
            <CardFilters filters={filters} onFiltersChange={handleFilterChange} />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          {loading ? (
            "Loading..."
          ) : (
            <>
              Found <strong>{total.toLocaleString()}</strong> card{total !== 1 ? "s" : ""}
              {total > LIMIT && ` (showing page ${page + 1} of ${totalPages})`}
            </>
          )}
        </div>

        {/* Cards Grid */}
        <CardGrid cards={cards} loading={loading} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0 || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              ← Previous
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pageNum = i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                    className={`px-3 py-2 rounded-lg font-medium ${
                      page === pageNum
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              {totalPages > 5 && <span className="px-2">...</span>}
            </div>

            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
