"use client";

import { useState, useEffect } from "react";

interface ModelConfig {
  card_identification: {
    base_model: string;
    finetuned_model: string | null;
    using_finetuned: boolean;
    active_model: string;
  };
  listing_generation: {
    base_model: string;
    finetuned_model: string | null;
    using_finetuned: boolean;
    active_model: string;
  };
}

export default function ModelConfig() {
  const [config, setConfig] = useState<ModelConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [cardIdModel, setCardIdModel] = useState("");
  const [cardIdEnabled, setCardIdEnabled] = useState(false);
  const [listingModel, setListingModel] = useState("");
  const [listingEnabled, setListingEnabled] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/admin/ml/models/config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);

        // Set form values
        setCardIdModel(data.card_identification.finetuned_model || "");
        setCardIdEnabled(data.card_identification.using_finetuned);
        setListingModel(data.listing_generation.finetuned_model || "");
        setListingEnabled(data.listing_generation.using_finetuned);
      }
    } catch (error) {
      console.error("Failed to fetch config:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/ml/models/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          card_identification: {
            model_id: cardIdModel || null,
            enabled: cardIdEnabled
          },
          listing_generation: {
            model_id: listingModel || null,
            enabled: listingEnabled
          }
        })
      });

      if (response.ok) {
        alert("Model configuration saved!\nRestart the backend to apply changes.");
        fetchConfig();
      } else {
        const error = await response.json();
        alert(`Save failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading configuration...</div>;
  }

  if (!config) {
    return <div className="text-center py-12">No configuration available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Current Active Models */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Currently Active Models
        </h3>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Card Identification</h4>
              {config.card_identification.using_finetuned ? (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Using Fine-Tuned
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                  Using Base Model
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 font-mono break-all">
              {config.card_identification.active_model}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">Listing Generation</h4>
              {config.listing_generation.using_finetuned ? (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Using Fine-Tuned
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                  Using Base Model
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 font-mono break-all">
              {config.listing_generation.active_model}
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Update Model Configuration
        </h3>

        <div className="space-y-6">
          {/* Card Identification Config */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Card Identification Model</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fine-Tuned Model ID
                </label>
                <input
                  type="text"
                  value={cardIdModel}
                  onChange={(e) => setCardIdModel(e.target.value)}
                  placeholder="ft:gpt-4o-mini-2024-07-18:org:card-id:xxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Copy from a successful fine-tuning job
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="card-id-enabled"
                  checked={cardIdEnabled}
                  onChange={(e) => setCardIdEnabled(e.target.checked)}
                  disabled={!cardIdModel}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="card-id-enabled"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Enable fine-tuned model for card identification
                </label>
              </div>

              {!cardIdModel && cardIdEnabled && (
                <p className="text-sm text-orange-600">
                  ⚠️ Cannot enable without a model ID
                </p>
              )}
            </div>
          </div>

          {/* Listing Generation Config */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">Listing Generation Model</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fine-Tuned Model ID
                </label>
                <input
                  type="text"
                  value={listingModel}
                  onChange={(e) => setListingModel(e.target.value)}
                  placeholder="ft:gpt-4o-mini-2024-07-18:org:listing:xxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Copy from a successful fine-tuning job
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="listing-enabled"
                  checked={listingEnabled}
                  onChange={(e) => setListingEnabled(e.target.checked)}
                  disabled={!listingModel}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="listing-enabled"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Enable fine-tuned model for listing generation
                </label>
              </div>

              {!listingModel && listingEnabled && (
                <p className="text-sm text-orange-600">
                  ⚠️ Cannot enable without a model ID
                </p>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isSaving ? "Saving..." : "Save Configuration"}
            </button>
            <button
              onClick={fetchConfig}
              className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Deployment Instructions */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-orange-900 mb-2">
          ⚠️ Important: Deployment Steps
        </h4>
        <ol className="text-sm text-orange-800 space-y-2 list-decimal list-inside">
          <li>Save the configuration above</li>
          <li>The configuration will be written to <code className="bg-orange-100 px-1 py-0.5 rounded">backend/.env</code></li>
          <li>Restart the backend service to apply changes</li>
          <li>Test the models in production with A/B testing (gradual rollout recommended)</li>
          <li>Monitor the Production Metrics tab for performance</li>
        </ol>
      </div>

      {/* Rollback Instructions */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          🔄 Rollback Instructions
        </h4>
        <p className="text-sm text-blue-800 mb-2">
          If a fine-tuned model performs worse than expected:
        </p>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Uncheck the "Enable fine-tuned model" checkbox</li>
          <li>Save configuration</li>
          <li>Restart backend - it will automatically fall back to base model</li>
          <li>Review training data and retrain with better samples</li>
        </ol>
      </div>
    </div>
  );
}
