CREATE TABLE "analyticsEvents" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"eventType" text NOT NULL,
	"eventCategory" text,
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discountCodes" (
	"id" serial PRIMARY KEY NOT NULL,
	"searchId" integer NOT NULL,
	"code" text NOT NULL,
	"merchantName" text NOT NULL,
	"merchantUrl" text,
	"description" text,
	"discountAmount" text,
	"expiryDate" timestamp,
	"verified" boolean DEFAULT false NOT NULL,
	"verifiedAt" timestamp,
	"source" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inboxMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"searchId" integer NOT NULL,
	"discountCodeId" integer NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"readAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrerId" integer NOT NULL,
	"referredUserId" integer NOT NULL,
	"rewardGranted" boolean DEFAULT false NOT NULL,
	"rewardGrantedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"query" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"completedAt" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" text NOT NULL,
	"name" text,
	"email" text,
	"loginMethod" text,
	"role" text DEFAULT 'user' NOT NULL,
	"stripeCustomerId" text,
	"stripeSubscriptionId" text,
	"subscriptionStatus" text DEFAULT 'trial' NOT NULL,
	"trialEndsAt" timestamp,
	"subscriptionEndsAt" timestamp,
	"referralCode" text,
	"referredBy" integer,
	"freeMonthsRemaining" integer DEFAULT 0 NOT NULL,
	"dailySearchCount" integer DEFAULT 0 NOT NULL,
	"lastSearchResetDate" timestamp DEFAULT now() NOT NULL,
	"searchLimitWarningToday" boolean DEFAULT false NOT NULL,
	"trialExpiryWarningSent" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_referralCode_unique" UNIQUE("referralCode")
);
--> statement-breakpoint
CREATE TABLE "verificationLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"discountCodeId" integer NOT NULL,
	"success" boolean NOT NULL,
	"errorMessage" text,
	"verificationDetails" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "analyticsEvents_userId_idx" ON "analyticsEvents" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "analyticsEvents_eventType_idx" ON "analyticsEvents" USING btree ("eventType");--> statement-breakpoint
CREATE INDEX "analyticsEvents_createdAt_idx" ON "analyticsEvents" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "discountCodes_searchId_idx" ON "discountCodes" USING btree ("searchId");--> statement-breakpoint
CREATE INDEX "discountCodes_verified_idx" ON "discountCodes" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "inboxMessages_userId_idx" ON "inboxMessages" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "inboxMessages_isRead_idx" ON "inboxMessages" USING btree ("isRead");--> statement-breakpoint
CREATE INDEX "referrals_referrerId_idx" ON "referrals" USING btree ("referrerId");--> statement-breakpoint
CREATE INDEX "referrals_referredUserId_idx" ON "referrals" USING btree ("referredUserId");--> statement-breakpoint
CREATE INDEX "searches_userId_idx" ON "searches" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "searches_status_idx" ON "searches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "users_referredBy_idx" ON "users" USING btree ("referredBy");--> statement-breakpoint
CREATE INDEX "users_stripeCustomer_idx" ON "users" USING btree ("stripeCustomerId");--> statement-breakpoint
CREATE INDEX "verificationLogs_discountCodeId_idx" ON "verificationLogs" USING btree ("discountCodeId");