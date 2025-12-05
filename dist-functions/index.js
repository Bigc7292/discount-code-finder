var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analyticsEvents: () => analyticsEvents,
  discountCodes: () => discountCodes,
  inboxMessages: () => inboxMessages,
  referrals: () => referrals,
  searches: () => searches,
  users: () => users,
  verificationLogs: () => verificationLogs
});
import { pgTable, serial, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
var users, analyticsEvents, searches, discountCodes, inboxMessages, referrals, verificationLogs;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = pgTable("users", {
      id: serial("id").primaryKey(),
      openId: text("openId").notNull().unique(),
      name: text("name"),
      email: text("email"),
      loginMethod: text("loginMethod"),
      role: text("role").default("user").notNull(),
      // "user" | "admin"
      // Subscription fields
      stripeCustomerId: text("stripeCustomerId"),
      stripeSubscriptionId: text("stripeSubscriptionId"),
      subscriptionStatus: text("subscriptionStatus").default("trial").notNull(),
      // "trial" | "active" | "canceled" | "expired"
      trialEndsAt: timestamp("trialEndsAt"),
      subscriptionEndsAt: timestamp("subscriptionEndsAt"),
      // Referral fields
      referralCode: text("referralCode").unique(),
      referredBy: integer("referredBy"),
      freeMonthsRemaining: integer("freeMonthsRemaining").default(0).notNull(),
      // Daily search limit tracking
      dailySearchCount: integer("dailySearchCount").default(0).notNull(),
      lastSearchResetDate: timestamp("lastSearchResetDate").defaultNow().notNull(),
      // Notification tracking
      searchLimitWarningToday: boolean("searchLimitWarningToday").default(false).notNull(),
      trialExpiryWarningSent: boolean("trialExpiryWarningSent").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    }, (table) => ({
      referredByIdx: index("users_referredBy_idx").on(table.referredBy),
      stripeCustomerIdx: index("users_stripeCustomer_idx").on(table.stripeCustomerId)
    }));
    analyticsEvents = pgTable("analyticsEvents", {
      id: serial("id").primaryKey(),
      userId: integer("userId"),
      eventType: text("eventType").notNull(),
      eventCategory: text("eventCategory"),
      // e.g., "search_limit_warning", "trial_expiry_warning"
      metadata: text("metadata"),
      // JSON string for additional data
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => ({
      userIdIdx: index("analyticsEvents_userId_idx").on(table.userId),
      eventTypeIdx: index("analyticsEvents_eventType_idx").on(table.eventType),
      createdAtIdx: index("analyticsEvents_createdAt_idx").on(table.createdAt)
    }));
    searches = pgTable("searches", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      query: text("query").notNull(),
      status: text("status").default("pending").notNull(),
      // "pending" | "processing" | "completed" | "failed"
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      completedAt: timestamp("completedAt")
    }, (table) => ({
      userIdIdx: index("searches_userId_idx").on(table.userId),
      statusIdx: index("searches_status_idx").on(table.status)
    }));
    discountCodes = pgTable("discountCodes", {
      id: serial("id").primaryKey(),
      searchId: integer("searchId").notNull(),
      code: text("code").notNull(),
      merchantName: text("merchantName").notNull(),
      merchantUrl: text("merchantUrl"),
      description: text("description"),
      discountAmount: text("discountAmount"),
      expiryDate: timestamp("expiryDate"),
      verified: boolean("verified").default(false).notNull(),
      verifiedAt: timestamp("verifiedAt"),
      source: text("source"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => ({
      searchIdIdx: index("discountCodes_searchId_idx").on(table.searchId),
      verifiedIdx: index("discountCodes_verified_idx").on(table.verified)
    }));
    inboxMessages = pgTable("inboxMessages", {
      id: serial("id").primaryKey(),
      userId: integer("userId").notNull(),
      searchId: integer("searchId").notNull(),
      discountCodeId: integer("discountCodeId").notNull(),
      isRead: boolean("isRead").default(false).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      readAt: timestamp("readAt")
    }, (table) => ({
      userIdIdx: index("inboxMessages_userId_idx").on(table.userId),
      isReadIdx: index("inboxMessages_isRead_idx").on(table.isRead)
    }));
    referrals = pgTable("referrals", {
      id: serial("id").primaryKey(),
      referrerId: integer("referrerId").notNull(),
      referredUserId: integer("referredUserId").notNull(),
      rewardGranted: boolean("rewardGranted").default(false).notNull(),
      rewardGrantedAt: timestamp("rewardGrantedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => ({
      referrerIdIdx: index("referrals_referrerId_idx").on(table.referrerId),
      referredUserIdIdx: index("referrals_referredUserId_idx").on(table.referredUserId)
    }));
    verificationLogs = pgTable("verificationLogs", {
      id: serial("id").primaryKey(),
      discountCodeId: integer("discountCodeId").notNull(),
      success: boolean("success").notNull(),
      errorMessage: text("errorMessage"),
      verificationDetails: text("verificationDetails"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    }, (table) => ({
      discountCodeIdIdx: index("verificationLogs_discountCodeId_idx").on(table.discountCodeId)
    }));
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
      stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? ""
    };
  }
});

// server/db.ts
import { eq, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { nanoid } from "nanoid";
async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const client = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
      _db = drizzle(client, { schema: schema_exports });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values = {
      openId: user.openId
    };
    const updateSet = {};
    const textFields = ["name", "email", "loginMethod", "stripeCustomerId", "stripeSubscriptionId"];
    const assignNullable = (field) => {
      const value = user[field];
      if (value === void 0) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== void 0) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== void 0) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (user.subscriptionStatus !== void 0) {
      values.subscriptionStatus = user.subscriptionStatus;
      updateSet.subscriptionStatus = user.subscriptionStatus;
    }
    if (user.trialEndsAt !== void 0) {
      values.trialEndsAt = user.trialEndsAt;
      updateSet.trialEndsAt = user.trialEndsAt;
    }
    if (user.subscriptionEndsAt !== void 0) {
      values.subscriptionEndsAt = user.subscriptionEndsAt;
      updateSet.subscriptionEndsAt = user.subscriptionEndsAt;
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = /* @__PURE__ */ new Date();
    }
    if (!values.referralCode) {
      values.referralCode = nanoid(10);
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = /* @__PURE__ */ new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return void 0;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserByReferralCode(referralCode) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.referralCode, referralCode)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function updateUserSubscription(userId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}
async function createSearch(search) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(searches).values(search).returning({ id: searches.id });
  return result[0].id;
}
async function updateSearchStatus(searchId, status, completedAt) {
  const db = await getDb();
  if (!db) return;
  await db.update(searches).set({ status, completedAt }).where(eq(searches.id, searchId));
}
async function getUserSearches(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(searches).where(eq(searches.userId, userId)).orderBy(desc(searches.createdAt));
}
async function createDiscountCode(code) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(discountCodes).values(code).returning({ id: discountCodes.id });
  return result[0].id;
}
async function getDiscountCodesBySearch(searchId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(discountCodes).where(eq(discountCodes.searchId, searchId));
}
async function updateDiscountCodeVerification(codeId, verified, verifiedAt) {
  const db = await getDb();
  if (!db) return;
  await db.update(discountCodes).set({ verified, verifiedAt }).where(eq(discountCodes.id, codeId));
}
async function createInboxMessage(message) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inboxMessages).values(message).returning({ id: inboxMessages.id });
  return result[0].id;
}
async function getUserInboxMessages(userId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    message: inboxMessages,
    search: searches,
    code: discountCodes
  }).from(inboxMessages).leftJoin(searches, eq(inboxMessages.searchId, searches.id)).leftJoin(discountCodes, eq(inboxMessages.discountCodeId, discountCodes.id)).where(eq(inboxMessages.userId, userId)).orderBy(desc(inboxMessages.createdAt));
}
async function markMessageAsRead(messageId) {
  const db = await getDb();
  if (!db) return;
  await db.update(inboxMessages).set({ isRead: true, readAt: /* @__PURE__ */ new Date() }).where(eq(inboxMessages.id, messageId));
}
async function getReferralsByReferrer(referrerId) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    referral: referrals,
    referredUser: users
  }).from(referrals).leftJoin(users, eq(referrals.referredUserId, users.id)).where(eq(referrals.referrerId, referrerId)).orderBy(desc(referrals.createdAt));
}
async function createVerificationLog(log2) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(verificationLogs).values(log2).returning({ id: verificationLogs.id });
  return result[0].id;
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}
async function getSearchById(searchId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(searches).where(eq(searches.id, searchId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function checkSearchLimit(userId) {
  const db = await getDb();
  if (!db) {
    return { allowed: true, remaining: 999, limit: 999 };
  }
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.length === 0) {
    return { allowed: false, remaining: 0, limit: 0 };
  }
  const userData = user[0];
  const now = /* @__PURE__ */ new Date();
  const lastReset = new Date(userData.lastSearchResetDate);
  const needsReset = now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
  if (needsReset) {
    await db.update(users).set({
      dailySearchCount: 0,
      lastSearchResetDate: now,
      searchLimitWarningToday: false
      // Reset warning flag for new day
    }).where(eq(users.id, userId));
    const limit2 = userData.subscriptionStatus === "active" ? PAID_DAILY_SEARCH_LIMIT : TRIAL_DAILY_SEARCH_LIMIT;
    return { allowed: true, remaining: limit2, limit: limit2 };
  }
  const limit = userData.subscriptionStatus === "active" ? PAID_DAILY_SEARCH_LIMIT : TRIAL_DAILY_SEARCH_LIMIT;
  const remaining = Math.max(0, limit - userData.dailySearchCount);
  const allowed = userData.dailySearchCount < limit;
  return { allowed, remaining, limit };
}
async function incrementSearchCount(userId) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    dailySearchCount: sql`${users.dailySearchCount} + 1`
  }).where(eq(users.id, userId));
}
var _db, TRIAL_DAILY_SEARCH_LIMIT, PAID_DAILY_SEARCH_LIMIT;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_schema();
    init_env();
    _db = null;
    TRIAL_DAILY_SEARCH_LIMIT = 15;
    PAID_DAILY_SEARCH_LIMIT = 999999;
  }
});

