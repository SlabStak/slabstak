export const FREE_SCANS_PER_MONTH = 10;
export const FREE_VAULT_LIMIT = 25;

// Soft cap for Pro users to prevent abuse; tune as needed.
export const PRO_SCANS_PER_MONTH_SOFT = 1000;

// Pricing configuration
export const PRO_PLAN_PRICE = 29.99; // USD per month
export const STRIPE_PRICE_PRO_MONTHLY =
  process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "price_pro_monthly_placeholder";
