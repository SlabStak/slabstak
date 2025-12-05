"use client";

import { useState, useEffect } from "react";

interface DatasetStats {
  card_identification: number;
  listing_generation: number;
  user_corrections: number;
  total_samples: number;
  last_updated: string | null;
}

export default function TrainingDataStats() {
  const [stats, setStats] = useState<DatasetStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<"card_identification" | "listing_generation">(
    "card_identification"
  );
  const [minConfidence, setMinConfidence] = useState(0.8);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/ml/training-data/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/admin/ml/training-data/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model_type: exportType,
          min_confidence: minConfidence
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Exported ${data.sample_count} samples to: ${data.file_path}`);
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Export failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading stats...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12">No data available</div>;
  }

  const readyForTraining = stats.card_identification >= 50 || stats.listing_generation >= 30;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Card ID Samples</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats.card_identification}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {stats.card_identification >= 50 ? (
              <span className="text-green-600">✓ Ready for training</span>
            ) : (
              <span className="text-orange-600">
                Need {50 - stats.card_identification} more
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Listing Samples</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats.listing_generation}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {stats.listing_generation >= 30 ? (
              <span className="text-green-600">✓ Ready for training</span>
            ) : (
              <span className="text-orange-600">
                Need {30 - stats.listing_generation} more
              </span>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">User Corrections</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats.user_corrections}
          </div>
          <div className="mt-2 text-sm text-gray-600">Collected automatically</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Samples</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {stats.total_samples}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {stats.last_updated ? (
              <>Updated {new Date(stats.last_updated).toLocaleDateString()}</>
            ) : (
              "Never updated"
            )}
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Export Training Data
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model Type
            </label>
            <select
              value={exportType}
              onChange={(e) => setExportType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="card_identification">Card Identification</option>
              <option value="listing_generation">Listing Generation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Confidence
            </label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleExport}
              disabled={isExporting || !readyForTraining}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isExporting ? "Exporting..." : "Export for Fine-Tuning"}
            </button>
          </div>
        </div>

        {!readyForTraining && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <p className="text-sm text-orange-800">
              <strong>Not Ready:</strong> You need at least 50 card identification samples
              or 30 listing samples before exporting for fine-tuning.
            </p>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-600">
          <p>
            <strong>Note:</strong> Exported files will be in OpenAI JSONL format,
            ready to upload for fine-tuning. Only samples with confidence ≥{" "}
            {minConfidence} will be included.
          </p>
        </div>
      </div>

      {/* Data Quality Tips */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          📚 Improving Data Quality
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            • Encourage users to correct AI results when they're wrong
          </li>
          <li>
            • Add "thumbs up" confirmation for correct scans to collect positive samples
          </li>
          <li>
            • Include diverse examples: different sports, years, brands, conditions
          </li>
          <li>
            • Manually review and add edge cases (misprints, variations, oddball sets)
          </li>
          <li>
            • Quality over quantity: 100 perfect samples &gt; 500 mediocre ones
          </li>
        </ul>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={fetchStats}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          🔄 Refresh Stats
        </button>
      </div>
    </div>
  );
}
