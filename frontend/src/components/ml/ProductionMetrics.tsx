"use client";

import { useState, useEffect } from "react";

interface Metrics {
  month: string;
  model_id: string;
  total_predictions: number;
  corrections: number;
  correction_rate: number;
  accuracy_rate: number;
  average_user_rating: number | null;
  total_ratings: number;
  field_corrections: Record<string, number>;
}

export default function ProductionMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedModel, setSelectedModel] = useState("all");

  useEffect(() => {
    // Set current month as default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(currentMonth);
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchMetrics();
    }
  }, [selectedMonth, selectedModel]);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        month: selectedMonth,
        ...(selectedModel !== "all" && { model_id: selectedModel })
      });

      const response = await fetch(`/api/admin/ml/metrics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        setMetrics(null);
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccuracyColor = (rate: number) => {
    if (rate >= 0.90) return "text-green-600";
    if (rate >= 0.75) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingColor = (rating: number | null) => {
    if (rating === null) return "text-gray-400";
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-yellow-600";
    return "text-orange-600";
  };

  const generateMonthOptions = () => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("en-US", { year: "numeric", month: "long" });
      options.push({ value, label });
    }
    return options;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Filter Metrics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {generateMonthOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Models</option>
              <option value="base">Base Model Only</option>
              <option value="finetuned">Fine-Tuned Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Metrics Display */}
      {isLoading ? (
        <div className="text-center py-12">Loading metrics...</div>
      ) : !metrics ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">
            No data available for selected period.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Metrics are collected automatically as users interact with the AI features.
          </p>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Total Predictions</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {metrics.total_predictions.toLocaleString()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Accuracy Rate</div>
              <div className={`mt-2 text-3xl font-bold ${getAccuracyColor(metrics.accuracy_rate)}`}>
                {(metrics.accuracy_rate * 100).toFixed(1)}%
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {metrics.corrections} corrections
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Avg User Rating</div>
              <div className={`mt-2 text-3xl font-bold ${getRatingColor(metrics.average_user_rating)}`}>
                {metrics.average_user_rating?.toFixed(1) || "N/A"}
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {metrics.total_ratings} ratings
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Correction Rate</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {(metrics.correction_rate * 100).toFixed(1)}%
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {metrics.correction_rate <= 0.10 ? "✓ Excellent" :
                 metrics.correction_rate <= 0.20 ? "⚠️ Good" : "❌ Needs improvement"}
              </div>
            </div>
          </div>

          {/* Field-Level Corrections */}
          {Object.keys(metrics.field_corrections).length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Field-Level Correction Analysis
              </h3>

              <div className="space-y-3">
                {Object.entries(metrics.field_corrections)
                  .sort(([, a], [, b]) => b - a)
                  .map(([field, count]) => {
                    const percentage = (count / metrics.total_predictions) * 100;
                    return (
                      <div key={field}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 capitalize">
                            {field.replace(/_/g, " ")}
                          </span>
                          <span className="text-sm text-gray-600">
                            {count} corrections ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Fields with high correction rates should be prioritized
                  in training data collection. Consider adding more examples for these specific
                  fields to improve model accuracy.
                </p>
              </div>
            </div>
          )}

          {/* Performance Insights */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Insights
            </h3>

            <div className="space-y-4">
              {metrics.accuracy_rate >= 0.90 ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-green-900 mb-1">
                    ✅ Excellent Performance
                  </h4>
                  <p className="text-sm text-green-800">
                    Model is performing well with {(metrics.accuracy_rate * 100).toFixed(1)}% accuracy.
                    Continue collecting training data to maintain this performance.
                  </p>
                </div>
              ) : metrics.accuracy_rate >= 0.75 ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-yellow-900 mb-1">
                    ⚠️ Moderate Performance
                  </h4>
                  <p className="text-sm text-yellow-800">
                    Model accuracy is {(metrics.accuracy_rate * 100).toFixed(1)}%.
                    Consider collecting more training data or retraining the model.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">
                    ❌ Poor Performance
                  </h4>
                  <p className="text-sm text-red-800">
                    Model accuracy is only {(metrics.accuracy_rate * 100).toFixed(1)}%.
                    Review training data quality and consider retraining with better examples.
                  </p>
                </div>
              )}

              {metrics.average_user_rating && metrics.average_user_rating < 4.0 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="text-sm font-semibold text-orange-900 mb-1">
                    👎 Low User Satisfaction
                  </h4>
                  <p className="text-sm text-orange-800">
                    Average user rating is {metrics.average_user_rating.toFixed(1)}/5.0.
                    This may indicate quality issues beyond accuracy metrics.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              📊 Next Steps
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {metrics.correction_rate > 0.15 && (
                <li>• High correction rate - collect more training data and retrain</li>
              )}
              {metrics.total_ratings < 100 && (
                <li>• Add user rating prompts to collect more feedback</li>
              )}
              {Object.keys(metrics.field_corrections).length > 0 && (
                <li>
                  • Focus training data on: {Object.entries(metrics.field_corrections)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 3)
                    .map(([field]) => field)
                    .join(", ")}
                </li>
              )}
              <li>• Monitor metrics weekly to track improvement trends</li>
              <li>• Compare base model vs fine-tuned model performance</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
