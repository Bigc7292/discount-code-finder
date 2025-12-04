import { getDb } from "./db";
import { analyticsEvents } from "../drizzle/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

/**
 * Get daily email metrics for trend charts
 */
export async function getDailyEmailMetrics(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get daily email sent counts
  const dailyData = await db
    .select({
      date: sql<string>`DATE(${analyticsEvents.createdAt})`,
      sent: sql<number>`SUM(CASE WHEN ${analyticsEvents.eventType} = 'email_sent' THEN 1 ELSE 0 END)`,
      opened: sql<number>`SUM(CASE WHEN ${analyticsEvents.eventType} = 'email_opened' THEN 1 ELSE 0 END)`,
      clicked: sql<number>`SUM(CASE WHEN ${analyticsEvents.eventType} = 'email_clicked' THEN 1 ELSE 0 END)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${analyticsEvents.createdAt})`)
    .orderBy(sql`DATE(${analyticsEvents.createdAt})`);

  return dailyData.map((row) => ({
    date: row.date,
    sent: Number(row.sent),
    opened: Number(row.opened),
    clicked: Number(row.clicked),
    openRate: Number(row.sent) > 0 ? Math.round((Number(row.opened) / Number(row.sent)) * 1000) / 10 : 0,
    clickRate: Number(row.sent) > 0 ? Math.round((Number(row.clicked) / Number(row.sent)) * 1000) / 10 : 0,
  }));
}

/**
 * Get conversion funnel data
 */
export async function getConversionFunnel(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

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

  return [
    { stage: "Trials Started", count: Number(trialsStarted[0]?.count || 0), percentage: 100 },
    {
      stage: "Emails Sent",
      count: Number(emailsSent[0]?.count || 0),
      percentage:
        Number(trialsStarted[0]?.count || 0) > 0
          ? Math.round((Number(emailsSent[0]?.count || 0) / Number(trialsStarted[0]?.count || 1)) * 100)
          : 0,
    },
    {
      stage: "Emails Opened",
      count: Number(emailsOpened[0]?.count || 0),
      percentage:
        Number(emailsSent[0]?.count || 0) > 0
          ? Math.round((Number(emailsOpened[0]?.count || 0) / Number(emailsSent[0]?.count || 1)) * 100)
          : 0,
    },
    {
      stage: "Emails Clicked",
      count: Number(emailsClicked[0]?.count || 0),
      percentage:
        Number(emailsOpened[0]?.count || 0) > 0
          ? Math.round((Number(emailsClicked[0]?.count || 0) / Number(emailsOpened[0]?.count || 1)) * 100)
          : 0,
    },
    {
      stage: "Converted to Paid",
      count: Number(trialsConverted[0]?.count || 0),
      percentage:
        Number(trialsStarted[0]?.count || 0) > 0
          ? Math.round((Number(trialsConverted[0]?.count || 0) / Number(trialsStarted[0]?.count || 1)) * 100)
          : 0,
    },
  ];
}

/**
 * Get daily trial conversion data
 */
export async function getDailyTrialConversions(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const dailyData = await db
    .select({
      date: sql<string>`DATE(${analyticsEvents.createdAt})`,
      started: sql<number>`SUM(CASE WHEN ${analyticsEvents.eventType} = 'trial_started' THEN 1 ELSE 0 END)`,
      converted: sql<number>`SUM(CASE WHEN ${analyticsEvents.eventType} = 'trial_converted' THEN 1 ELSE 0 END)`,
      expired: sql<number>`SUM(CASE WHEN ${analyticsEvents.eventType} = 'trial_expired' THEN 1 ELSE 0 END)`,
    })
    .from(analyticsEvents)
    .where(
      and(
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    )
    .groupBy(sql`DATE(${analyticsEvents.createdAt})`)
    .orderBy(sql`DATE(${analyticsEvents.createdAt})`);

  return dailyData.map((row) => ({
    date: row.date,
    started: Number(row.started),
    converted: Number(row.converted),
    expired: Number(row.expired),
    conversionRate: Number(row.started) > 0 ? Math.round((Number(row.converted) / Number(row.started)) * 1000) / 10 : 0,
  }));
}
