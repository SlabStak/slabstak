import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserServer } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getStripe } from "@/lib/stripe";

interface PaymentIntentPayload {
  order_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const payload: PaymentIntentPayload = await req.json();

    if (!payload.order_id) {
      return NextResponse.json(
        { detail: "order_id is required" },
        { status: 400 }
      );
    }

    // Get order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", payload.order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ detail: "Order not found" }, { status: 404 });
    }

    // Verify user is buyer
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ detail: "Forbidden" }, { status: 403 });
    }

    // Get user email for Stripe
    const { data: userProfile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Create Stripe payment intent
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.total_amount * 100), // Convert to cents
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        order_id: order.id,
        buyer_id: user.id,
        seller_id: order.seller_id,
      },
      receipt_email: user.email,
      description: `Marketplace Purchase: ${order.listing_id}`,
    });

    // Store payment intent in database
    await supabase.from("transactions").insert({
      order_id: order.id,
      stripe_payment_intent_id: paymentIntent.id,
      amount: order.total_amount,
      status: "pending",
    });

    return NextResponse.json(
      {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment intent error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
