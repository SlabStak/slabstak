"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

interface Seller {
  id: string;
  email: string;
  user_profiles: {
    display_name: string;
  };
}

interface Listing {
  id: string;
  player_name: string;
  set_name: string;
  card_number: string;
  year?: number;
  price: number;
  image_url?: string;
  condition: string;
  grade?: string;
  sport: string;
  description?: string;
  shipping_cost?: number;
  seller_id: string;
  seller: Seller;
  status: string;
  created_at: string;
}

interface SellerProfile {
  average_rating: number;
  total_sales: number;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/marketplace/listings/${listingId}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Listing not found");
          }
          throw new Error("Failed to fetch listing");
        }

        const data = await response.json();
        setListing(data.listing);

        // Fetch seller profile for ratings
        if (data.listing?.seller_id) {
          try {
            const sellerResponse = await fetch(
              `/api/seller/profile/${data.listing.seller_id}`
            );
            if (sellerResponse.ok) {
              const sellerData = await sellerResponse.json();
              setSellerProfile(sellerData.profile);
            }
          } catch (err) {
            console.error("Failed to fetch seller profile:", err);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const handlePurchase = async () => {
    if (!listing) return;

    try {
      setPurchasing(true);
      setError(null);

      const response = await fetch("/api/marketplace/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create order");
      }

      const orderData = await response.json();
      // Redirect to checkout/payment page
      router.push(`/marketplace/checkout/${orderData.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="h-96 bg-gray-200 rounded-lg animate-pulse mb-6" />
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-bold mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error || "Listing not found"}</p>
            <Link
              href="/marketplace"
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(listing.price);

  const shippingCost = listing.shipping_cost || 0;
  const platformFee = listing.price * 0.1;
  const totalAmount = listing.price + shippingCost + platformFee;

  const formattedTotal = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalAmount);

  const isSold = listing.status !== "active";

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/marketplace"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Image */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="relative h-96 bg-gray-100 flex items-center justify-center">
              {listing.image_url ? (
                <Image
                  src={listing.image_url}
                  alt={`${listing.player_name} - ${listing.card_number}`}
                  width={300}
                  height={400}
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                  }}
                />
              ) : (
                <div className="text-gray-400 text-center">
                  <p className="text-lg">No Image Available</p>
                </div>
              )}

              {/* Status Badge */}
              {isSold && (
                <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg font-bold">
                  SOLD
                </div>
              )}
            </div>
          </div>

          {/* Right: Details and Purchase */}
          <div className="space-y-6">
            {/* Card Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {listing.player_name}
              </h1>
              <p className="text-lg text-gray-600 mb-4">{listing.set_name}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Card Number</p>
                  <p className="text-lg font-medium text-gray-900">#{listing.card_number}</p>
                </div>
                {listing.year && (
                  <div>
                    <p className="text-sm text-gray-600">Year</p>
                    <p className="text-lg font-medium text-gray-900">{listing.year}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Condition</p>
                  <p className="text-lg font-medium text-gray-900">{listing.condition}</p>
                </div>
                {listing.grade && (
                  <div>
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="text-lg font-medium text-gray-900">{listing.grade}</p>
                  </div>
                )}
              </div>

              {listing.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-gray-600">{listing.description}</p>
                </div>
              )}
            </div>

            {/* Seller Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Seller Information</h3>
              <p className="text-lg font-medium text-gray-900 mb-2">
                {listing.seller?.user_profiles?.display_name || "Anonymous"}
              </p>
              {sellerProfile && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    Rating: <span className="font-medium text-gray-900">{sellerProfile.average_rating.toFixed(1)} / 5</span>
                  </p>
                  <p>
                    Total Sales: <span className="font-medium text-gray-900">{sellerProfile.total_sales}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pricing</h3>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Item Price:</span>
                  <span className="font-medium text-gray-900">{formattedPrice}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span className="font-medium text-gray-900">
                    ${shippingCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Platform Fee (10%):</span>
                  <span className="font-medium text-gray-900">
                    ${platformFee.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formattedTotal}
                    </span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handlePurchase}
                disabled={isSold || purchasing}
                className={`w-full py-3 rounded-lg font-bold transition-colors ${
                  isSold
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                }`}
              >
                {isSold ? "This item is sold" : purchasing ? "Processing..." : "Buy Now"}
              </button>

              <p className="text-xs text-gray-500 mt-3 text-center">
                You'll complete payment on the next page
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
