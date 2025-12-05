"use client";

import { useState, useEffect } from "react";

interface Job {
  job_id: string;
  status: string;
  model: string;
  fine_tuned_model: string | null;
  created_at: number;
  finished_at: number | null;
  trained_tokens: number | null;
}

export default function FineTuningJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [trainingFileId, setTrainingFileId] = useState("");
  const [modelType, setModelType] = useState<"card_identification" | "listing_generation">("card_identification");
  const [baseModel, setBaseModel] = useState("gpt-4o-mini-2024-07-18");
  const [suffix, setSuffix] = useState("slabstak");

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/admin/ml/finetuning/jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async () => {
    if (!trainingFileId.trim()) {
      alert("Please enter a training file ID");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/ml/finetuning/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          training_file_id: trainingFileId,
          model: baseModel,
          suffix: suffix || undefined,
          model_type: modelType
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Fine-tuning job created: ${data.job_id}`);
        setShowCreateForm(false);
        setTrainingFileId("");
        fetchJobs();
      } else {
        const error = await response.json();
        alert(`Failed to create job: ${error.error}`);
      }
    } catch (error) {
      console.error("Failed to create job:", error);
      alert("Failed to create job");
    } finally {
      setIsCreating(false);
    }
  };

  const handleUploadFile = async (exportType: string) => {
    try {
      const response = await fetch("/api/admin/ml/finetuning/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_type: exportType })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`File uploaded!\nFile ID: ${data.file_id}\n\nUse this ID to create a fine-tuning job.`);
        setTrainingFileId(data.file_id);
        setShowCreateForm(true);
      } else {
        const error = await response.json();
        alert(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed");
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string }> = {
      queued: { bg: "bg-gray-100", text: "text-gray-800" },
      running: { bg: "bg-blue-100", text: "text-blue-800" },
      succeeded: { bg: "bg-green-100", text: "text-green-800" },
      failed: { bg: "bg-red-100", text: "text-red-800" },
      cancelled: { bg: "bg-orange-100", text: "text-orange-800" }
    };

    const badge = badges[status] || badges.queued;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
      >
        {status}
      </span>
    );
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading jobs...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Start
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">1. Upload Training Data</h4>
            <p className="text-sm text-gray-600 mb-3">
              Export and upload your training data to OpenAI
            </p>
            <div className="space-y-2">
              <button
                onClick={() => handleUploadFile("card_identification")}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Upload Card ID Data
              </button>
              <button
                onClick={() => handleUploadFile("listing_generation")}
                className="w-full px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Upload Listing Data
              </button>
            </div>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">2. Create Fine-Tuning Job</h4>
            <p className="text-sm text-gray-600 mb-3">
              Start a new fine-tuning job with your uploaded data
            </p>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              {showCreateForm ? "Hide Form" : "Create New Job"}
            </button>
          </div>
        </div>
      </div>

      {/* Create Job Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Create Fine-Tuning Job
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training File ID *
              </label>
              <input
                type="text"
                value={trainingFileId}
                onChange={(e) => setTrainingFileId(e.target.value)}
                placeholder="file-abc123xyz"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Upload a file first to get the file ID
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Type
                </label>
                <select
                  value={modelType}
                  onChange={(e) => setModelType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="card_identification">Card Identification</option>
                  <option value="listing_generation">Listing Generation</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Model
                </label>
                <select
                  value={baseModel}
                  onChange={(e) => setBaseModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="gpt-4o-mini-2024-07-18">GPT-4o-mini (Recommended)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5-turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model Suffix
                </label>
                <input
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="slabstak"
                  maxLength={40}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreateJob}
                disabled={isCreating}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                {isCreating ? "Creating..." : "Create Job"}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Fine-Tuning Jobs
            </h3>
            <button
              onClick={fetchJobs}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No fine-tuning jobs yet. Create one to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Base Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fine-Tuned Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tokens
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobs.map((job) => (
                  <tr key={job.job_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {job.job_id.substring(0, 20)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.model}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {job.fine_tuned_model ? (
                        <span className="font-mono">{job.fine_tuned_model.substring(0, 30)}...</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(job.created_at * 1000).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {job.trained_tokens?.toLocaleString() || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          ℹ️ Fine-Tuning Info
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Jobs typically take 10-30 minutes to complete</li>
          <li>• Cost: ~$3 per 1M tokens for GPT-4o-mini training</li>
          <li>• When a job succeeds, copy the model ID to the Models tab</li>
          <li>• Check job status in OpenAI dashboard for detailed logs</li>
        </ul>
      </div>
    </div>
  );
}
