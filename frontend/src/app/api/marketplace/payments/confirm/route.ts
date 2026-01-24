import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserServer } from "@/lib/auth";
import { getSupabaseServer } from "@/lib/supabaseClient";
import { getStripe } from "@/lib/stripe";

interface ConfirmPaymentPayload {
  order_id: string;
  payment_intent_id: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUserServer();
    if (!user) {
      return NextResponse.json({ detail: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServer();
    const payload: ConfirmPaymentPayload = await req.json();

    if (!payload.order_id || !payload.payment_intent_id) {
      return NextResponse.json(
        { detail: "order_id and payment_intent_id are required" },
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

    // Verify payment intent with Stripe
    const stripe = getStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(
      payload.payment_intent_id
    );

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { detail: "Payment not completed. Please try again." },
        { status: 400 }
      );
    }

    if (paymentIntent.metadata?.order_id !== order.id) {
      return NextResponse.json(
        { detail: "Payment intent does not match order" },
        { status: 400 }
      );
    }

    // Update order status to paid
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        escrow_status: "held",
      })
      .eq("id", order.id);

    if (updateError) {
      throw updateError;
    }

    // Update transaction status
    await supabase
      .from("transactions")
      .update({
        status: "completed",
      })
      .eq("stripe_payment_intent_id", payload.payment_intent_id);

    // Mark listing as having a pending order
    await supabase
      .from("listings")
      .update({
        status: "sold",
      })
      .eq("id", order.listing_id);

    return NextResponse.json(
      {
        message: "Payment confirmed successfully",
        order: {
          id: order.id,
          status: "paid",
          payment_status: "paid",
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
