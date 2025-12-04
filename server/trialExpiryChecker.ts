import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { and, eq, lt, gt } from "drizzle-orm";
import { sendTrialExpiryWarning } from "./emailNotifications";

/**
 * Check for trials expiring in 24 hours and send warning emails
 * This should be run as a scheduled job (e.g., daily at midnight)
 */
export async function checkTrialExpiries(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[TrialExpiryChecker] Database not available");
    return;
  }

  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    // Find trial users whose trial expires between 24-25 hours from now
    // and who haven't received the warning yet
    const expiringTrials = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.subscriptionStatus, "trial"),
          gt(users.trialEndsAt, in24Hours),
          lt(users.trialEndsAt, in25Hours),
          eq(users.trialExpiryWarningSent, false)
        )
      );

    console.log(`[TrialExpiryChecker] Found ${expiringTrials.length} trials expiring in 24 hours`);

    for (const user of expiringTrials) {
      if (!user.email || !user.trialEndsAt) {
        continue;
      }

      try {
        const sent = await sendTrialExpiryWarning(
          user.email,
          user.name || "User",
          user.trialEndsAt
        );

        if (sent) {
          // Mark warning as sent
          await db
            .update(users)
            .set({ trialExpiryWarningSent: true })
            .where(eq(users.id, user.id));

          console.log(`[TrialExpiryChecker] Sent expiry warning to ${user.email}`);
        }
      } catch (error) {
        console.error(`[TrialExpiryChecker] Failed to send warning to ${user.email}:`, error);
      }
    }
  } catch (error) {
    console.error("[TrialExpiryChecker] Error checking trial expiries:", error);
  }
}

/**
 * Start the trial expiry checker as a recurring job
 * Runs every hour to check for trials expiring in 24 hours
 */
export function startTrialExpiryChecker(): void {
  // Run immediately on startup
  checkTrialExpiries().catch(err => {
    console.error("[TrialExpiryChecker] Initial check failed:", err);
  });

  // Then run every hour
  setInterval(() => {
    checkTrialExpiries().catch(err => {
      console.error("[TrialExpiryChecker] Scheduled check failed:", err);
    });
  }, 60 * 60 * 1000); // Every hour

  console.log("[TrialExpiryChecker] Started (checking every hour)");
}
