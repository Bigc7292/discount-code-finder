import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(overrides?: Partial<AuthenticatedUser>): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: "trial",
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    subscriptionEndsAt: null,
    referralCode: "TEST123",
    referredBy: null,
    freeMonthsRemaining: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {
        origin: "https://example.com",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("Subscription Management", () => {
  it("should return subscription status for trial user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.subscription.getStatus();

    expect(status.status).toBe("trial");
    expect(status.isActive).toBe(true);
    expect(status.trialEndsAt).toBeDefined();
  });

  it("should return subscription status for active user", async () => {
    const ctx = createAuthContext({
      subscriptionStatus: "active",
      trialEndsAt: null,
      subscriptionEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    const caller = appRouter.createCaller(ctx);

    const status = await caller.subscription.getStatus();

    expect(status.status).toBe("active");
    expect(status.isActive).toBe(true);
  });

  it("should return inactive status for expired trial", async () => {
    const ctx = createAuthContext({
      subscriptionStatus: "trial",
      trialEndsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    });
    const caller = appRouter.createCaller(ctx);

    const status = await caller.subscription.getStatus();

    expect(status.status).toBe("trial");
    expect(status.isActive).toBe(false);
  });
});

describe("Referral System", () => {
  it("should return referral info for user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const info = await caller.referral.getInfo();

    expect(info.referralCode).toBe("TEST123");
    expect(info.referralLink).toContain("TEST123");
    expect(info.totalReferrals).toBeGreaterThanOrEqual(0);
  });
});

describe("Admin Access", () => {
  it("should allow admin to access stats", async () => {
    const ctx = createAuthContext({ role: "admin" });
    const caller = appRouter.createCaller(ctx);

    const stats = await caller.admin.getStats();

    expect(stats).toBeDefined();
    expect(stats.totalUsers).toBeGreaterThanOrEqual(0);
    expect(stats.activeSubscriptions).toBeGreaterThanOrEqual(0);
  });

  it("should deny non-admin access to stats", async () => {
    const ctx = createAuthContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);

    await expect(caller.admin.getStats()).rejects.toThrow("Admin access required");
  });
});

describe("Authentication", () => {
  it("should return user info for authenticated user", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.email).toBe("test@example.com");
  });

  it("should return null for unauthenticated user", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeNull();
  });
});
