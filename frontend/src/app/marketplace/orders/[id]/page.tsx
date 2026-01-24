"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  sender: {
    id: string;
    email: string;
    user_profiles: {
      display_name: string;
    };
  };
}

interface User {
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
  price: number;
  image_url?: string;
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

interface CurrentUser {
  id: string;
  email: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [ratingInput, setRatingInput] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasRated, setHasRated] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/user");
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch current user:", err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch order and messages
  useEffect(() => {
    const fetchOrderAndMessages = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order
        const orderResponse = await fetch(`/api/marketplace/orders/${orderId}`);
        if (!orderResponse.ok) {
          throw new Error("Failed to fetch order");
        }
        const orderData = await orderResponse.json();
        setOrder(orderData.order);

        // Fetch messages
        const messagesResponse = await fetch(
          `/api/marketplace/orders/${orderId}/messages`
        );
        if (!messagesResponse.ok) {
          throw new Error("Failed to fetch messages");
        }
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderAndMessages();
    }
  }, [orderId]);

  // Refresh messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/marketplace/orders/${orderId}/messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to refresh messages:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim()) {
      setError("Message cannot be empty");
      return;
    }

    try {
      setSendingMessage(true);
      setError(null);

      const response = await fetch(`/api/marketplace/orders/${orderId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageInput.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to send message");
      }

      const data = await response.json();
      setMessages([...messages, data.data]);
      setMessageInput("");
      setSuccess("Message sent!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!order) return;

    try {
      setSubmittingRating(true);
      setError(null);

      const response = await fetch("/api/marketplace/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          rating: ratingInput,
          review_text: reviewText || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit rating");
      }

      setHasRated(true);
      setSuccess("Rating submitted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            <div className="h-64 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !order || !currentUser) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-bold mb-2">Error</h2>
            <p className="text-red-700 mb-4">
              {error || "Order not found or you don't have access to it"}
            </p>
            <Link
              href="/marketplace/orders"
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Back to Orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isBuyer = order.buyer_id === currentUser.id;
  const isSeller = order.seller_id === currentUser.id;
  const otherUser = isBuyer ? order.seller : order.buyer;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/marketplace/orders"
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block"
          >
            ← Back to Orders
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-green-700">{success}</p>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Messaging */}
          <div className="lg:col-span-2">
            {/* Order Summary Card */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-600">Card</p>
                  <p className="font-bold text-gray-900">
                    {order.listing.player_name}
                  </p>
                  <p className="text-sm text-gray-600">{order.listing.set_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${order.total_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-xs text-gray-600">Status</p>
                  <p className="font-medium text-gray-900">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Payment</p>
                  <p className="font-medium text-gray-900">
                    {order.payment_status.charAt(0).toUpperCase() +
                      order.payment_status.slice(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Order Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden flex flex-col h-96">
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_id === currentUser.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.sender_id === currentUser.id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-gray-200 p-4 bg-white"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={sendingMessage}
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !messageInput.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Send
                  </button>
                </div>
                {error && (
                  <p className="text-red-600 text-sm mt-2">{error}</p>
                )}
              </form>
            </div>
          </div>

          {/* Right: Other User Info & Rating */}
          <div className="lg:col-span-1">
            {/* Buyer/Seller Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {isBuyer ? "Seller" : "Buyer"}
              </h3>
              <p className="font-bold text-gray-900 mb-1">
                {otherUser.user_profiles.display_name}
              </p>
              <p className="text-sm text-gray-600 mb-4">{otherUser.email}</p>

              <div className="pt-4 border-t border-gray-200">
                <Link
                  href={`/marketplace`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Profile
                </Link>
              </div>
            </div>

            {/* Rating Section */}
            {order.status === "delivered" && !hasRated && (isBuyer || isSeller) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Leave a Rating</h3>

                <form onSubmit={handleSubmitRating} className="space-y-4">
                  {/* Star Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating *
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRatingInput(star)}
                          className={`px-3 py-2 rounded text-sm font-bold ${
                            star <= ratingInput
                              ? "bg-yellow-400 text-white"
                              : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {star}★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div>
                    <label
                      htmlFor="review"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Review (Optional)
                    </label>
                    <textarea
                      id="review"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with this transaction..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                  >
                    {submittingRating ? "Submitting..." : "Submit Rating"}
                  </button>
                </form>
              </div>
            )}

            {hasRated && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <p className="text-green-700 font-medium">
                  ✓ You've rated this transaction
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
