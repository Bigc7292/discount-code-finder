import { Request, Response } from "express";
import { stripe } from "./stripe";
import { ENV } from "./_core/env";
import { 
  getUserById, 
  updateUserSubscription, 
  createReferral, 
  updateReferralReward,
  getReferralsByReferrer 
} from "./db";
import { REFERRAL_FREE_MONTHS } from "./products";

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Webhook] No signature provided");
    return res.status(400).send("No signature");
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.stripeWebhookSecret
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        console.log("[Webhook] Checkout completed:", session.id);
        
        const userId = session.metadata?.userId;
        const referralCode = session.metadata?.referralCode;
        
        if (userId) {
          const user = await getUserById(parseInt(userId));
          if (user) {
            // Update user with Stripe customer and subscription IDs
            await updateUserSubscription(user.id, {
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionStatus: "trial",
            });
            
            // Handle referral if present
            if (referralCode) {
              console.log(`[Webhook] Processing referral code: ${referralCode}`);
              // Referral will be processed when trial converts to paid
            }
          }
        }
        break;
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as any;
        console.log("[Webhook] Subscription created:", subscription.id);
        
        const userId = subscription.metadata?.userId;
        if (userId) {
          const trialEnd = subscription.trial_end 
            ? new Date(subscription.trial_end * 1000) 
            : null;
          
          await updateUserSubscription(parseInt(userId), {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status === "trialing" ? "trial" : "active",
            trialEndsAt: trialEnd,
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        console.log("[Webhook] Subscription updated:", subscription.id);
        
        const userId = subscription.metadata?.userId;
        if (userId) {
          let status: "trial" | "active" | "canceled" | "expired" = "active";
          
          if (subscription.status === "trialing") {
            status = "trial";
          } else if (subscription.status === "canceled" || subscription.cancel_at_period_end) {
            status = "canceled";
          } else if (subscription.status === "active") {
            status = "active";
          } else {
            status = "expired";
          }
          
          const currentPeriodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : null;
          
          await updateUserSubscription(parseInt(userId), {
            subscriptionStatus: status,
            subscriptionEndsAt: currentPeriodEnd,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        console.log("[Webhook] Subscription deleted:", subscription.id);
        
        const userId = subscription.metadata?.userId;
        if (userId) {
          await updateUserSubscription(parseInt(userId), {
            subscriptionStatus: "expired",
            subscriptionEndsAt: new Date(),
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        console.log("[Webhook] Invoice paid:", invoice.id);
        
        // Check if this is the first payment after trial (billing_reason === 'subscription_cycle')
        if (invoice.billing_reason === "subscription_cycle") {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const userId = subscription.metadata?.userId;
          const referralCode = subscription.metadata?.referralCode;
          
          if (userId && referralCode) {
            // Grant referral reward
            console.log(`[Webhook] Granting referral reward for code: ${referralCode}`);
            // This will be handled in the tRPC procedure
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        console.log("[Webhook] Payment failed:", invoice.id);
        // Handle payment failure (send notification, etc.)
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
