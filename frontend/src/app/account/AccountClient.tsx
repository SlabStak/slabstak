"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PRO_PLAN_PRICE } from "@/lib/config";

interface AccountClientProps {
  user: {
    id: string;
    email: string;
  };
  subscription: {
    plan: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    stripe_customer_id: string | null;
  } | null;
}

export default function AccountClient({ user, subscription }: AccountClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded");

  const [isLoading, setIsLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const isPro = subscription?.plan === "pro" && subscription?.status === "active";
  const isCanceling = subscription?.cancel_at_period_end;

  const periodEndDate = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const handleManageBilling = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No portal URL returned");
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/stripe/cancel", { method: "POST" });

      if (res.ok) {
        setCancelSuccess(true);
        setShowCancelModal(false);
        // Refresh the page to show updated status
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        const data = await res.json();
        console.error("Failed to cancel:", data.error);
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/stripe/create-checkout", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to start checkout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold">Account Settings</h1>
        <p className="text-sm text-slate-300">
          Manage your subscription and account preferences.
        </p>
      </div>

      {/* Success Messages */}
      {upgraded && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-emerald-400 font-medium">
            Welcome to SlabStak Pro! Your account has been upgraded.
          </p>
        </div>
      )}

      {cancelSuccess && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-yellow-400 font-medium">
            Your subscription has been scheduled for cancellation. You&apos;ll keep Pro access until {periodEndDate}.
          </p>
        </div>
      )}

      {/* Account Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Account Information</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-400">Email</span>
            <span className="text-slate-100">{user.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-400">User ID</span>
            <span className="text-slate-500 text-xs font-mono">{user.id.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Subscription</h2>
          {isPro && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
              PRO
            </span>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-slate-800">
            <span className="text-slate-400">Plan</span>
            <span className="text-slate-100 font-semibold capitalize">
              {subscription?.plan || "Free"}
            </span>
          </div>

          {isPro && (
            <>
              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Status</span>
                <span
                  className={`font-semibold capitalize ${
                    subscription?.status === "active"
                      ? "text-emerald-400"
                      : subscription?.status === "past_due"
                      ? "text-yellow-400"
                      : "text-slate-400"
                  }`}
                >
                  {isCanceling ? "Canceling" : subscription?.status}
                </span>
              </div>

              <div className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-slate-400">Price</span>
                <span className="text-slate-100">${PRO_PLAN_PRICE}/month</span>
              </div>

              {periodEndDate && (
                <div className="flex justify-between items-center py-2 border-b border-slate-800">
                  <span className="text-slate-400">
                    {isCanceling ? "Access until" : "Next billing date"}
                  </span>
                  <span className="text-slate-100">{periodEndDate}</span>
                </div>
              )}
            </>
          )}

          {!isPro && (
            <div className="p-4 rounded-lg bg-slate-800/50 mt-4">
              <p className="text-slate-300 mb-3">
                Upgrade to Pro for unlimited cards, AI listing generator, dealer tools, and more.
              </p>
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg bg-sky-500 text-slate-950 font-semibold hover:bg-sky-400 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Loading..." : `Upgrade to Pro - $${PRO_PLAN_PRICE}/mo`}
              </button>
            </div>
          )}
        </div>

        {/* Pro Actions */}
        {isPro && (
          <div className="flex flex-wrap gap-3 pt-4">
            <button
              onClick={handleManageBilling}
              disabled={isLoading}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Loading..." : "Manage Billing"}
            </button>

            {!isCanceling && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        )}

        {isCanceling && (
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 mt-4">
            <p className="text-yellow-400 text-sm">
              Your subscription is scheduled to cancel on {periodEndDate}. You&apos;ll keep Pro access until then.
            </p>
            <button
              onClick={handleManageBilling}
              className="mt-2 text-sm text-sky-400 hover:text-sky-300 underline"
            >
              Reactivate subscription
            </button>
          </div>
        )}
      </div>

      {/* Pro Features */}
      {isPro && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <h2 className="text-lg font-semibold">Pro Features</h2>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Unlimited card vault storage
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              AI-powered listing generator
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Dealer show tracking & P&L
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              CSV import/export
            </li>
            <li className="flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              Priority support
            </li>
          </ul>
        </div>
      )}

      {/* Quick Links */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <h2 className="text-lg font-semibold">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/vault"
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            My Vault
          </Link>
          <Link
            href="/scan"
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Scan Card
          </Link>
          <Link
            href="/pricing"
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            View Plans
          </Link>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Cancel Subscription?</h3>
            <p className="text-sm text-slate-400 mb-4">
              You&apos;ll keep Pro access until {periodEndDate}, then your account will revert to the free plan with a 25-card vault limit.
            </p>
            <div className="space-y-3 text-sm text-slate-400 mb-6">
              <p>You&apos;ll lose access to:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Unlimited card storage</li>
                <li>AI listing generator</li>
                <li>Dealer show tracking</li>
                <li>Priority support</li>
              </ul>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                disabled={isLoading}
              >
                Keep Pro
              </button>
              <button
                onClick={handleCancelSubscription}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Canceling..." : "Cancel Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
