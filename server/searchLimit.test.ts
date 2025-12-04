import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { checkSearchLimit, incrementSearchCount } from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.com" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Search Limit System", () => {
  it("should return correct limit structure for trial users", async () => {
    const trialUser: AuthenticatedUser = {
      id: 999,
      openId: "trial-user",
      email: "trial@test.com",
      name: "Trial User",
      loginMethod: "manus",
      role: "user",
      subscriptionStatus: "trial",
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subscriptionEndsAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      referralCode: "TRIAL123",
      referredBy: null,
      freeMonthsRemaining: 0,
      dailySearchCount: 0,
      lastSearchResetDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createTestContext(trialUser);
    const caller = appRouter.createCaller(ctx);

    const limit = await caller.search.getLimit();

    // Test returns proper structure (user doesn't exist in DB, so returns default)
    expect(limit).toBeDefined();
    expect(limit).toHaveProperty("limit");
    expect(limit).toHaveProperty("remaining");
    expect(limit).toHaveProperty("allowed");
    expect(typeof limit.limit).toBe("number");
    expect(typeof limit.remaining).toBe("number");
    expect(typeof limit.allowed).toBe("boolean");
  });

  it("should enforce search limit for trial users", async () => {
    const trialUser: AuthenticatedUser = {
      id: 998,
      openId: "trial-user-2",
      email: "trial2@test.com",
      name: "Trial User 2",
      loginMethod: "manus",
      role: "user",
      subscriptionStatus: "trial",
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      subscriptionEndsAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      referralCode: "TRIAL456",
      referredBy: null,
      freeMonthsRemaining: 0,
      dailySearchCount: 15, // At limit
      lastSearchResetDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createTestContext(trialUser);
    const caller = appRouter.createCaller(ctx);

    // Should throw error when limit reached
    await expect(
      caller.search.create({ query: "test product" })
    ).rejects.toThrow(/Daily search limit reached/);
  });

  it("should return proper structure for active subscribers", async () => {
    const activeUser: AuthenticatedUser = {
      id: 997,
      openId: "active-user",
      email: "active@test.com",
      name: "Active User",
      loginMethod: "manus",
      role: "user",
      subscriptionStatus: "active",
      trialEndsAt: null,
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      stripeCustomerId: "cus_test",
      stripeSubscriptionId: "sub_test",
      referralCode: "ACTIVE123",
      referredBy: null,
      freeMonthsRemaining: 0,
      dailySearchCount: 100, // High count
      lastSearchResetDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    const ctx = createTestContext(activeUser);
    const caller = appRouter.createCaller(ctx);

    const limit = await caller.search.getLimit();

    // Test returns proper structure
    expect(limit).toBeDefined();
    expect(limit).toHaveProperty("limit");
    expect(limit).toHaveProperty("remaining");
    expect(limit).toHaveProperty("allowed");
  });
});
