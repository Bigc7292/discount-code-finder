import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Subscription fields
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  subscriptionStatus: mysqlEnum("subscriptionStatus", ["trial", "active", "canceled", "expired"]).default("trial").notNull(),
  trialEndsAt: timestamp("trialEndsAt"),
  subscriptionEndsAt: timestamp("subscriptionEndsAt"),
  
  // Referral fields
  referralCode: varchar("referralCode", { length: 32 }).unique(),
  referredBy: int("referredBy"),
  freeMonthsRemaining: int("freeMonthsRemaining").default(0).notNull(),
  
  // Daily search limit tracking
  dailySearchCount: int("dailySearchCount").default(0).notNull(),
  lastSearchResetDate: timestamp("lastSearchResetDate").defaultNow().notNull(),
  
  // Notification tracking
  searchLimitWarningToday: boolean("searchLimitWarningToday").default(false).notNull(),
  trialExpiryWarningSent: boolean("trialExpiryWarningSent").default(false).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  referredByIdx: index("referredBy_idx").on(table.referredBy),
  stripeCustomerIdx: index("stripeCustomer_idx").on(table.stripeCustomerId),
}));
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Analytics events for tracking email engagement and user actions
 */
export const analyticsEvents = mysqlTable("analyticsEvents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  eventType: mysqlEnum("eventType", [
    "email_sent",
    "email_opened",
    "email_clicked",
    "trial_started",
    "trial_converted",
    "trial_expired",
    "subscription_created",
    "subscription_canceled"
  ]).notNull(),
  eventCategory: varchar("eventCategory", { length: 64 }), // e.g., "search_limit_warning", "trial_expiry_warning"
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  eventTypeIdx: index("eventType_idx").on(table.eventType),
  createdAtIdx: index("createdAt_idx").on(table.createdAt),
}));

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;

/**
 * Searches performed by users
 */
export const searches = mysqlTable("searches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  query: text("query").notNull(),
  status: mysqlEnum("status", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Search = typeof searches.$inferSelect;
export type InsertSearch = typeof searches.$inferInsert;

/**
 * Discount codes found and verified by the system
 */
export const discountCodes = mysqlTable("discountCodes", {
  id: int("id").autoincrement().primaryKey(),
  searchId: int("searchId").notNull(),
  code: varchar("code", { length: 255 }).notNull(),
  merchantName: varchar("merchantName", { length: 255 }).notNull(),
  merchantUrl: text("merchantUrl"),
  description: text("description"),
  discountAmount: varchar("discountAmount", { length: 100 }),
  expiryDate: timestamp("expiryDate"),
  verified: boolean("verified").default(false).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  source: varchar("source", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  searchIdIdx: index("searchId_idx").on(table.searchId),
  verifiedIdx: index("verified_idx").on(table.verified),
}));

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = typeof discountCodes.$inferInsert;

/**
 * Inbox messages for delivering verified codes to users
 */
export const inboxMessages = mysqlTable("inboxMessages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  searchId: int("searchId").notNull(),
  discountCodeId: int("discountCodeId").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  readAt: timestamp("readAt"),
}, (table) => ({
  userIdIdx: index("userId_idx").on(table.userId),
  isReadIdx: index("isRead_idx").on(table.isRead),
}));

export type InboxMessage = typeof inboxMessages.$inferSelect;
export type InsertInboxMessage = typeof inboxMessages.$inferInsert;

/**
 * Referral tracking for reward system
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  referrerId: int("referrerId").notNull(),
  referredUserId: int("referredUserId").notNull(),
  rewardGranted: boolean("rewardGranted").default(false).notNull(),
  rewardGrantedAt: timestamp("rewardGrantedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  referrerIdIdx: index("referrerId_idx").on(table.referrerId),
  referredUserIdIdx: index("referredUserId_idx").on(table.referredUserId),
}));

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Verification logs for tracking code verification attempts
 */
export const verificationLogs = mysqlTable("verificationLogs", {
  id: int("id").autoincrement().primaryKey(),
  discountCodeId: int("discountCodeId").notNull(),
  success: boolean("success").notNull(),
  errorMessage: text("errorMessage"),
  verificationDetails: text("verificationDetails"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  discountCodeIdIdx: index("discountCodeId_idx").on(table.discountCodeId),
}));

export type VerificationLog = typeof verificationLogs.$inferSelect;
export type InsertVerificationLog = typeof verificationLogs.$inferInsert;
