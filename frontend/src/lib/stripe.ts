import Stripe from "stripe";

// Initialize Stripe lazily to avoid errors during build time
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
    });
  }
  return stripe;
}
