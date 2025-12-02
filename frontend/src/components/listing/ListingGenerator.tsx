"use client";

import { useState } from "react";
import Spinner from "@/components/ui/Spinner";
import { CardRecord } from "@/lib/types";

interface Props {
  card: CardRecord;
}

interface GeneratedListing {
  title: string;
  description: string;
  keywords: string[];
  platform: string;
  character_counts: {
    title: number;
    description: number;
    title_max: number;
  };
}

export default function ListingGenerator({ card }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [listing, setListing] = useState<GeneratedListing | null>(null);
  const [platform, setPlatform] = useState("ebay");
  const [tone, setTone] = useState("professional");
  const [includePrice, setIncludePrice] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      setListing(null);

      const url = process.env.NEXT_PUBLIC_BACKEND_SCAN_URL?.replace("/scan", "/generate-listing") || "/api/generate-listing";

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player: card.player,
          set_name: card.set_name,
          year: card.year,
          grade: card.grade_estimate,
          platform,
          tone,
          include_price: includePrice,
          estimated_value: includePrice ? (card.estimated_low + card.estimated_high) / 2 : null,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate listing");
      }

      const data = await res.json();
      setListing(data);
    } catch (err) {
      console.error(err);
      setError("Failed to generate listing. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-100">Generate Listing</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm"
            >
              <option value="ebay">eBay</option>
              <option value="pwcc">PWCC Marketplace</option>
              <option value="whatnot">WhatNot</option>
              <option value="comc">COMC</option>
            </select>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm"
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="enthusiastic">Enthusiastic</option>
            </select>
          </div>
        </div>

        {/* Include Price */}
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={includePrice}
            onChange={(e) => setIncludePrice(e.target.checked)}
            className="rounded border-slate-700"
          />
          Include estimated value in description
        </label>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full px-4 py-3 rounded-lg bg-sky-500 text-slate-950 font-semibold hover:bg-sky-400 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isGenerating && <Spinner size="sm" />}
          {isGenerating ? "Generating..." : "Generate Listing"}
        </button>

        {error && (
          <p className="text-sm text-rose-400">{error}</p>
        )}
      </div>

      {/* Generated Listing */}
      {listing && (
        <div className="space-y-4">
          {/* Title */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Title</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {listing.character_counts.title}/{listing.character_counts.title_max}
                </span>
                <button
                  onClick={() => copyToClipboard(listing.title, "title")}
                  className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  {copiedField === "title" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-100 bg-slate-800/60 p-3 rounded">
              {listing.title}
            </p>
          </div>

          {/* Description */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Description</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {listing.character_counts.description} chars
                </span>
                <button
                  onClick={() => copyToClipboard(listing.description, "description")}
                  className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  {copiedField === "description" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="text-sm text-slate-100 bg-slate-800/60 p-4 rounded whitespace-pre-wrap max-h-64 overflow-y-auto">
              {listing.description}
            </div>
          </div>

          {/* Keywords */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">Keywords</h3>
              <button
                onClick={() => copyToClipboard(listing.keywords.join(", "), "keywords")}
                className="px-2 py-1 text-xs rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                {copiedField === "keywords" ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {listing.keywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded bg-sky-500/20 text-sky-400"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Platform Badge */}
          <div className="text-center">
            <span className="inline-block px-3 py-1 text-xs rounded-full bg-slate-800 text-slate-400">
              Optimized for {listing.platform.toUpperCase()} • {tone} tone
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
