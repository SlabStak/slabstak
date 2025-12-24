"use client";

import { useState, useRef } from "react";

interface CSVImporterProps {
  onSuccess: (message: string) => void;
}

interface CSVRow {
  player_name: string;
  set_name: string;
  card_number: string;
  year?: number;
  sport?: string;
  manufacturer?: string;
  team?: string;
  position?: string;
  card_type?: string;
  print_run?: number;
  is_parallel?: boolean;
  parallel_type?: string;
  description?: string;
  image_url?: string;
}

export default function CSVImporter({ onSuccess }: CSVImporterProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (csv: string): CSVRow[] => {
    const lines = csv.split("\n").filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: CSVRow = {
        player_name: "",
        set_name: "",
        card_number: "",
      };

      headers.forEach((header, index) => {
        const value = values[index];
        if (header === "year" || header === "print_run") {
          (row as any)[header] = value ? parseInt(value) : undefined;
        } else if (header === "is_parallel") {
          (row as any)[header] = value?.toLowerCase() === "true";
        } else {
          (row as any)[header] = value || undefined;
        }
      });

      if (row.player_name && row.set_name && row.card_number) {
        rows.push(row);
      }
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        const rows = parseCSV(csv);

        if (rows.length === 0) {
          setError("No valid rows found in CSV. Ensure it has headers and at least player_name, set_name, and card_number.");
          return;
        }

        setPreview(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse CSV");
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (preview.length === 0) {
      setError("No cards to import");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cardsToImport = preview.map((card) => ({
        ...card,
        year: card.year || new Date().getFullYear(),
        sport: card.sport || "basketball",
        manufacturer: card.manufacturer || "Topps",
        card_type: card.card_type || "base",
        is_parallel: card.is_parallel || false,
        unique_key: `${card.manufacturer || "Topps"}-${card.year || new Date().getFullYear()}-${card.player_name}-${card.card_number}`.replace(
          /\s+/g,
          "-"
        ),
      }));

      const response = await fetch("/api/admin/catalog/cards/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cards: cardsToImport }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || `Failed to import cards (${response.status})`);
      }

      onSuccess(`Successfully imported ${cardsToImport.length} cards!`);
      setPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">CSV Format</h3>
        <p className="text-sm text-blue-800 mb-2">
          Your CSV must include these columns: <code className="bg-blue-100 px-2 py-1 rounded">player_name</code>,{" "}
          <code className="bg-blue-100 px-2 py-1 rounded">set_name</code>,{" "}
          <code className="bg-blue-100 px-2 py-1 rounded">card_number</code>
        </p>
        <p className="text-sm text-blue-800">
          Optional columns: year, sport, manufacturer, team, position, card_type, print_run, is_parallel, parallel_type, description, image_url
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload CSV File
        </label>
        <div className="flex items-center justify-center w-full">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <svg
                className="w-8 h-8 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <p className="text-sm text-gray-500">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">CSV files up to 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-900 mb-3">
            Preview ({preview.length} cards)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">
                    Player
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">
                    Set
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">
                    Card #
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">
                    Year
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">
                    Sport
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-900">
                    Mfg
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 10).map((card, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2">{card.player_name}</td>
                    <td className="px-4 py-2">{card.set_name}</td>
                    <td className="px-4 py-2">{card.card_number}</td>
                    <td className="px-4 py-2">{card.year || "—"}</td>
                    <td className="px-4 py-2">{card.sport || "—"}</td>
                    <td className="px-4 py-2">{card.manufacturer || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.length > 10 && (
            <p className="text-sm text-gray-500 mt-2">
              ... and {preview.length - 10} more cards
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        {preview.length > 0 && (
          <>
            <button
              onClick={() => {
                setPreview([]);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Importing..." : `Import ${preview.length} Cards`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
