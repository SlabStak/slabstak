"use client";

import { useState, useEffect } from "react";
import TrainingDataStats from "@/components/ml/TrainingDataStats";
import FineTuningJobs from "@/components/ml/FineTuningJobs";
import ModelConfig from "@/components/ml/ModelConfig";
import ProductionMetrics from "@/components/ml/ProductionMetrics";

export default function MLAdminPage() {
  const [activeTab, setActiveTab] = useState<"data" | "jobs" | "models" | "metrics">("data");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is admin
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/admin/ml/check-access");
      if (!response.ok) {
        window.location.href = "/";
        return;
      }
      setIsLoading(false);
    } catch (error) {
      console.error("Access check failed:", error);
      window.location.href = "/";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "data" as const, label: "Training Data", icon: "📊" },
    { id: "jobs" as const, label: "Fine-Tuning Jobs", icon: "🔧" },
    { id: "models" as const, label: "Models", icon: "🤖" },
    { id: "metrics" as const, label: "Production Metrics", icon: "📈" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ML Administration
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage fine-tuning, training data, and model performance
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/admin"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Back to Admin
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "data" && <TrainingDataStats />}
        {activeTab === "jobs" && <FineTuningJobs />}
        {activeTab === "models" && <ModelConfig />}
        {activeTab === "metrics" && <ProductionMetrics />}
      </div>
    </div>
  );
}
