import { pgTable, serial, text, timestamp, boolean, integer, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  loginMethod: text("loginMethod"),
  role: text("role").default("user").notNull(), // "user" | "admin"

  // Subscription fields
  stripeCustomerId: text("stripeCustomerId"),
  stripeSubscriptionId: text("stripeSubscriptionId"),
  subscriptionStatus: text("subscriptionStatus").default("trial").notNull(), // "trial" | "active" | "canceled" | "expired"
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  referredByIdx: index("users_referredBy_idx").on(table.referredBy),
  stripeCustomerIdx: index("users_stripeCustomer_idx").on(table.stripeCustomerId),
}));
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Analytics events for tracking email engagement and user actions
 */
export const analyticsEvents = pgTable("analyticsEvents", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  eventType: text("eventType").notNull(),
  eventCategory: text("eventCategory"), // e.g., "search_limit_warning", "trial_expiry_warning"
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("analyticsEvents_userId_idx").on(table.userId),
  eventTypeIdx: index("analyticsEvents_eventType_idx").on(table.eventType),
  createdAtIdx: index("analyticsEvents_createdAt_idx").on(table.createdAt),
}));

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Searches performed by users
 */
export const searches = pgTable("searches", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  query: text("query").notNull(),
  status: text("status").default("pending").notNull(), // "pending" | "processing" | "completed" | "failed"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("searches_userId_idx").on(table.userId),
  statusIdx: index("searches_status_idx").on(table.status),
}));

export type Search = typeof searches.$inferSelect;
export type InsertSearch = typeof searches.$inferInsert;

/**
 * Discount codes found and verified by the system
 */
export const discountCodes = pgTable("discountCodes", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  searchIdIdx: index("discountCodes_searchId_idx").on(table.searchId),
  verifiedIdx: index("discountCodes_verified_idx").on(table.verified),
}));

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = typeof discountCodes.$inferInsert;

/**
 * Inbox messages for delivering verified codes to users
 */
export const inboxMessages = pgTable("inboxMessages", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  searchId: integer("searchId").notNull(),
  discountCodeId: integer("discountCodeId").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
}, (table) => ({
  userIdIdx: index("inboxMessages_userId_idx").on(table.userId),
  isReadIdx: index("inboxMessages_isRead_idx").on(table.isRead),
}));

export type InboxMessage = typeof inboxMessages.$inferSelect;
export type InsertInboxMessage = typeof inboxMessages.$inferInsert;

/**
 * Referral tracking for reward system
 */
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrerId").notNull(),
  referredUserId: integer("referredUserId").notNull(),
  rewardGranted: boolean("rewardGranted").default(false).notNull(),
  rewardGrantedAt: timestamp("rewardGrantedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  referrerIdIdx: index("referrals_referrerId_idx").on(table.referrerId),
  referredUserIdIdx: index("referrals_referredUserId_idx").on(table.referredUserId),
}));

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Verification logs for tracking code verification attempts
 */
export const verificationLogs = pgTable("verificationLogs", {
  id: serial("id").primaryKey(),
  discountCodeId: integer("discountCodeId").notNull(),
  success: boolean("success").notNull(),
  errorMessage: text("errorMessage"),
  verificationDetails: text("verificationDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  discountCodeIdIdx: index("verificationLogs_discountCodeId_idx").on(table.discountCodeId),
}));

export type VerificationLog = typeof verificationLogs.$inferSelect;
export type InsertVerificationLog = typeof verificationLogs.$inferInsert;