// server/_core/notification.ts
import { TRPCError } from "@trpc/server";
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}
var TITLE_MAX_LENGTH, CONTENT_MAX_LENGTH, trimValue, isNonEmptyString2, buildEndpointUrl, validatePayload;
var init_notification = __esm({
  "server/_core/notification.ts"() {
    "use strict";
    init_env();
    TITLE_MAX_LENGTH = 1200;
    CONTENT_MAX_LENGTH = 2e4;
    trimValue = (value) => value.trim();
    isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
    buildEndpointUrl = (baseUrl) => {
      const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
      return new URL(
        "webdevtoken.v1.WebDevService/SendNotification",
        normalizedBase
      ).toString();
    };
    validatePayload = (input) => {
      if (!isNonEmptyString2(input.title)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification title is required."
        });
      }
      if (!isNonEmptyString2(input.content)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Notification content is required."
        });
      }
      const title = trimValue(input.title);
      const content = trimValue(input.content);
      if (title.length > TITLE_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
        });
      }
      if (content.length > CONTENT_MAX_LENGTH) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
        });
      }
      return { title, content };
    };
  }
});

// server/analytics.ts
import { and as and2, eq as eq2, gte, lte, sql as sql2 } from "drizzle-orm";
async function trackEvent(event) {
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
async function getEmailMetrics(startDate, endDate) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const emailsSent = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
    and2(
      eq2(analyticsEvents.eventType, "email_sent"),
      gte(analyticsEvents.createdAt, startDate),
      lte(analyticsEvents.createdAt, endDate)
    )
  );
  const emailsOpened = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
    and2(
      eq2(analyticsEvents.eventType, "email_opened"),
      gte(analyticsEvents.createdAt, startDate),
      lte(analyticsEvents.createdAt, endDate)
    )
  );
  const emailsClicked = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
    and2(
      eq2(analyticsEvents.eventType, "email_clicked"),
      gte(analyticsEvents.createdAt, startDate),
      lte(analyticsEvents.createdAt, endDate)
    )
  );
  const sent = Number(emailsSent[0]?.count || 0);
  const opened = Number(emailsOpened[0]?.count || 0);
  const clicked = Number(emailsClicked[0]?.count || 0);
  const openRate = sent > 0 ? opened / sent * 100 : 0;
  const clickRate = sent > 0 ? clicked / sent * 100 : 0;
  const clickThroughRate = opened > 0 ? clicked / opened * 100 : 0;
  return {
    sent,
    opened,
    clicked,
    openRate: Math.round(openRate * 10) / 10,
    clickRate: Math.round(clickRate * 10) / 10,
    clickThroughRate: Math.round(clickThroughRate * 10) / 10
  };
}
async function getEmailMetricsByCategory(startDate, endDate) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const categories = ["search_limit_warning", "trial_expiry_warning", "welcome_email"];
  const results = [];
  for (const category of categories) {
    const sent = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
      and2(
        eq2(analyticsEvents.eventType, "email_sent"),
        eq2(analyticsEvents.eventCategory, category),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );
    const opened = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
      and2(
        eq2(analyticsEvents.eventType, "email_opened"),
        eq2(analyticsEvents.eventCategory, category),
        gte(analyticsEvents.createdAt, startDate),
        lte(analyticsEvents.createdAt, endDate)
      )
    );
    const clicked = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
      and2(
        eq2(analyticsEvents.eventType, "email_clicked"),
        eq2(analyticsEvents.eventCategory, category),
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
      openRate: sentCount > 0 ? Math.round(openedCount / sentCount * 1e3) / 10 : 0,
      clickRate: sentCount > 0 ? Math.round(clickedCount / sentCount * 1e3) / 10 : 0
    });
  }
  return results;
}
async function getTrialConversionMetrics(startDate, endDate) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const trialsStarted = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
    and2(
      eq2(analyticsEvents.eventType, "trial_started"),
      gte(analyticsEvents.createdAt, startDate),
      lte(analyticsEvents.createdAt, endDate)
    )
  );
  const trialsConverted = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
    and2(
      eq2(analyticsEvents.eventType, "trial_converted"),
      gte(analyticsEvents.createdAt, startDate),
      lte(analyticsEvents.createdAt, endDate)
    )
  );
  const trialsExpired = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
    and2(
      eq2(analyticsEvents.eventType, "trial_expired"),
      gte(analyticsEvents.createdAt, startDate),
      lte(analyticsEvents.createdAt, endDate)
    )
  );
  const started = Number(trialsStarted[0]?.count || 0);
  const converted = Number(trialsConverted[0]?.count || 0);
  const expired = Number(trialsExpired[0]?.count || 0);
  const conversionRate = started > 0 ? converted / started * 100 : 0;
  return {
    started,
    converted,
    expired,
    conversionRate: Math.round(conversionRate * 10) / 10
  };
}
async function getSubscriptionMetrics(startDate, endDate) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const subscriptionsCreated = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
    and2(
      eq2(analyticsEvents.eventType, "subscription_created"),
      gte(analyticsEvents.createdAt, startDate),
      lte(analyticsEvents.createdAt, endDate)
    )
  );
  const subscriptionsCanceled = await db.select({ count: sql2`count(*)` }).from(analyticsEvents).where(
    and2(
      eq2(analyticsEvents.eventType, "subscription_canceled"),
      gte(analyticsEvents.createdAt, startDate),
      lte(analyticsEvents.createdAt, endDate)
    )
  );
  const created = Number(subscriptionsCreated[0]?.count || 0);
  const canceled = Number(subscriptionsCanceled[0]?.count || 0);
  const churnRate = created > 0 ? canceled / created * 100 : 0;
  return {
    created,
    canceled,
    churnRate: Math.round(churnRate * 10) / 10
  };
}
var init_analytics = __esm({
  "server/analytics.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/emailNotifications.ts
async function sendSearchLimitWarning(userEmail, userName, searchesRemaining) {
  const subject = `\u26A0\uFE0F Only ${searchesRemaining} searches remaining today - CodeFinder`;
  const body = `
Hi ${userName},

You have only ${searchesRemaining} discount code searches remaining for today.

Your daily search limit will reset tomorrow, or you can upgrade to premium for unlimited searches!

**Premium Benefits:**
\u2713 Unlimited discount code searches
\u2713 Priority verification
\u2713 Advanced search filters
\u2713 Search history export
\u2713 Only $9.99/month

Upgrade now to never worry about search limits again!

Best regards,
The CodeFinder Team
  `.trim();
  try {
    await notifyOwner({
      title: `Search Limit Warning for ${userEmail}`,
      content: body
    });
    await trackEvent({
      userId: null,
      eventType: "email_sent",
      eventCategory: "search_limit_warning",
      metadata: JSON.stringify({ email: userEmail, searchesRemaining })
    });
    console.log(`[EmailNotification] Search limit warning sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`[EmailNotification] Failed to send search limit warning:`, error);
    return false;
  }
}
async function sendTrialExpiryWarning(userEmail, userName, expiryDate) {
  const subject = `\u23F0 Your free trial expires in 24 hours - CodeFinder`;
  const body = `
Hi ${userName},

Your 7-day free trial of CodeFinder will expire in 24 hours on ${expiryDate.toLocaleDateString()} at ${expiryDate.toLocaleTimeString()}.

Don't lose access to verified discount codes! Subscribe now to continue saving money.

**What you'll keep with Premium:**
\u2713 Unlimited discount code searches
\u2713 AI-powered code discovery
\u2713 Real browser verification
\u2713 Verified codes delivered to your inbox
\u2713 Search history and favorites
\u2713 Referral rewards program

**Special Offer:** Subscribe now for just $9.99/month with our 7-day money-back guarantee!

Subscribe here: [Your Profile Page]

Questions? Reply to this email and we'll be happy to help!

Best regards,
The CodeFinder Team
  `.trim();
  try {
    await notifyOwner({
      title: `Trial Expiry Warning for ${userEmail}`,
      content: body
    });
    await trackEvent({
      userId: null,
      eventType: "email_sent",
      eventCategory: "trial_expiry_warning",
      metadata: JSON.stringify({ email: userEmail, expiryDate: expiryDate.toISOString() })
    });
    console.log(`[EmailNotification] Trial expiry warning sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error(`[EmailNotification] Failed to send trial expiry warning:`, error);
    return false;
  }
}
var init_emailNotifications = __esm({
  "server/emailNotifications.ts"() {
    "use strict";
    init_notification();
    init_analytics();
  }
});

// server/products.ts
var PRODUCTS, TRIAL_DAYS;
var init_products = __esm({
  "server/products.ts"() {
    "use strict";
    PRODUCTS = {
      MONTHLY_SUBSCRIPTION: {
        name: "Discount Code Finder Pro",
        description: "Unlimited AI-powered discount code searches with automated verification",
        priceInCents: 999,
        // $9.99
        currency: "usd",
        interval: "month"
      }
    };
    TRIAL_DAYS = 7;
  }
});

// server/stripe.ts
import Stripe from "stripe";
async function createStripeCustomer(params) {
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      userId: params.userId
    }
  });
  return customer;
}
async function createSubscriptionCheckout(params) {
  const prices = await stripe.prices.list({
    limit: 1,
    active: true,
    currency: PRODUCTS.MONTHLY_SUBSCRIPTION.currency,
    recurring: { interval: PRODUCTS.MONTHLY_SUBSCRIPTION.interval }
  });
  let priceId;
  if (prices.data.length > 0 && prices.data[0]) {
    priceId = prices.data[0].id;
  } else {
    const product = await stripe.products.create({
      name: PRODUCTS.MONTHLY_SUBSCRIPTION.name,
      description: PRODUCTS.MONTHLY_SUBSCRIPTION.description
    });
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: PRODUCTS.MONTHLY_SUBSCRIPTION.priceInCents,
      currency: PRODUCTS.MONTHLY_SUBSCRIPTION.currency,
      recurring: {
        interval: PRODUCTS.MONTHLY_SUBSCRIPTION.interval
      }
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
        quantity: 1
      }
    ],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: {
        userId: params.userId,
        referralCode: params.referralCode || ""
      }
    },
    metadata: {
      userId: params.userId,
      customer_email: params.email,
      customer_name: params.name || "",
      referralCode: params.referralCode || ""
    },
    allow_promotion_codes: true,
    success_url: `${params.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${params.origin}/subscription/cancel`
  });
  return session;
}
async function cancelSubscription(subscriptionId) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}
async function createCustomerPortalSession(params) {
  const session = await stripe.billingPortal.sessions.create({
    customer: params.customerId,
    return_url: `${params.origin}/profile`
  });
  return session;
}
var stripe;
var init_stripe = __esm({
  "server/stripe.ts"() {
    "use strict";
    init_env();
    init_products();
    if (!ENV.stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    stripe = new Stripe(ENV.stripeSecretKey, {
      apiVersion: "2025-11-17.clover"
    });
  }
});

// server/analyticsCharts.ts
import { and as and3, eq as eq3, gte as gte2, lte as lte2, sql as sql3 } from "drizzle-orm";
async function getDailyEmailMetrics(startDate, endDate) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const dailyData = await db.select({
    date: sql3`DATE(${analyticsEvents.createdAt})`,
    sent: sql3`SUM(CASE WHEN ${analyticsEvents.eventType} = 'email_sent' THEN 1 ELSE 0 END)`,
    opened: sql3`SUM(CASE WHEN ${analyticsEvents.eventType} = 'email_opened' THEN 1 ELSE 0 END)`,
    clicked: sql3`SUM(CASE WHEN ${analyticsEvents.eventType} = 'email_clicked' THEN 1 ELSE 0 END)`
  }).from(analyticsEvents).where(
    and3(
      gte2(analyticsEvents.createdAt, startDate),
      lte2(analyticsEvents.createdAt, endDate)
    )
  ).groupBy(sql3`DATE(${analyticsEvents.createdAt})`).orderBy(sql3`DATE(${analyticsEvents.createdAt})`);
  return dailyData.map((row) => ({
    date: row.date,
    sent: Number(row.sent),
    opened: Number(row.opened),
    clicked: Number(row.clicked),
    openRate: Number(row.sent) > 0 ? Math.round(Number(row.opened) / Number(row.sent) * 1e3) / 10 : 0,
    clickRate: Number(row.sent) > 0 ? Math.round(Number(row.clicked) / Number(row.sent) * 1e3) / 10 : 0
  }));
}
async function getConversionFunnel(startDate, endDate) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const trialsStarted = await db.select({ count: sql3`count(*)` }).from(analyticsEvents).where(
    and3(
      eq3(analyticsEvents.eventType, "trial_started"),
      gte2(analyticsEvents.createdAt, startDate),
      lte2(analyticsEvents.createdAt, endDate)
    )
  );
  const emailsSent = await db.select({ count: sql3`count(*)` }).from(analyticsEvents).where(
    and3(
      eq3(analyticsEvents.eventType, "email_sent"),
      gte2(analyticsEvents.createdAt, startDate),
      lte2(analyticsEvents.createdAt, endDate)
    )
  );
  const emailsOpened = await db.select({ count: sql3`count(*)` }).from(analyticsEvents).where(
    and3(
      eq3(analyticsEvents.eventType, "email_opened"),
      gte2(analyticsEvents.createdAt, startDate),
      lte2(analyticsEvents.createdAt, endDate)
    )
  );
  const emailsClicked = await db.select({ count: sql3`count(*)` }).from(analyticsEvents).where(
    and3(
      eq3(analyticsEvents.eventType, "email_clicked"),
      gte2(analyticsEvents.createdAt, startDate),
      lte2(analyticsEvents.createdAt, endDate)
    )
  );
  const trialsConverted = await db.select({ count: sql3`count(*)` }).from(analyticsEvents).where(
    and3(
      eq3(analyticsEvents.eventType, "trial_converted"),
      gte2(analyticsEvents.createdAt, startDate),
      lte2(analyticsEvents.createdAt, endDate)
    )
  );
  return [
    { stage: "Trials Started", count: Number(trialsStarted[0]?.count || 0), percentage: 100 },
    {
      stage: "Emails Sent",
      count: Number(emailsSent[0]?.count || 0),
      percentage: Number(trialsStarted[0]?.count || 0) > 0 ? Math.round(Number(emailsSent[0]?.count || 0) / Number(trialsStarted[0]?.count || 1) * 100) : 0
    },
    {
      stage: "Emails Opened",
      count: Number(emailsOpened[0]?.count || 0),
      percentage: Number(emailsSent[0]?.count || 0) > 0 ? Math.round(Number(emailsOpened[0]?.count || 0) / Number(emailsSent[0]?.count || 1) * 100) : 0
    },
    {
      stage: "Emails Clicked",
      count: Number(emailsClicked[0]?.count || 0),
      percentage: Number(emailsOpened[0]?.count || 0) > 0 ? Math.round(Number(emailsClicked[0]?.count || 0) / Number(emailsOpened[0]?.count || 1) * 100) : 0
    },
    {
      stage: "Converted to Paid",
      count: Number(trialsConverted[0]?.count || 0),
      percentage: Number(trialsStarted[0]?.count || 0) > 0 ? Math.round(Number(trialsConverted[0]?.count || 0) / Number(trialsStarted[0]?.count || 1) * 100) : 0
    }
  ];
}
async function getDailyTrialConversions(startDate, endDate) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const dailyData = await db.select({
    date: sql3`DATE(${analyticsEvents.createdAt})`,
    started: sql3`SUM(CASE WHEN ${analyticsEvents.eventType} = 'trial_started' THEN 1 ELSE 0 END)`,
    converted: sql3`SUM(CASE WHEN ${analyticsEvents.eventType} = 'trial_converted' THEN 1 ELSE 0 END)`,
    expired: sql3`SUM(CASE WHEN ${analyticsEvents.eventType} = 'trial_expired' THEN 1 ELSE 0 END)`
  }).from(analyticsEvents).where(
    and3(
      gte2(analyticsEvents.createdAt, startDate),
      lte2(analyticsEvents.createdAt, endDate)
    )
  ).groupBy(sql3`DATE(${analyticsEvents.createdAt})`).orderBy(sql3`DATE(${analyticsEvents.createdAt})`);
  return dailyData.map((row) => ({
    date: row.date,
    started: Number(row.started),
    converted: Number(row.converted),
    expired: Number(row.expired),
    conversionRate: Number(row.started) > 0 ? Math.round(Number(row.converted) / Number(row.started) * 1e3) / 10 : 0
  }));
}
var init_analyticsCharts = __esm({
  "server/analyticsCharts.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/cohortAnalysis.ts
import { and as and4, gte as gte3, lte as lte3, sql as sql4 } from "drizzle-orm";
async function getCohortAnalysis() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const cohorts = await db.select({
    cohort: sql4`DATE_FORMAT(${users.createdAt}, '%Y-%m')`.as("cohort"),
    totalUsers: sql4`COUNT(*)`.as("totalUsers"),
    activeSubscriptions: sql4`SUM(CASE WHEN ${users.subscriptionStatus} = 'active' THEN 1 ELSE 0 END)`.as("activeSubscriptions"),
    trialUsers: sql4`SUM(CASE WHEN ${users.subscriptionStatus} = 'trial' THEN 1 ELSE 0 END)`.as("trialUsers"),
    canceledSubscriptions: sql4`SUM(CASE WHEN ${users.subscriptionStatus} = 'canceled' THEN 1 ELSE 0 END)`.as("canceledSubscriptions")
  }).from(users).groupBy(sql4`cohort`).orderBy(sql4`cohort`);
  return cohorts.map((cohort) => {
    const total = Number(cohort.totalUsers);
    const active = Number(cohort.activeSubscriptions);
    const trial = Number(cohort.trialUsers);
    const canceled = Number(cohort.canceledSubscriptions);
    return {
      cohort: cohort.cohort,
      totalUsers: total,
      activeSubscriptions: active,
      trialUsers: trial,
      canceledSubscriptions: canceled,
      retentionRate: total > 0 ? Math.round(active / total * 1e3) / 10 : 0,
      conversionRate: total > 0 ? Math.round(active / total * 1e3) / 10 : 0,
      lifetimeValue: active * 9.99
      // Monthly subscription price
    };
  });
}
async function getCohortRetention(cohortMonth) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const [year, month] = cohortMonth.split("-");
  const cohortStart = new Date(parseInt(year), parseInt(month) - 1, 1);
  const cohortEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
  const cohortUsers = await db.select({
    id: users.id,
    createdAt: users.createdAt,
    subscriptionStatus: users.subscriptionStatus
  }).from(users).where(
    and4(
      gte3(users.createdAt, cohortStart),
      lte3(users.createdAt, cohortEnd)
    )
  );
  const totalCohortSize = cohortUsers.length;
  if (totalCohortSize === 0) {
    return [];
  }
  const now = /* @__PURE__ */ new Date();
  const monthsSinceCohort = Math.floor((now.getTime() - cohortStart.getTime()) / (30 * 24 * 60 * 60 * 1e3));
  const retentionData = [];
  for (let month2 = 0; month2 <= Math.min(monthsSinceCohort, 12); month2++) {
    const activeCount = cohortUsers.filter((u) => u.subscriptionStatus === "active").length;
    const retentionRate = Math.round(activeCount / totalCohortSize * 1e3) / 10;
    retentionData.push({
      month: `Month ${month2}`,
      monthNumber: month2,
      activeUsers: activeCount,
      retentionRate
    });
  }
  return retentionData;
}
async function getLifetimeValueByCohort() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }
  const cohorts = await db.select({
    cohort: sql4`DATE_FORMAT(${users.createdAt}, '%Y-%m')`.as("cohort"),
    totalUsers: sql4`COUNT(*)`.as("totalUsers"),
    activeSubscriptions: sql4`SUM(CASE WHEN ${users.subscriptionStatus} = 'active' THEN 1 ELSE 0 END)`.as("activeSubscriptions"),
    avgMonthsActive: sql4`AVG(DATEDIFF(NOW(), ${users.createdAt}) / 30)`.as("avgMonthsActive")
  }).from(users).groupBy(sql4`cohort`).orderBy(sql4`cohort`);
  return cohorts.map((cohort) => {
    const avgMonths = Number(cohort.avgMonthsActive) || 0;
    const ltv = avgMonths * 9.99;
    return {
      cohort: cohort.cohort,
      totalUsers: Number(cohort.totalUsers),
      activeSubscriptions: Number(cohort.activeSubscriptions),
      avgMonthsActive: Math.round(avgMonths * 10) / 10,
      lifetimeValue: Math.round(ltv * 100) / 100
    };
  });
}
var init_cohortAnalysis = __esm({
  "server/cohortAnalysis.ts"() {
    "use strict";
    init_db();
    init_schema();
  }
});

