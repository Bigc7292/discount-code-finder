import Stripe from "stripe";
import { ENV } from "./_core/env";
import { PRODUCTS, TRIAL_DAYS } from "./products";

if (!ENV.stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

export const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
});

/**
 * Create a Stripe customer for a user
 */
export async function createStripeCustomer(params: {
  email: string;
  name?: string;
  userId: string;
}) {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      userId: params.userId,
    },
  });

  return customer;
}

/**
 * Create a checkout session for subscription
 */
export async function createSubscriptionCheckout(params: {
  customerId: string;
  userId: string;
  email: string;
  name?: string;
  origin: string;
  referralCode?: string;
}) {
  // Create or retrieve the price
  const prices = await stripe.prices.list({
    limit: 1,
    active: true,
    currency: PRODUCTS.MONTHLY_SUBSCRIPTION.currency,
    recurring: { interval: PRODUCTS.MONTHLY_SUBSCRIPTION.interval },
  });

  let priceId: string;

  if (prices.data.length > 0 && prices.data[0]) {
    priceId = prices.data[0].id;
  } else {
    // Create product and price if they don't exist
    const product = await stripe.products.create({
      name: PRODUCTS.MONTHLY_SUBSCRIPTION.name,
      description: PRODUCTS.MONTHLY_SUBSCRIPTION.description,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: PRODUCTS.MONTHLY_SUBSCRIPTION.priceInCents,
      currency: PRODUCTS.MONTHLY_SUBSCRIPTION.currency,
      recurring: {
        interval: PRODUCTS.MONTHLY_SUBSCRIPTION.interval,
      },
    });

    priceId = price.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: params.customerId,
    client_reference_id: params.userId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: {
        userId: params.userId,
        referralCode: params.referralCode || "",
      },
    },
    metadata: {
      userId: params.userId,
      customer_email: params.email,
      customer_name: params.name || "",
      referralCode: params.referralCode || "",
    },
    allow_promotion_codes: true,
    success_url: `${params.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/subscription/cancel`,
  });

  return session;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return subscription;
}

/**
 * Get customer portal URL for managing subscription
 */
export async function createCustomerPortalSession(params: {
  customerId: string;
  origin: string;
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: `${params.origin}/profile`,
  });

  return session;
}
