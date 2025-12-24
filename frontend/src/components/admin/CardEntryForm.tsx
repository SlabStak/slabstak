"use client";

import { useState } from "react";

interface CardEntryFormProps {
  onSuccess: (message: string) => void;
}

const SPORTS = ["basketball", "baseball", "football", "hockey", "soccer"];
const MANUFACTURERS = ["Topps", "Panini", "Leaf", "Upper Deck", "Bowman", "Donruss"];
const CARD_TYPES = ["base", "rookie", "parallel", "insert", "autograph", "game-used"];
const PARALLEL_TYPES = ["chrome", "refractor", "gold", "silver", "holographic"];

export default function CardEntryForm({ onSuccess }: CardEntryFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    player_name: "",
    set_name: "",
    card_number: "",
    year: new Date().getFullYear(),
    sport: "basketball",
    manufacturer: "Topps",
    team: "",
    position: "",
    card_type: "base",
    print_run: "",
    is_parallel: false,
    parallel_type: "",
    description: "",
    image_url: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === "number") {
      setFormData((prev) => ({
        ...prev,
        [name]: value ? parseInt(value) : "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.player_name || !formData.set_name || !formData.card_number) {
        throw new Error("Player name, set name, and card number are required");
      }

      // Generate unique_key
      const unique_key = `${formData.manufacturer}-${formData.year}-${formData.player_name}-${formData.card_number}`.replace(/\s+/g, "-");

      const payload = {
        ...formData,
        unique_key,
      };

      const response = await fetch("/api/admin/catalog/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to add card");
      }

      onSuccess(`Card "${formData.player_name}" added successfully!`);

      // Reset form
      setFormData({
        player_name: "",
        set_name: "",
        card_number: "",
        year: new Date().getFullYear(),
        sport: "basketball",
        manufacturer: "Topps",
        team: "",
        position: "",
        card_type: "base",
        print_run: "",
        is_parallel: false,
        parallel_type: "",
        description: "",
        image_url: "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Player Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Player Name *
          </label>
          <input
            type="text"
            name="player_name"
            value={formData.player_name}
            onChange={handleChange}
            placeholder="e.g., Michael Jordan"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Set Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Set Name *
          </label>
          <input
            type="text"
            name="set_name"
            value={formData.set_name}
            onChange={handleChange}
            placeholder="e.g., 1986-87 Fleer"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Card Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Number *
          </label>
          <input
            type="text"
            name="card_number"
            value={formData.card_number}
            onChange={handleChange}
            placeholder="e.g., 57"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Year */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year
          </label>
          <input
            type="number"
            name="year"
            value={formData.year}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Sport */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sport
          </label>
          <select
            name="sport"
            value={formData.sport}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {SPORTS.map((sport) => (
              <option key={sport} value={sport}>
                {sport.charAt(0).toUpperCase() + sport.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Manufacturer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manufacturer
          </label>
          <select
            name="manufacturer"
            value={formData.manufacturer}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {MANUFACTURERS.map((mfg) => (
              <option key={mfg} value={mfg}>
                {mfg}
              </option>
            ))}
          </select>
        </div>

        {/* Team */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team
          </label>
          <input
            type="text"
            name="team"
            value={formData.team}
            onChange={handleChange}
            placeholder="e.g., Chicago Bulls"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Position
          </label>
          <input
            type="text"
            name="position"
            value={formData.position}
            onChange={handleChange}
            placeholder="e.g., Guard"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Card Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Type
          </label>
          <select
            name="card_type"
            value={formData.card_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {CARD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Print Run */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Print Run
          </label>
          <input
            type="number"
            name="print_run"
            value={formData.print_run}
            onChange={handleChange}
            placeholder="e.g., 5000"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image URL
          </label>
          <input
            type="url"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/card.jpg"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Parallel Card */}
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="is_parallel"
              checked={formData.is_parallel}
              onChange={handleChange}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Parallel Card</span>
          </label>
          {formData.is_parallel && (
            <select
              name="parallel_type"
              value={formData.parallel_type}
              onChange={handleChange}
              className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select parallel type</option>
              {PARALLEL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Additional details about the card..."
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Adding Card..." : "Add Card"}
        </button>
      </div>
    </form>
  );
}
