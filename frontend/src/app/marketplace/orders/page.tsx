"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Listing {
  player_name: string;
  set_name: string;
  price: number;
  image_url?: string;
}

interface User {
  id: string;
  email: string;
  user_profiles: {
    display_name: string;
  };
}

interface Order {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: string;
  payment_status: string;
  total_amount: number;
  created_at: string;
  listing: Listing;
  buyer: User;
  seller: User;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
  limit: number;
  offset: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"purchased" | "selling">("purchased");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/marketplace/orders?type=${activeTab}&limit=50`
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Please log in to view your orders");
          }
          throw new Error("Failed to fetch orders");
        }

        const data: OrdersResponse = await response.json();
        setOrders(data.orders);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [activeTab]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      case "paid":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "shipped":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "delivered":
        return "bg-green-50 text-green-800 border-green-200";
      case "completed":
        return "bg-green-50 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-50 text-red-800 border-red-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-600";
      case "unpaid":
        return "text-yellow-600";
      case "refunded":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
              <p className="text-gray-600 mt-2">
                Manage your purchases and sales
              </p>
            </div>
            <Link
              href="/marketplace"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("purchased")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "purchased"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Purchases
            </button>
            <button
              onClick={() => setActiveTab("selling")}
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === "selling"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
              }`}
            >
              Sales
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg mb-4">
              {activeTab === "purchased"
                ? "No purchases yet. Start shopping in the marketplace!"
                : "No sales yet. Create a listing to get started!"}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/marketplace"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Browse Marketplace
              </Link>
              {activeTab === "selling" && (
                <Link
                  href="/marketplace/sell"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Create Listing
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link key={order.id} href={`/marketplace/orders/${order.id}`}>
                <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    {/* Card Image and Info */}
                    <div className="md:col-span-2">
                      <h3 className="font-bold text-gray-900 mb-1">
                        {order.listing.player_name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {order.listing.set_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Order #{order.id.slice(0, 8)}
                      </p>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        ${order.total_amount.toFixed(2)}
                      </p>
                    </div>

                    {/* Order Status */}
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>

                    {/* Payment Status */}
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Payment</p>
                      <p
                        className={`text-sm font-semibold ${getPaymentStatusColor(
                          order.payment_status
                        )}`}
                      >
                        {order.payment_status.charAt(0).toUpperCase() +
                          order.payment_status.slice(1)}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      {activeTab === "purchased"
                        ? `Seller: ${order.seller.user_profiles.display_name}`
                        : `Buyer: ${order.buyer.user_profiles.display_name}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
