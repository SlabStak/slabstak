import { NextResponse } from "next/server";
import { getCurrentUserServer, getUserSubscription } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { getSupabaseServer } from "@/lib/supabaseClient";

export async function POST() {
  const user = await getCurrentUserServer();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const sub = await getUserSubscription(user.id);
    if (!sub?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 404 }
      );
    }

    const stripe = getStripe();

    // Cancel at period end (user keeps access until end of billing period)
    const subscription = await stripe.subscriptions.update(
      sub.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Update our database
    const supabase = getSupabaseServer();
    await supabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        status: subscription.status,
      })
      .eq("stripe_subscription_id", sub.stripe_subscription_id);

    return NextResponse.json(
      {
        success: true,
        message: "Subscription will be canceled at the end of the billing period",
        cancel_at: subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000).toISOString()
          : null,
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Failed to cancel subscription:", err);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}
