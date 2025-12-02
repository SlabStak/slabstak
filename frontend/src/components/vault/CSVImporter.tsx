"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CSVRow {
  [key: string]: string;
}

interface ColumnMapping {
  csvColumn: string;
  slabstakField: string;
}

const SLABSTAK_FIELDS = [
  { value: "player", label: "Player Name" },
  { value: "set_name", label: "Set Name" },
  { value: "year", label: "Year" },
  { value: "grade_estimate", label: "Grade" },
  { value: "team", label: "Team" },
  { value: "sport", label: "Sport" },
  { value: "purchase_price", label: "Purchase Price" },
  { value: "notes", label: "Notes" },
  { value: "_skip", label: "(Skip this column)" },
];

export default function CSVImporter() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCSVData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCSVHeaders] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [step, setStep] = useState<"upload" | "map" | "preview" | "importing">("upload");
  const [importProgress, setImportProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    setFile(uploadedFile);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(uploadedFile);
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length === 0) {
      setError("CSV file is empty");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    setCSVHeaders(headers);

    const rows: CSVRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      rows.push(row);
    }

    setCSVData(rows);

    // Auto-map obvious columns
    const mappings: ColumnMapping[] = headers.map((header) => {
      const lowerHeader = header.toLowerCase();
      let slabstakField = "_skip";

      if (lowerHeader.includes("player") || lowerHeader.includes("name")) {
        slabstakField = "player";
      } else if (lowerHeader.includes("set")) {
        slabstakField = "set_name";
      } else if (lowerHeader.includes("year")) {
        slabstakField = "year";
      } else if (lowerHeader.includes("grade")) {
        slabstakField = "grade_estimate";
      } else if (lowerHeader.includes("team")) {
        slabstakField = "team";
      } else if (lowerHeader.includes("sport")) {
        slabstakField = "sport";
      } else if (lowerHeader.includes("price") || lowerHeader.includes("cost")) {
        slabstakField = "purchase_price";
      } else if (lowerHeader.includes("note")) {
        slabstakField = "notes";
      }

      return { csvColumn: header, slabstakField };
    });

    setColumnMappings(mappings);
    setStep("map");
  };

  const updateMapping = (csvColumn: string, slabstakField: string) => {
    setColumnMappings((prev) =>
      prev.map((m) => (m.csvColumn === csvColumn ? { ...m, slabstakField } : m))
    );
  };

  const handleImport = async () => {
    setStep("importing");
    setImportProgress(0);

    try {
      // Transform CSV data to SlabStak format
      const cards = csvData.map((row) => {
        const card: any = {};

        columnMappings.forEach((mapping) => {
          if (mapping.slabstakField !== "_skip") {
            let value = row[mapping.csvColumn];

            // Parse year as number
            if (mapping.slabstakField === "year" && value) {
              card[mapping.slabstakField] = parseInt(value, 10) || null;
            }
            // Parse purchase_price as number
            else if (mapping.slabstakField === "purchase_price" && value) {
              card[mapping.slabstakField] = parseFloat(value.replace(/[^0-9.]/g, "")) || null;
            } else {
              card[mapping.slabstakField] = value || null;
            }
          }
        });

        // Set defaults
        card.estimated_low = 0;
        card.estimated_high = 0;
        card.recommendation = "hold";

        return card;
      });

      // Import cards in batches
      const batchSize = 10;
      for (let i = 0; i < cards.length; i += batchSize) {
        const batch = cards.slice(i, i + batchSize);

        await Promise.all(
          batch.map((card) =>
            fetch("/api/cards", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(card),
            })
          )
        );

        setImportProgress(Math.min(100, Math.round(((i + batchSize) / cards.length) * 100)));
      }

      // Success - redirect to vault
      router.push("/vault");
    } catch (err) {
      console.error(err);
      setError("Failed to import cards. Please try again.");
      setStep("preview");
    }
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        {["upload", "map", "preview"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                step === s || (i === 2 && step === "importing")
                  ? "bg-sky-400 text-slate-950"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-sm ${step === s ? "text-slate-100" : "text-slate-500"}`}>
              {s === "upload" ? "Upload" : s === "map" ? "Map Columns" : "Preview"}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="p-8 rounded-xl border-2 border-dashed border-slate-700 hover:border-slate-600 transition-colors text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer flex flex-col items-center gap-4"
          >
            <div className="text-4xl">📄</div>
            <div>
              <div className="text-lg font-medium text-slate-100">Upload CSV File</div>
              <div className="text-sm text-slate-400 mt-1">
                Click to browse or drag and drop
              </div>
            </div>
          </label>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === "map" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm">
            Map your CSV columns to SlabStak fields. Required fields are Player Name and Set Name.
          </div>

          <div className="space-y-3">
            {columnMappings.map((mapping) => (
              <div
                key={mapping.csvColumn}
                className="flex items-center gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-800"
              >
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-300">{mapping.csvColumn}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Sample: {csvData[0]?.[mapping.csvColumn] || "N/A"}
                  </div>
                </div>
                <div className="text-slate-500">→</div>
                <div className="flex-1">
                  <select
                    value={mapping.slabstakField}
                    onChange={(e) => updateMapping(mapping.csvColumn, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:border-sky-400 focus:outline-none"
                  >
                    {SLABSTAK_FIELDS.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("upload")}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
            >
              Back
            </button>
            <button
              onClick={() => setStep("preview")}
              className="px-4 py-2 rounded-lg bg-sky-500 text-slate-950 text-sm font-semibold hover:bg-sky-400"
            >
              Continue to Preview
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            Ready to import {csvData.length} card{csvData.length !== 1 ? "s" : ""}. Review the
            preview below.
          </div>

          <div className="max-h-96 overflow-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                    Player
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                    Set
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                    Year
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {csvData.slice(0, 10).map((row, i) => {
                  const playerMapping = columnMappings.find((m) => m.slabstakField === "player");
                  const setMapping = columnMappings.find((m) => m.slabstakField === "set_name");
                  const yearMapping = columnMappings.find((m) => m.slabstakField === "year");
                  const gradeMapping = columnMappings.find(
                    (m) => m.slabstakField === "grade_estimate"
                  );

                  return (
                    <tr key={i} className="hover:bg-slate-900/30">
                      <td className="px-4 py-2 text-slate-300">
                        {playerMapping ? row[playerMapping.csvColumn] : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-400">
                        {setMapping ? row[setMapping.csvColumn] : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-400">
                        {yearMapping ? row[yearMapping.csvColumn] : "—"}
                      </td>
                      <td className="px-4 py-2 text-slate-400">
                        {gradeMapping ? row[gradeMapping.csvColumn] : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {csvData.length > 10 && (
            <div className="text-xs text-slate-500 text-center">
              Showing first 10 of {csvData.length} cards
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("map")}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700"
            >
              Back
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 text-sm font-semibold hover:bg-emerald-400"
            >
              Import {csvData.length} Cards
            </button>
          </div>
        </div>
      )}

      {/* Importing */}
      {step === "importing" && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚡</div>
          <div className="text-lg font-semibold text-slate-100 mb-2">Importing Cards...</div>
          <div className="text-sm text-slate-400 mb-4">{importProgress}% complete</div>
          <div className="max-w-md mx-auto h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${importProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
