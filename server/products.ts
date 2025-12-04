/**
 * Stripe product and price configuration
 * Centralized product definitions for subscription management
 */

export const PRODUCTS = {
  MONTHLY_SUBSCRIPTION: {
    name: "Discount Code Finder Pro",
    description: "Unlimited AI-powered discount code searches with automated verification",
    priceInCents: 999, // $9.99
    currency: "usd",
    interval: "month" as const,
  },
} as const;

export const TRIAL_DAYS = 7;
export const REFERRAL_FREE_MONTHS = 1;
