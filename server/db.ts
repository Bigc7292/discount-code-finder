import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";
import {
  users,
  searches,
  discountCodes,
  inboxMessages,
  referrals,
  verificationLogs,
  InsertUser,
  InsertSearch,
  InsertDiscountCode,
  InsertInboxMessage,
  InsertReferral,
  InsertVerificationLog
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from "nanoid";

// Global variable to hold the database connection
let _db: PostgresJsDatabase<typeof schema> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
      _db = drizzle(client, { schema });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "stripeCustomerId", "stripeSubscriptionId"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (user.subscriptionStatus !== undefined) {
      values.subscriptionStatus = user.subscriptionStatus;
      updateSet.subscriptionStatus = user.subscriptionStatus;
    }

    if (user.trialEndsAt !== undefined) {
      values.trialEndsAt = user.trialEndsAt;
      updateSet.trialEndsAt = user.trialEndsAt;
    }

    if (user.subscriptionEndsAt !== undefined) {
      values.subscriptionEndsAt = user.subscriptionEndsAt;
      updateSet.subscriptionEndsAt = user.subscriptionEndsAt;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    // Generate referral code if not exists
    if (!values.referralCode) {
      values.referralCode = nanoid(10);
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByReferralCode(referralCode: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.referralCode, referralCode)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserSubscription(userId: number, data: {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionStatus?: "trial" | "active" | "canceled" | "expired";
  trialEndsAt?: Date | null;
  subscriptionEndsAt?: Date | null;
  freeMonthsRemaining?: number;
}) {
  const db = await getDb();
  if (!db) return;

  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function createSearch(search: InsertSearch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(searches).values(search).returning({ id: searches.id });
  return result[0].id;
}

export async function updateSearchStatus(searchId: number, status: "pending" | "processing" | "completed" | "failed", completedAt?: Date) {
  const db = await getDb();
  if (!db) return;

  await db.update(searches).set({ status, completedAt }).where(eq(searches.id, searchId));
}

export async function getUserSearches(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(searches).where(eq(searches.userId, userId)).orderBy(desc(searches.createdAt));
}

export async function createDiscountCode(code: InsertDiscountCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(discountCodes).values(code).returning({ id: discountCodes.id });
  return result[0].id;
}

export async function getDiscountCodesBySearch(searchId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(discountCodes).where(eq(discountCodes.searchId, searchId));
}

export async function updateDiscountCodeVerification(codeId: number, verified: boolean, verifiedAt: Date) {
  const db = await getDb();
  if (!db) return;

  await db.update(discountCodes).set({ verified, verifiedAt }).where(eq(discountCodes.id, codeId));
}

export async function createInboxMessage(message: InsertInboxMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(inboxMessages).values(message).returning({ id: inboxMessages.id });
  return result[0].id;
}

export async function getUserInboxMessages(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      message: inboxMessages,
      search: searches,
      code: discountCodes,
    })
    .from(inboxMessages)
    .leftJoin(searches, eq(inboxMessages.searchId, searches.id))
    .leftJoin(discountCodes, eq(inboxMessages.discountCodeId, discountCodes.id))
    .where(eq(inboxMessages.userId, userId))
    .orderBy(desc(inboxMessages.createdAt));
}

export async function markMessageAsRead(messageId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(inboxMessages).set({ isRead: true, readAt: new Date() }).where(eq(inboxMessages.id, messageId));
}

export async function createReferral(referral: InsertReferral) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(referrals).values(referral).returning({ id: referrals.id });
  return result[0].id;
}

export async function getReferralsByReferrer(referrerId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select({
      referral: referrals,
      referredUser: users,
    })
    .from(referrals)
    .leftJoin(users, eq(referrals.referredUserId, users.id))
    .where(eq(referrals.referrerId, referrerId))
    .orderBy(desc(referrals.createdAt));
}

export async function updateReferralReward(referralId: number, granted: boolean) {
  const db = await getDb();
  if (!db) return;

  await db.update(referrals).set({
    rewardGranted: granted,
    rewardGrantedAt: granted ? new Date() : null
  }).where(eq(referrals.id, referralId));
}

export async function createVerificationLog(log: InsertVerificationLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(verificationLogs).values(log).returning({ id: verificationLogs.id });
  return result[0].id;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function getSearchById(searchId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(searches).where(eq(searches.id, searchId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Search limit constants
const TRIAL_DAILY_SEARCH_LIMIT = 15;
const PAID_DAILY_SEARCH_LIMIT = 999999; // Effectively unlimited

/**
 * Check if user has reached their daily search limit
 */
export async function checkSearchLimit(userId: number): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const db = await getDb();
  if (!db) {
    return { allowed: true, remaining: 999, limit: 999 };
  }

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.length === 0) {
    return { allowed: false, remaining: 0, limit: 0 };
  }

  const userData = user[0];
  const now = new Date();
  const lastReset = new Date(userData.lastSearchResetDate);

  // Check if we need to reset the daily count (new day)
  const needsReset = now.getDate() !== lastReset.getDate() ||
    now.getMonth() !== lastReset.getMonth() ||
    now.getFullYear() !== lastReset.getFullYear();

  if (needsReset) {
    // Reset the count for a new day and notification flags
    await db.update(users)
      .set({
        dailySearchCount: 0,
        lastSearchResetDate: now,
        searchLimitWarningToday: false // Reset warning flag for new day
      })
      .where(eq(users.id, userId));

    const limit = userData.subscriptionStatus === "active" ? PAID_DAILY_SEARCH_LIMIT : TRIAL_DAILY_SEARCH_LIMIT;
    return { allowed: true, remaining: limit, limit };
  }

  // Determine limit based on subscription status
  const limit = userData.subscriptionStatus === "active" ? PAID_DAILY_SEARCH_LIMIT : TRIAL_DAILY_SEARCH_LIMIT;
  const remaining = Math.max(0, limit - userData.dailySearchCount);
  const allowed = userData.dailySearchCount < limit;

  return { allowed, remaining, limit };
}

/**
 * Increment user's daily search count
 */
export async function incrementSearchCount(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db.update(users)
    .set({
      dailySearchCount: sql`${users.dailySearchCount} + 1`
    })
    .where(eq(users.id, userId));
}
