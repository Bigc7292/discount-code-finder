import { getDb } from "./db";
import { analyticsEvents, type InsertAnalyticsEvent } from "../drizzle/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

/**
 * Track an analytics event
 */
export async function trackEvent(event: Omit<InsertAnalyticsEvent, "id" | "createdAt">): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Analytics] Database not available");
    return;
  }

  try {
    await db.insert(analyticsEvents).values(event);
    console.log(`[Analytics] Tracked event: ${event.eventType} - ${event.eventCategory || "N/A"}`);
  } catch (error) {
    console.error("[Analytics] Failed to track event:", error);
  }
}

/**
 * Get email engagement metrics for a date range
 */
export async function getEmailMetrics(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get email sent count
  const emailsSent = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "email_sent"),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );

  // Get email opened count
  const emailsOpened = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "email_opened"),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );

  // Get email clicked count
  const emailsClicked = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "email_clicked"),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );

  const sent = Number(emailsSent[0]?.count || 0);
  const opened = Number(emailsOpened[0]?.count || 0);
  const clicked = Number(emailsClicked[0]?.count || 0);

  const openRate = sent > 0 ? (opened / sent) * 100 : 0;
  const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;
  const clickThroughRate = opened > 0 ? (clicked / opened) * 100 : 0;

  return {
    sent,
    opened,
    clicked,
    openRate: Math.round(openRate * 10) / 10,
    clickRate: Math.round(clickRate * 10) / 10,
    clickThroughRate: Math.round(clickThroughRate * 10) / 10,
  };
}

/**
 * Get email metrics by category
 */
export async function getEmailMetricsByCategory(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const categories = ["search_limit_warning", "trial_expiry_warning", "welcome_email"];
  const results = [];

  for (const category of categories) {
    const sent = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, "email_sent"),
          eq(analyticsEvents.eventCategory, category),
          gte(analyticsEvents.createdAt, startDate),
          lte(analyticsEvents.createdAt, endDate)
        )
      );

    const opened = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, "email_opened"),
          eq(analyticsEvents.eventCategory, category),
          gte(analyticsEvents.createdAt, startDate),
          lte(analyticsEvents.createdAt, endDate)
        )
      );

    const clicked = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.eventType, "email_clicked"),
          eq(analyticsEvents.eventCategory, category),
          gte(analyticsEvents.createdAt, startDate),
          lte(analyticsEvents.createdAt, endDate)
        )
      );

    const sentCount = Number(sent[0]?.count || 0);
    const openedCount = Number(opened[0]?.count || 0);
    const clickedCount = Number(clicked[0]?.count || 0);

    results.push({
      category,
      sent: sentCount,
      opened: openedCount,
      clicked: clickedCount,
      openRate: sentCount > 0 ? Math.round((openedCount / sentCount) * 1000) / 10 : 0,
      clickRate: sentCount > 0 ? Math.round((clickedCount / sentCount) * 1000) / 10 : 0,
    });
  }

  return results;
}

/**
 * Get trial conversion metrics
 */
export async function getTrialConversionMetrics(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get trials started
  const trialsStarted = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "trial_started"),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );

  // Get trials converted
  const trialsConverted = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "trial_converted"),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );

  // Get trials expired
  const trialsExpired = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "trial_expired"),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );

  const started = Number(trialsStarted[0]?.count || 0);
  const converted = Number(trialsConverted[0]?.count || 0);
  const expired = Number(trialsExpired[0]?.count || 0);

  const conversionRate = started > 0 ? (converted / started) * 100 : 0;

  return {
    started,
    converted,
    expired,
    conversionRate: Math.round(conversionRate * 10) / 10,
  };
}

/**
 * Get subscription metrics
 */
export async function getSubscriptionMetrics(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const subscriptionsCreated = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "subscription_created"),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );

  const subscriptionsCanceled = await db
    .select({ count: sql<number>`count(*)` })
    .from(analyticsEvents)
    .where(
      and(
        eq(analyticsEvents.eventType, "subscription_canceled"),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );

  const created = Number(subscriptionsCreated[0]?.count || 0);
  const canceled = Number(subscriptionsCanceled[0]?.count || 0);

  const churnRate = created > 0 ? (canceled / created) * 100 : 0;

  return {
    created,
    canceled,
    churnRate: Math.round(churnRate * 10) / 10,
  };
}
