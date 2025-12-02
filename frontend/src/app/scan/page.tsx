"use client";

import { useState } from "react";
import CardUpload from "@/components/scan/CardUpload";
import ScanResultCard from "@/components/scan/ScanResultCard";
import MarketSection from "@/components/scan/MarketSection";
import { ScanResult } from "@/lib/types";
import { saveCardToVault } from "@/lib/api";

export default function ScanPage() {
  const [result, setResult] = useState<(ScanResult & { image_url?: string }) | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleScanned = (data: ScanResult & { image_url?: string }) => {
    setResult(data);
    setSaveMessage(null);
  };

  const handleSave = async () => {
    if (!result) return;
    try {
      setIsSaving(true);
      setSaveMessage(null);
      await saveCardToVault(result);
      setSaveMessage("Saved to your vault.");
    } catch (err) {
      console.error(err);
      setSaveMessage("Could not save card. Make sure you are logged in.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Scan a card</h1>
        <p className="text-sm text-slate-300 max-w-xl">
          Upload a clear photo of the front of the card or slab. SlabStak will handle the rest.
        </p>
      </div>

      <CardUpload onScanned={handleScanned} />

      {result && (
        <div className="space-y-4">
          <ScanResultCard result={result} />
          <MarketSection result={result} />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-full bg-emerald-500 text-slate-950 text-sm font-semibold hover:bg-emerald-400 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save to vault"}
          </button>
          {saveMessage && (
            <p className="text-xs text-slate-400">{saveMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
