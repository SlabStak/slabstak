"use client";

import { useState } from "react";
import CardEntryForm from "./CardEntryForm";
import CSVImporter from "./CSVImporter";

export default function CardCatalogManager() {
  const [activeTab, setActiveTab] = useState<"manual" | "csv">("manual");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const handleSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab("manual")}
            className={`flex-1 py-4 px-4 text-center font-medium transition-colors ${
              activeTab === "manual"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📝 Manual Entry
          </button>
          <button
            onClick={() => setActiveTab("csv")}
            className={`flex-1 py-4 px-4 text-center font-medium transition-colors ${
              activeTab === "csv"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📊 CSV Import
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="m-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "manual" && <CardEntryForm onSuccess={handleSuccess} />}
        {activeTab === "csv" && <CSVImporter onSuccess={handleSuccess} />}
      </div>
    </div>
  );
}
