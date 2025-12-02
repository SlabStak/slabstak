"use client";

import { useState } from "react";
import { ScanResult } from "@/lib/types";
import { uploadCardImage } from "@/lib/storage";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Spinner from "@/components/ui/Spinner";

interface Props {
  onScanned: (data: ScanResult & { image_url?: string }) => void;
}

const supabase = createClientComponentClient();

export default function CardUpload({ onScanned }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleScan = async () => {
    if (!file) {
      setError("Choose an image first.");
      return;
    }

    try {
      setIsScanning(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("You must be logged in to scan cards");
      }

      // Upload image to Supabase Storage
      let imageUrl: string | undefined;
      try {
        const uploadResult = await uploadCardImage(file, user.id);
        imageUrl = uploadResult.url;
      } catch (uploadErr) {
        console.warn("Image upload failed, continuing without stored image:", uploadErr);
        // Continue with scan even if upload fails
      }

      // Scan the card via backend
      const form = new FormData();
      form.append("file", file);

      const url = process.env.NEXT_PUBLIC_BACKEND_SCAN_URL ?? "/api/scan-proxy";

      const res = await fetch(url, {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Scan failed");

      const data = (await res.json()) as ScanResult;

      // Pass scan result with image URL to parent
      onScanned({ ...data, image_url: imageUrl });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Scan failed. Try another photo or later."
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border border-dashed border-slate-700 rounded-xl p-4 bg-slate-900/60 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 space-y-2 text-sm text-slate-300">
          <p className="font-semibold text-slate-100">Upload card front</p>
          <p className="text-xs text-slate-400">
            Use a clear photo with good lighting. Front of slab or raw card is ideal.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="text-xs text-slate-300 mt-2"
          />
        </div>
        <button
          onClick={handleScan}
          disabled={isScanning}
          className="px-4 py-2 rounded-full bg-sky-500 text-slate-950 text-sm font-semibold hover:bg-sky-400 disabled:opacity-60 flex items-center gap-2"
        >
          {isScanning && <Spinner size="sm" />}
          {isScanning ? "Scanning..." : "Scan card"}
        </button>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  );
}
