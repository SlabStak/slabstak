import { NextResponse } from "next/server";
import { getCurrentUserServer } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { STRIPE_PRICE_PRO_MONTHLY } from "@/lib/config";

export async function POST() {
  const user = await getCurrentUserServer();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price: STRIPE_PRICE_PRO_MONTHLY,
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?upgraded=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
