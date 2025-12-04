import { notifyOwner } from "./_core/notification";
import { trackEvent } from "./analytics";

/**
 * Email notification templates and sending logic for trial users
 */

interface EmailNotification {
  to: string;
  subject: string;
  body: string;
}

/**
 * Send search limit warning email when user has 3 searches remaining
 */
export async function sendSearchLimitWarning(
  userEmail: string,
  userName: string,
  searchesRemaining: number
): Promise<boolean> {
  const subject = `⚠️ Only ${searchesRemaining} searches remaining today - CodeFinder`;
  
  const body = `
Hi ${userName},

You have only ${searchesRemaining} discount code searches remaining for today.

Your daily search limit will reset tomorrow, or you can upgrade to premium for unlimited searches!

**Premium Benefits:**
✓ Unlimited discount code searches
✓ Priority verification
✓ Advanced search filters
✓ Search history export
✓ Only $9.99/month

Upgrade now to never worry about search limits again!

Best regards,
The CodeFinder Team
  `.trim();

  // Use owner notification API to send email
  // In production, this would use a proper email service
  try {
    await notifyOwner({
      title: `Search Limit Warning for ${userEmail}`,
      content: body,
    });
    
    // Track email sent event
    await trackEvent({
      userId: null,
      eventType: "email_sent",
      eventCategory: "search_limit_warning",
      metadata: JSON.stringify({ email: userEmail, searchesRemaining }),
    });
    
    console.log(`[EmailNotification] Search limit warning sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`[EmailNotification] Failed to send search limit warning:`, error);
    return false;
  }
}

/**
 * Send trial expiry warning email when trial expires in 24 hours
 */
export async function sendTrialExpiryWarning(
  userEmail: string,
  userName: string,
  expiryDate: Date
): Promise<boolean> {
  const subject = `⏰ Your free trial expires in 24 hours - CodeFinder`;
  
  const body = `
Hi ${userName},

Your 7-day free trial of CodeFinder will expire in 24 hours on ${expiryDate.toLocaleDateString()} at ${expiryDate.toLocaleTimeString()}.

Don't lose access to verified discount codes! Subscribe now to continue saving money.

**What you'll keep with Premium:**
✓ Unlimited discount code searches
✓ AI-powered code discovery
✓ Real browser verification
✓ Verified codes delivered to your inbox
✓ Search history and favorites
✓ Referral rewards program

**Special Offer:** Subscribe now for just $9.99/month with our 7-day money-back guarantee!

Subscribe here: [Your Profile Page]

Questions? Reply to this email and we'll be happy to help!

Best regards,
The CodeFinder Team
  `.trim();

  try {
    await notifyOwner({
      title: `Trial Expiry Warning for ${userEmail}`,
      content: body,
    });
    
    // Track email sent event
    await trackEvent({
      userId: null,
      eventType: "email_sent",
      eventCategory: "trial_expiry_warning",
      metadata: JSON.stringify({ email: userEmail, expiryDate: expiryDate.toISOString() }),
    });
    
    console.log(`[EmailNotification] Trial expiry warning sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`[EmailNotification] Failed to send trial expiry warning:`, error);
    return false;
  }
}

/**
 * Send trial expired notification
 */
export async function sendTrialExpiredNotification(
  userEmail: string,
  userName: string
): Promise<boolean> {
  const subject = `Your free trial has ended - CodeFinder`;
  
  const body = `
Hi ${userName},

Your 7-day free trial of CodeFinder has ended.

We hope you enjoyed discovering verified discount codes! To continue using CodeFinder, please subscribe to our premium plan.

**Premium Plan - $9.99/month:**
✓ Unlimited searches
✓ All features unlocked
✓ Cancel anytime

Subscribe now to keep saving money with verified discount codes!

Thank you for trying CodeFinder!

Best regards,
The CodeFinder Team
  `.trim();

  try {
    await notifyOwner({
      title: `Trial Expired for ${userEmail}`,
      content: body,
    });
    
    console.log(`[EmailNotification] Trial expired notification sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`[EmailNotification] Failed to send trial expired notification:`, error);
    return false;
  }
}

/**
 * Send welcome email when user starts trial
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  trialEndsAt: Date
): Promise<boolean> {
  const subject = `Welcome to CodeFinder! Your 7-day trial has started 🎉`;
  
  const body = `
Hi ${userName},

Welcome to CodeFinder! Your 7-day free trial has started.

**What you can do during your trial:**
✓ Search for discount codes (15 searches per day)
✓ Get AI-verified discount codes
✓ Receive codes in your inbox
✓ View search history
✓ Refer friends and earn free months

Your trial ends on ${trialEndsAt.toLocaleDateString()}. Make the most of it!

**Getting Started:**
1. Go to the Search page
2. Enter what you're looking for (product, service, merchant)
3. Our AI will find and verify discount codes for you
4. Verified codes appear in your inbox

Need help? Just reply to this email!

Happy saving!
The CodeFinder Team
  `.trim();

  try {
    await notifyOwner({
      title: `Welcome Email for ${userEmail}`,
      content: body,
    });
    
    // Track email sent event
    await trackEvent({
      userId: null,
      eventType: "email_sent",
      eventCategory: "welcome_email",
      metadata: JSON.stringify({ email: userEmail, trialEndsAt: trialEndsAt.toISOString() }),
    });
    
    console.log(`[EmailNotification] Welcome email sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`[EmailNotification] Failed to send welcome email:`, error);
    return false;
  }
}