// server/trialExpiryChecker.ts
var trialExpiryChecker_exports = {};
__export(trialExpiryChecker_exports, {
  checkTrialExpiries: () => checkTrialExpiries,
  startTrialExpiryChecker: () => startTrialExpiryChecker
});
import { and as and5, eq as eq6, lt, gt } from "drizzle-orm";
async function checkTrialExpiries() {
  const db = await getDb();
  if (!db) {
    console.error("[TrialExpiryChecker] Database not available");
    return;
  }
  try {
    const now = /* @__PURE__ */ new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1e3);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1e3);
    const expiringTrials = await db.select().from(users).where(
      and5(
        eq6(users.subscriptionStatus, "trial"),
        gt(users.trialEndsAt, in24Hours),
        lt(users.trialEndsAt, in25Hours),
        eq6(users.trialExpiryWarningSent, false)
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
          await db.update(users).set({ trialExpiryWarningSent: true }).where(eq6(users.id, user.id));
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
function startTrialExpiryChecker() {
  checkTrialExpiries().catch((err) => {
    console.error("[TrialExpiryChecker] Initial check failed:", err);
  });
  setInterval(() => {
    checkTrialExpiries().catch((err) => {
      console.error("[TrialExpiryChecker] Scheduled check failed:", err);
    });
  }, 60 * 60 * 1e3);
  console.log("[TrialExpiryChecker] Started (checking every hour)");
}
var init_trialExpiryChecker = __esm({
  "server/trialExpiryChecker.ts"() {
    "use strict";
    init_db();
    init_schema();
    init_emailNotifications();
  }
});

// server/weeklyReports.ts
var weeklyReports_exports = {};
__export(weeklyReports_exports, {
  generateWeeklyReport: () => generateWeeklyReport,
  scheduleWeeklyReports: () => scheduleWeeklyReports
});
async function generateWeeklyReport() {
  try {
    const endDate = /* @__PURE__ */ new Date();
    const startDate = /* @__PURE__ */ new Date();
    startDate.setDate(startDate.getDate() - 7);
    const emailMetrics = await getEmailMetrics(startDate, endDate);
    const trialMetrics = await getTrialConversionMetrics(startDate, endDate);
    const subscriptionMetrics = await getSubscriptionMetrics(startDate, endDate);
    const dailyEmailData = await getDailyEmailMetrics(startDate, endDate);
    const dailyTrialData = await getDailyTrialConversions(startDate, endDate);
    const cohortData = await getCohortAnalysis();
    const totalEmailsSent = emailMetrics.sent;
    const avgOpenRate = emailMetrics.openRate;
    const avgClickRate = emailMetrics.clickRate;
    const trialConversionRate = trialMetrics.conversionRate;
    const churnRate = subscriptionMetrics.churnRate;
    let bestEmailDay = dailyEmailData[0];
    for (const day of dailyEmailData) {
      if (day.openRate > (bestEmailDay?.openRate || 0)) {
        bestEmailDay = day;
      }
    }
    let bestCohort = cohortData[0];
    for (const cohort of cohortData) {
      if (cohort.retentionRate > (bestCohort?.retentionRate || 0)) {
        bestCohort = cohort;
      }
    }
    const reportContent = `
\u{1F4CA} **Weekly Analytics Report**
${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}

---

**\u{1F4E7} Email Performance**
\u2022 Total Sent: ${totalEmailsSent}
\u2022 Open Rate: ${avgOpenRate}%
\u2022 Click Rate: ${avgClickRate}%
\u2022 Click-Through Rate: ${emailMetrics.clickThroughRate}%
\u2022 Best Day: ${bestEmailDay?.date || "N/A"} (${bestEmailDay?.openRate || 0}% open rate)

---

**\u{1F465} Trial & Conversion Metrics**
\u2022 Trials Started: ${trialMetrics.started}
\u2022 Trials Converted: ${trialMetrics.converted}
\u2022 Trials Expired: ${trialMetrics.expired}
\u2022 Conversion Rate: ${trialConversionRate}%

---

**\u{1F4B0} Subscription Metrics**
\u2022 New Subscriptions: ${subscriptionMetrics.created}
\u2022 Canceled Subscriptions: ${subscriptionMetrics.canceled}
\u2022 Churn Rate: ${churnRate}%

---

**\u{1F3AF} Cohort Insights**
\u2022 Total Cohorts: ${cohortData.length}
\u2022 Best Performing Cohort: ${bestCohort?.cohort || "N/A"} (${bestCohort?.retentionRate || 0}% retention)
\u2022 Avg Lifetime Value: $${bestCohort?.lifetimeValue?.toFixed(2) || "0.00"}

---

**\u{1F4C8} Key Takeaways**
${avgOpenRate > 20 ? "\u2705 Email open rates are healthy (>20%)" : "\u26A0\uFE0F Email open rates need improvement (<20%)"}
${trialConversionRate > 30 ? "\u2705 Trial conversion rate is strong (>30%)" : "\u26A0\uFE0F Trial conversion rate could be improved (<30%)"}
${churnRate < 5 ? "\u2705 Churn rate is low (<5%)" : "\u26A0\uFE0F Churn rate is concerning (>5%)"}

---

View full analytics dashboard for detailed insights.
    `.trim();
    const success = await notifyOwner({
      title: "Weekly Analytics Report",
      content: reportContent
    });
    if (success) {
      console.log("[WeeklyReport] Successfully sent weekly report");
    } else {
      console.error("[WeeklyReport] Failed to send weekly report");
    }
    return { success, reportContent };
  } catch (error) {
    console.error("[WeeklyReport] Error generating report:", error);
    return { success: false, error: String(error) };
  }
}
function scheduleWeeklyReports() {
  const checkAndSendReport = () => {
    const now = /* @__PURE__ */ new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();
    if (dayOfWeek === 1 && hour === 9) {
      console.log("[WeeklyReport] Generating weekly report...");
      generateWeeklyReport();
    }
  };
  setInterval(checkAndSendReport, 60 * 60 * 1e3);
  checkAndSendReport();
  console.log("[WeeklyReport] Scheduler started (runs every Monday at 9 AM)");
}
var init_weeklyReports = __esm({
  "server/weeklyReports.ts"() {
    "use strict";
    init_analytics();
    init_analyticsCharts();
    init_cohortAnalysis();
    init_notification();
  }
});

// server/webhooks.ts
var webhooks_exports = {};
__export(webhooks_exports, {
  handleStripeWebhook: () => handleStripeWebhook
});
async function handleStripeWebhook(req, res) {
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
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true
    });
  }
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        console.log("[Webhook] Checkout completed:", session.id);
        const userId = session.metadata?.userId;
        const referralCode = session.metadata?.referralCode;
        if (userId) {
          const user = await getUserById(parseInt(userId));
          if (user) {
            await updateUserSubscription(user.id, {
              stripeCustomerId: session.customer,
              stripeSubscriptionId: session.subscription,
              subscriptionStatus: "trial"
            });
            if (referralCode) {
              console.log(`[Webhook] Processing referral code: ${referralCode}`);
            }
          }
        }
        break;
      }
      case "customer.subscription.created": {
        const subscription = event.data.object;
        console.log("[Webhook] Subscription created:", subscription.id);
        const userId = subscription.metadata?.userId;
        if (userId) {
          const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1e3) : null;
          await updateUserSubscription(parseInt(userId), {
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: subscription.status === "trialing" ? "trial" : "active",
            trialEndsAt: trialEnd
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        console.log("[Webhook] Subscription updated:", subscription.id);
        const userId = subscription.metadata?.userId;
        if (userId) {
          let status = "active";
          if (subscription.status === "trialing") {
            status = "trial";
          } else if (subscription.status === "canceled" || subscription.cancel_at_period_end) {
            status = "canceled";
          } else if (subscription.status === "active") {
            status = "active";
          } else {
            status = "expired";
          }
          const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1e3) : null;
          await updateUserSubscription(parseInt(userId), {
            subscriptionStatus: status,
            subscriptionEndsAt: currentPeriodEnd
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        console.log("[Webhook] Subscription deleted:", subscription.id);
        const userId = subscription.metadata?.userId;
        if (userId) {
          await updateUserSubscription(parseInt(userId), {
            subscriptionStatus: "expired",
            subscriptionEndsAt: /* @__PURE__ */ new Date()
          });
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;
        console.log("[Webhook] Invoice paid:", invoice.id);
        if (invoice.billing_reason === "subscription_cycle") {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
          const userId = subscription.metadata?.userId;
          const referralCode = subscription.metadata?.referralCode;
          if (userId && referralCode) {
            console.log(`[Webhook] Granting referral reward for code: ${referralCode}`);
          }
        }
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        console.log("[Webhook] Payment failed:", invoice.id);
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
var init_webhooks = __esm({
  "server/webhooks.ts"() {
    "use strict";
    init_stripe();
    init_env();
    init_db();
  }
});

// functions/index.ts
import { onRequest } from "firebase-functions/v2/https";

// server/_core/app.ts
import "dotenv/config";
import express2 from "express";
import * as trpcExpress from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  client;
  oauthService;
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
  app.get("/api/auth/dev-login", async (req, res) => {
    const role = getQueryParam(req, "role") === "admin" ? "admin" : "user";
    const name = getQueryParam(req, "name") || (role === "admin" ? "Admin User" : "Test User");
    const openId = role === "admin" ? "dev-admin-id" : `dev-user-${Date.now()}`;
    const email = role === "admin" ? "admin@example.com" : `user-${Date.now()}@example.com`;
    try {
      await upsertUser({
        openId,
        name,
        email,
        role,
        // Explicitly set role
        loginMethod: "dev-login",
        lastSignedIn: /* @__PURE__ */ new Date(),
        subscriptionStatus: "active"
        // Give active sub for testing
      });
      const sessionToken = await sdk.createSessionToken(openId, {
        name,
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[DevLogin] Failed", error);
      res.status(500).json({ error: "Dev login failed" });
    }
  });
}

// server/routers.ts
import { z as z2 } from "zod";

// server/_core/systemRouter.ts
init_notification();
import { z } from "zod";

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
init_emailNotifications();
init_schema();
import { TRPCError as TRPCError3 } from "@trpc/server";
import { eq as eq5 } from "drizzle-orm";

// server/_core/llm.ts
init_env();
import { GoogleGenerativeAI } from "@google/generative-ai";
async function invokeLLM(params) {
  if (!ENV.forgeApiKey) {
    throw new Error("Gemini API Key is missing. Please check your .env file.");
  }
  const genAI = new GoogleGenerativeAI(ENV.forgeApiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: params.response_format?.type === "json_object" || params.response_format?.type === "json_schema" ? "application/json" : "text/plain"
    }
  });
  let systemInstruction = "";
  const history = [];
  for (const msg of params.messages) {
    if (msg.role === "system") {
      systemInstruction += msg.content + "\n";
    } else if (msg.role === "user") {
      history.push({
        role: "user",
        parts: [{ text: (history.length === 0 ? systemInstruction : "") + msg.content }]
      });
      if (history.length === 1) systemInstruction = "";
    } else if (msg.role === "assistant") {
      history.push({
        role: "model",
        parts: [{ text: msg.content }]
      });
    }
  }
  const lastMsg = history.pop();
  if (!lastMsg || lastMsg.role !== "user") {
    throw new Error("Last message must be from user");
  }
  const chat = model.startChat({
    history
  });
  const result = await chat.sendMessage(lastMsg.parts[0].text);
  const response = result.response;
  const text2 = response.text();
  console.log("[LLM] Raw response:", text2);
  return {
    choices: [
      {
        message: {
          content: text2
        }
      }
    ]
  };
}

// server/codeSearch.ts
import * as fs from "fs";

// server/browserVerification.ts
import puppeteer from "puppeteer";
var browserInstance = null;
async function getBrowser() {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });
  }
  return browserInstance;
}
async function verifyCodeWithBrowser(code, merchantUrl, merchantName) {
  let page = null;
  try {
    console.log(`[BrowserVerification] Starting verification for code ${code} at ${merchantUrl}`);
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    page.setDefaultNavigationTimeout(3e4);
    page.setDefaultTimeout(3e4);
    try {
      await page.goto(merchantUrl, { waitUntil: "networkidle2", timeout: 3e4 });
    } catch (navError) {
      console.log(`[BrowserVerification] Navigation timeout, trying with domcontentloaded`);
      await page.goto(merchantUrl, { waitUntil: "domcontentloaded", timeout: 15e3 });
    }
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    const screenshotPath = `/tmp/verification-${code}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    const codeInputSelectors = [
      'input[name*="coupon"]',
      'input[name*="promo"]',
      'input[name*="discount"]',
      'input[id*="coupon"]',
      'input[id*="promo"]',
      'input[id*="discount"]',
      'input[placeholder*="coupon" i]',
      'input[placeholder*="promo" i]',
      'input[placeholder*="discount" i]',
      'input[type="text"][name*="code"]',
      "#coupon_code",
      "#promo_code",
      "#discount_code"
    ];
    let codeInput = null;
    for (const selector of codeInputSelectors) {
      try {
        codeInput = await page.$(selector);
        if (codeInput) {
          console.log(`[BrowserVerification] Found code input with selector: ${selector}`);
          break;
        }
      } catch (e) {
      }
    }
    if (!codeInput) {
      const revealButtonSelectors = [
        'a:has-text("coupon")',
        'button:has-text("coupon")',
        'a:has-text("promo")',
        'button:has-text("promo")',
        'a:has-text("discount")',
        'button:has-text("discount")'
      ];
      for (const selector of revealButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            await new Promise((resolve) => setTimeout(resolve, 1e3));
            for (const inputSelector of codeInputSelectors) {
              codeInput = await page.$(inputSelector);
              if (codeInput) break;
            }
            if (codeInput) break;
          }
        } catch (e) {
        }
      }
    }
    if (!codeInput) {
      console.log(`[BrowserVerification] No discount code input found on page`);
      return {
        valid: false,
        details: `Could not locate discount code input field on ${merchantName} website. The site may not have a visible coupon field on the main page, or may require adding items to cart first.`
      };
    }
    await codeInput.click();
    await codeInput.type(code, { delay: 100 });
    const applyButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("apply")',
      'button:has-text("submit")',
      'input[type="submit"]',
      'button[name*="apply"]'
    ];
    let applied = false;
    for (const selector of applyButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          applied = true;
          console.log(`[BrowserVerification] Clicked apply button with selector: ${selector}`);
          break;
        }
      } catch (e) {
      }
    }
    if (!applied) {
      await codeInput.press("Enter");
      applied = true;
    }
    await new Promise((resolve) => setTimeout(resolve, 3e3));
    const pageContent = await page.content();
    const pageText = await page.evaluate(() => document.body.innerText);
    const successPatterns = [
      /coupon.*applied/i,
      /promo.*applied/i,
      /discount.*applied/i,
      /code.*applied/i,
      /successfully.*applied/i,
      /saved/i,
      /\$\d+.*off/i,
      /\d+%.*off/i
    ];
    const errorPatterns = [
      /invalid.*code/i,
      /invalid.*coupon/i,
      /expired/i,
      /not.*valid/i,
      /doesn't.*exist/i,
      /does not exist/i,
      /incorrect/i
    ];
    const hasSuccess = successPatterns.some((pattern) => pattern.test(pageText));
    const hasError = errorPatterns.some((pattern) => pattern.test(pageText));
    if (hasSuccess && !hasError) {
      return {
        valid: true,
        details: `Code successfully applied on ${merchantName}. Discount appears to be active and working.`
      };
    } else if (hasError) {
      return {
        valid: false,
        details: `Code was rejected by ${merchantName}. The website indicated the code is invalid or expired.`
      };
    } else {
      return {
        valid: false,
        details: `Code entered on ${merchantName} but verification inconclusive. The site may require items in cart or additional steps to validate the code.`
      };
    }
  } catch (error) {
    console.error(`[BrowserVerification] Error during verification:`, error);
    return {
      valid: false,
      details: `Verification failed due to technical error: ${error instanceof Error ? error.message : "Unknown error"}. The website may be blocking automated access or experiencing issues.`
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}
process.on("exit", () => {
  if (browserInstance) {
    browserInstance.close();
  }
});

// server/codeSearch.ts
function log(message) {
  console.log(message);
  try {
    fs.appendFileSync("debug.log", "[CodeSearch] " + (typeof message === "object" ? JSON.stringify(message) : message) + "\n");
  } catch (e) {
  }
}
async function searchDiscountCodes(query) {
  try {
    log(`Starting search for: ${query}`);
    const searchPrompt = `You are a discount code finder assistant. Search for valid, active discount codes for: "${query}".

Your task:
1. Find discount codes from multiple sources (coupon websites, official merchant sites, promotional pages)
2. Extract the following information for each code:
   - Code: The actual discount code
   - Merchant Name: The company/website offering the discount
   - Merchant URL: The website where the code can be used
   - Description: What the discount is for
   - Discount Amount: The discount percentage or amount (e.g., "20% off", "$10 off")
   - Expiry Date: When the code expires (if available)
   - Source: Where you found this code

Return ONLY a JSON array of discount codes. Each object should have these fields:
{
  "code": "string",
  "merchantName": "string",
  "merchantUrl": "string",
  "description": "string",
  "discountAmount": "string",
  "expiryDate": "YYYY-MM-DD or null",
  "source": "string"
}

Find at least 3-5 different codes from various sources. Focus on recent, active codes.`;
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a discount code search expert. You find valid, active discount codes from multiple sources across the web."
        },
        {
          role: "user",
          content: searchPrompt
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "discount_codes",
          strict: true,
          schema: {
            type: "object",
            properties: {
              codes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string" },
                    merchantName: { type: "string" },
                    merchantUrl: { type: "string" },
                    description: { type: "string" },
                    discountAmount: { type: "string" },
                    expiryDate: { type: ["string", "null"] },
                    source: { type: "string" }
                  },
                  required: ["code", "merchantName", "merchantUrl", "description", "discountAmount", "source"],
                  additionalProperties: false
                }
              }
            },
            required: ["codes"],
            additionalProperties: false
          }
        }
      }
    });
    const content = response.choices[0]?.message?.content;
    log("LLM Response content: " + content);
    if (!content || typeof content !== "string") {
      log("No content in LLM response");
      return [];
    }
    const parsed = JSON.parse(content);
    let codesArray = [];
    if (Array.isArray(parsed)) {
      codesArray = parsed;
    } else if (parsed.codes && Array.isArray(parsed.codes)) {
      codesArray = parsed.codes;
    } else {
      log("Invalid response format: " + JSON.stringify(parsed));
      return [];
    }
    const codes = codesArray.map((item) => ({
      code: item.code,
      merchantName: item.merchantName,
      merchantUrl: item.merchantUrl,
      description: item.description,
      discountAmount: item.discountAmount,
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : void 0,
      source: item.source
    }));
    log(`Found ${codes.length} codes`);
    return codes;
  } catch (error) {
    log("!!! Error searching for codes: " + error);
    return [];
  }
}
async function verifyDiscountCode(code, merchantUrl, merchantName) {
  try {
    log(`Verifying code ${code} for ${merchantName} using browser automation`);
    const result = await verifyCodeWithBrowser(code, merchantUrl, merchantName);
    log(`Browser result for ${code}: ${result.valid ? "VALID" : "INVALID"} - ${result.details}`);
    return result;
  } catch (error) {
    log("Error verifying code: " + error);
    return {
      valid: false,
      details: `Verification error: ${error instanceof Error ? error.message : "Unknown error"}`
    };
  }
}

// server/routers.ts
init_stripe();
init_analytics();
init_analyticsCharts();
init_cohortAnalysis();
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});
var appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    })
  }),
  subscription: router({
    // Get current subscription status
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const now = /* @__PURE__ */ new Date();
      const trialEnded = ctx.user.trialEndsAt ? ctx.user.trialEndsAt < now : false;
      const subscriptionEnded = ctx.user.subscriptionEndsAt ? ctx.user.subscriptionEndsAt < now : false;
      return {
        status: ctx.user.subscriptionStatus,
        trialEndsAt: ctx.user.trialEndsAt,
        subscriptionEndsAt: ctx.user.subscriptionEndsAt,
        isActive: ctx.user.subscriptionStatus === "active" || ctx.user.subscriptionStatus === "trial" && !trialEnded,
        freeMonthsRemaining: ctx.user.freeMonthsRemaining || 0
      };
    }),
    // Create checkout session
    createCheckout: protectedProcedure.input(z2.object({ referralCode: z2.string().optional() })).mutation(async ({ ctx, input }) => {
      let customerId = ctx.user.stripeCustomerId;
      if (!customerId) {
        const customer = await createStripeCustomer({
          email: ctx.user.email || "",
          name: ctx.user.name || void 0,
          userId: ctx.user.id.toString()
        });
        customerId = customer.id;
        await updateUserSubscription(ctx.user.id, {
          stripeCustomerId: customerId
        });
      }
      if (input.referralCode) {
        const referrer = await getUserByReferralCode(input.referralCode);
        if (!referrer) {
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "Invalid referral code"
          });
        }
        if (referrer.id === ctx.user.id) {
          throw new TRPCError3({
            code: "BAD_REQUEST",
            message: "Cannot use your own referral code"
          });
        }
      }
      const session = await createSubscriptionCheckout({
        customerId,
        userId: ctx.user.id.toString(),
        email: ctx.user.email || "",
        name: ctx.user.name || void 0,
        origin: ctx.req.headers.origin || "",
        referralCode: input.referralCode
      });
      return { url: session.url };
    }),
    // Cancel subscription
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.stripeSubscriptionId) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "No active subscription"
        });
      }
      await cancelSubscription(ctx.user.stripeSubscriptionId);
      return { success: true };
    }),
    // Get customer portal URL
    getPortalUrl: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.stripeCustomerId) {
        throw new TRPCError3({
          code: "BAD_REQUEST",
          message: "No Stripe customer found"
        });
      }
      const session = await createCustomerPortalSession({
        customerId: ctx.user.stripeCustomerId,
        origin: ctx.req.headers.origin || ""
      });
      return { url: session.url };
    })
  }),
  search: router({
    // Create a new search
    create: protectedProcedure.input(z2.object({ query: z2.string().min(1) })).mutation(async ({ ctx, input }) => {
      const now = /* @__PURE__ */ new Date();
      const trialEnded = ctx.user.trialEndsAt ? ctx.user.trialEndsAt < now : true;
      const isActive = ctx.user.subscriptionStatus === "active" || ctx.user.subscriptionStatus === "trial" && !trialEnded;
      if (!isActive) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: "Active subscription or trial required"
        });
      }
      const searchLimit = await checkSearchLimit(ctx.user.id);
      if (!searchLimit.allowed) {
        throw new TRPCError3({
          code: "FORBIDDEN",
          message: `Daily search limit reached (${searchLimit.limit} searches per day). ${ctx.user.subscriptionStatus === "trial" ? "Upgrade to get unlimited searches!" : "Please try again tomorrow."}`
        });
      }
      const searchId = await createSearch({
        userId: ctx.user.id,
        query: input.query,
        status: "pending"
      });
      await incrementSearchCount(ctx.user.id);
      const newRemaining = searchLimit.remaining - 1;
      if (newRemaining === 3 && ctx.user.subscriptionStatus === "trial") {
        const user = await getUserById(ctx.user.id);
        if (user && !user.searchLimitWarningToday && user.email) {
          sendSearchLimitWarning(
            user.email,
            user.name || "User",
            newRemaining
          ).catch((err) => {
            console.error(`[Search] Failed to send search limit warning:`, err);
          });
          const db = await getDb();
          if (db) {
            await db.update(users).set({ searchLimitWarningToday: true }).where(eq5(users.id, ctx.user.id));
          }
        }
      }
      processSearch(searchId, input.query, ctx.user.id).catch((err) => {
        console.error(`[Search] Error processing search ${searchId}:`, err);
      });
      return { searchId, remaining: newRemaining };
    }),
    // Get search limit status
    getLimit: protectedProcedure.query(async ({ ctx }) => {
      return await checkSearchLimit(ctx.user.id);
    }),
    // Get user's search history
    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return await getUserSearches(ctx.user.id);
    }),
    // Get search results
    getResults: protectedProcedure.input(z2.object({ searchId: z2.number() })).query(async ({ ctx, input }) => {
      const search = await getSearchById(input.searchId);
      if (!search || search.userId !== ctx.user.id) {
        throw new TRPCError3({ code: "NOT_FOUND" });
      }
      const codes = await getDiscountCodesBySearch(input.searchId);
      return {
        search,
        codes: codes.filter((code) => code.verified)
      };
    })
  }),
  inbox: router({
    // Get inbox messages
    getMessages: protectedProcedure.query(async ({ ctx }) => {
      return await getUserInboxMessages(ctx.user.id);
    }),
    // Mark message as read
    markRead: protectedProcedure.input(z2.object({ messageId: z2.number() })).mutation(async ({ ctx, input }) => {
      await markMessageAsRead(input.messageId);
      return { success: true };
    })
  }),
  referral: router({
    // Get referral info
    getInfo: protectedProcedure.query(async ({ ctx }) => {
      const referrals2 = await getReferralsByReferrer(ctx.user.id);
      return {
        referralCode: ctx.user.referralCode,
        referralLink: `${ctx.req.headers.origin}/?ref=${ctx.user.referralCode}`,
        referrals: referrals2.map((r) => ({
          id: r.referral.id,
          userName: r.referredUser?.name || "Unknown",
          userEmail: r.referredUser?.email || "",
          rewardGranted: r.referral.rewardGranted,
          createdAt: r.referral.createdAt
        })),
        totalReferrals: referrals2.length,
        rewardsEarned: referrals2.filter((r) => r.referral.rewardGranted).length
      };
    })
  }),
  admin: router({
    // Get all users
    getUsers: adminProcedure2.query(async () => {
      return await getAllUsers();
    }),
    // Get system stats
    getStats: adminProcedure2.query(async () => {
      const users2 = await getAllUsers();
      const totalUsers = users2.length;
      const activeSubscriptions = users2.filter((u) => u.subscriptionStatus === "active").length;
      const trialUsers = users2.filter((u) => u.subscriptionStatus === "trial").length;
      const canceledSubscriptions = users2.filter((u) => u.subscriptionStatus === "canceled").length;
      return {
        totalUsers,
        activeSubscriptions,
        trialUsers,
        canceledSubscriptions,
        revenue: activeSubscriptions * 9.99
      };
    })
  }),
  // Analytics router for admin dashboard
  analytics: router({
    // Get overall email metrics
    emailMetrics: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      return await getEmailMetrics(startDate, endDate);
    }),
    // Get email metrics by category
    emailMetricsByCategory: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      return await getEmailMetricsByCategory(startDate, endDate);
    }),
    // Get trial conversion metrics
    trialConversion: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      return await getTrialConversionMetrics(startDate, endDate);
    }),
    // Get subscription metrics
    subscriptionMetrics: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      return await getSubscriptionMetrics(startDate, endDate);
    }),
    // Get daily email metrics for charts
    dailyEmailMetrics: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      return await getDailyEmailMetrics(startDate, endDate);
    }),
    // Get conversion funnel data
    conversionFunnel: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      return await getConversionFunnel(startDate, endDate);
    }),
    // Get daily trial conversions
    dailyTrialConversions: protectedProcedure.input(z2.object({
      startDate: z2.string(),
      endDate: z2.string()
    })).query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
      }
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);
      return await getDailyTrialConversions(startDate, endDate);
    }),
    // Get cohort analysis
    cohortAnalysis: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await getCohortAnalysis();
    }),
    // Get cohort retention curve
    cohortRetention: protectedProcedure.input(z2.object({
      cohortMonth: z2.string()
    })).query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await getCohortRetention(input.cohortMonth);
    }),
    // Get lifetime value by cohort
    lifetimeValueByCohort: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
      }
      return await getLifetimeValueByCohort();
    })
  })
});
async function processSearch(searchId, query, userId) {
  try {
    await updateSearchStatus(searchId, "processing");
    const foundCodes = await searchDiscountCodes(query);
    if (foundCodes.length === 0) {
      await updateSearchStatus(searchId, "completed", /* @__PURE__ */ new Date());
      return;
    }
    for (const codeData of foundCodes) {
      const codeId = await createDiscountCode({
        searchId,
        code: codeData.code,
        merchantName: codeData.merchantName,
        merchantUrl: codeData.merchantUrl || null,
        description: codeData.description || null,
        discountAmount: codeData.discountAmount || null,
        expiryDate: codeData.expiryDate || null,
        source: codeData.source,
        verified: false
      });
      const verification = await verifyDiscountCode(
        codeData.code,
        codeData.merchantUrl || "",
        codeData.merchantName
      );
      await createVerificationLog({
        discountCodeId: codeId,
        success: verification.valid,
        errorMessage: verification.valid ? null : "Code verification failed",
        verificationDetails: verification.details
      });
      if (verification.valid) {
        await updateDiscountCodeVerification(codeId, true, /* @__PURE__ */ new Date());
        await createInboxMessage({
          userId,
          searchId,
          discountCodeId: codeId,
          isRead: false
        });
      }
    }
    await updateSearchStatus(searchId, "completed", /* @__PURE__ */ new Date());
  } catch (error) {
    console.error(`[Search] Error processing search ${searchId}:`, error);
    await updateSearchStatus(searchId, "failed", /* @__PURE__ */ new Date());
  }
}

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs2 from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path2 from "path";
import { createServer as createViteServer } from "vite";

// vite.config.ts
import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
var plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];
var vite_config_default = defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1"
    ],
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/_core/vite.ts
async function setupVite(app, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path2.resolve(import.meta.dirname, "../..", "dist", "public") : path2.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath));
  app.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/_core/app.ts
import { createServer } from "http";
async function createApp() {
  const app = express2();
  const server = createServer(app);
  const { startTrialExpiryChecker: startTrialExpiryChecker2 } = await Promise.resolve().then(() => (init_trialExpiryChecker(), trialExpiryChecker_exports));
  startTrialExpiryChecker2();
  const { scheduleWeeklyReports: scheduleWeeklyReports2 } = await Promise.resolve().then(() => (init_weeklyReports(), weeklyReports_exports));
  scheduleWeeklyReports2();
  const { handleStripeWebhook: handleStripeWebhook2 } = await Promise.resolve().then(() => (init_webhooks(), webhooks_exports));
  app.post("/api/stripe/webhook", express2.raw({ type: "application/json" }), handleStripeWebhook2);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerOAuthRoutes(app);
  app.use(
    "/api/trpc",
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  return { app, server };
}

// functions/index.ts
var appInstance;
var api = onRequest({ region: "us-central1" }, async (req, res) => {
  if (!appInstance) {
    const { app } = await createApp();
    appInstance = app;
  }
  appInstance(req, res);
});
export {
  api
};
