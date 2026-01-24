"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface Order {
  id: string;
  total_amount: number;
  listing_id: string;
  status: string;
}

interface CheckoutFormProps {
  order: Order;
  clientSecret: string;
  paymentIntentId: string;
}

function CheckoutForm({ order, clientSecret, paymentIntentId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError("Stripe not loaded. Please refresh and try again.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Confirm payment with Stripe
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: "customer@example.com", // Should get from user profile
            },
          },
        });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent?.status === "succeeded") {
        // Confirm payment on backend
        const confirmResponse = await fetch(
          "/api/marketplace/payments/confirm",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: order.id,
              payment_intent_id: paymentIntentId,
            }),
          }
        );

        if (!confirmResponse.ok) {
          const confirmError = await confirmResponse.json();
          throw new Error(
            confirmError.detail || "Failed to confirm payment"
          );
        }

        setSuccess(true);
        setTimeout(() => {
          router.push(`/marketplace/orders/${order.id}`);
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mb-4 text-4xl">✓</div>
        <h2 className="text-2xl font-bold text-green-600 mb-2">
          Payment Successful!
        </h2>
        <p className="text-gray-600">
          Redirecting to your order details...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Details */}
      <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-4">
          Card Details
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={processing || !stripe}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {processing ? "Processing..." : `Pay $${order.total_amount.toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Your payment information is secure and encrypted.
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch order details
        const orderResponse = await fetch(
          `/api/marketplace/orders/${orderId}`
        );

        if (!orderResponse.ok) {
          throw new Error("Failed to fetch order");
        }

        const orderData = await orderResponse.json();
        const fetchedOrder = orderData.order;

        if (fetchedOrder.status !== "pending") {
          throw new Error("Order is not in pending state");
        }

        setOrder(fetchedOrder);

        // Create payment intent
        const paymentResponse = await fetch(
          "/api/marketplace/payments/intent",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_id: orderId,
            }),
          }
        );

        if (!paymentResponse.ok) {
          const paymentError = await paymentResponse.json();
          throw new Error(
            paymentError.detail || "Failed to create payment intent"
          );
        }

        const paymentData = await paymentResponse.json();
        setClientSecret(paymentData.client_secret);
        setPaymentIntentId(paymentData.payment_intent_id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      initializePayment();
    }
  }, [orderId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow p-8">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !order || !clientSecret || !paymentIntentId) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-red-800 font-bold mb-2">Error</h2>
            <p className="text-red-700 mb-4">
              {error || "Failed to initialize payment"}
            </p>
            <button
              onClick={() => router.back()}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Go Back
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">Complete your purchase securely</p>
        </div>
      </div>

      {/* Checkout Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-8">
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  order={order}
                  clientSecret={clientSecret}
                  paymentIntentId={paymentIntentId}
                />
              </Elements>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Order ID</span>
                  <span className="font-medium text-gray-900">
                    {order.id.slice(0, 8)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    ${(order.total_amount * 0.909).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Fees & Tax</span>
                  <span className="font-medium text-gray-900">
                    ${(order.total_amount * 0.091).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-green-600">
                      ${order.total_amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
