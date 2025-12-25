"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface ListingFormData {
  player_name: string;
  set_name: string;
  card_number: string;
  price: number;
  condition: string;
  grade?: string;
  sport: string;
  image_url?: string;
  description?: string;
  shipping_cost: number;
}

export default function SellPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<ListingFormData>({
    player_name: "",
    set_name: "",
    card_number: "",
    price: 0,
    condition: "near_mint",
    sport: "basketball",
    shipping_cost: 5,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "shipping_cost" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.player_name.trim()) {
      setError("Player name is required");
      return;
    }
    if (!formData.set_name.trim()) {
      setError("Set name is required");
      return;
    }
    if (!formData.card_number.trim()) {
      setError("Card number is required");
      return;
    }
    if (formData.price <= 0) {
      setError("Price must be greater than 0");
      return;
    }
    if (formData.shipping_cost < 0) {
      setError("Shipping cost cannot be negative");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/marketplace/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create listing");
      }

      const data = await response.json();
      router.push(`/marketplace/listings/${data.listing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create a Listing</h1>
              <p className="text-gray-600 mt-2">
                Sell your collectible card on the marketplace
              </p>
            </div>
            <Link
              href="/marketplace"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Browse Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Card Details Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Card Details</h2>
              <div className="space-y-4">
                {/* Player Name */}
                <div>
                  <label htmlFor="player_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Player Name *
                  </label>
                  <input
                    type="text"
                    id="player_name"
                    name="player_name"
                    value={formData.player_name}
                    onChange={handleInputChange}
                    placeholder="e.g., Michael Jordan"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Set Name */}
                <div>
                  <label htmlFor="set_name" className="block text-sm font-medium text-gray-700 mb-1">
                    Set Name *
                  </label>
                  <input
                    type="text"
                    id="set_name"
                    name="set_name"
                    value={formData.set_name}
                    onChange={handleInputChange}
                    placeholder="e.g., 1986 Fleer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number *
                  </label>
                  <input
                    type="text"
                    id="card_number"
                    name="card_number"
                    value={formData.card_number}
                    onChange={handleInputChange}
                    placeholder="e.g., #23"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Sport */}
                <div>
                  <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-1">
                    Sport *
                  </label>
                  <select
                    id="sport"
                    name="sport"
                    value={formData.sport}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="basketball">Basketball</option>
                    <option value="baseball">Baseball</option>
                    <option value="football">Football</option>
                    <option value="hockey">Hockey</option>
                    <option value="soccer">Soccer</option>
                  </select>
                </div>

                {/* Condition */}
                <div>
                  <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                    Condition *
                  </label>
                  <select
                    id="condition"
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="poor">Poor</option>
                    <option value="fair">Fair</option>
                    <option value="good">Good</option>
                    <option value="very_good">Very Good</option>
                    <option value="excellent">Excellent</option>
                    <option value="mint">Mint</option>
                    <option value="near_mint">Near Mint</option>
                  </select>
                </div>

                {/* Grade (Optional) */}
                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
                    PSA/BGS Grade (Optional)
                  </label>
                  <input
                    type="text"
                    id="grade"
                    name="grade"
                    value={formData.grade || ""}
                    onChange={handleInputChange}
                    placeholder="e.g., 9.5"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Image URL (Optional) */}
                <div>
                  <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                    Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="image_url"
                    name="image_url"
                    value={formData.image_url || ""}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description (Optional) */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description || ""}
                    onChange={handleInputChange}
                    placeholder="Add any additional details about the card..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Shipping</h2>
              <div className="space-y-4">
                {/* Price */}
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-gray-600">$</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price || ""}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Shipping Cost */}
                <div>
                  <label htmlFor="shipping_cost" className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Cost *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-2 text-gray-600">$</span>
                    <input
                      type="number"
                      id="shipping_cost"
                      name="shipping_cost"
                      value={formData.shipping_cost}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Fee Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900 mb-2">
                    <strong>Platform Fee:</strong> 10% of the item price will be deducted
                  </p>
                  {formData.price > 0 && (
                    <p className="text-sm text-blue-900">
                      <strong>Your Earnings:</strong> ${(formData.price * 0.9).toFixed(2)} + ${formData.shipping_cost.toFixed(2)} shipping
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Creating Listing..." : "Create Listing"}
              </button>
              <Link
                href="/marketplace"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
