import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getUserByReferralCode,
  createSearch,
  updateSearchStatus,
  getUserSearches,
  createDiscountCode,
  getDiscountCodesBySearch,
  updateDiscountCodeVerification,
  createInboxMessage,
  getUserInboxMessages,
  markMessageAsRead,
  createReferral,
  getReferralsByReferrer,
  updateReferralReward,
  createVerificationLog,
  getAllUsers,
  updateUserSubscription,
  getSearchById,
  checkSearchLimit,
  incrementSearchCount,
  getUserById,
  getDb,
} from "./db";
import { sendSearchLimitWarning } from "./emailNotifications";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { searchDiscountCodes, verifyDiscountCode } from "./codeSearch";
import {
  createStripeCustomer,
  createSubscriptionCheckout,
  cancelSubscription,
  createCustomerPortalSession,
} from "./stripe";
import { TRIAL_DAYS, REFERRAL_FREE_MONTHS } from "./products";
import { 
  getEmailMetrics, 
  getEmailMetricsByCategory, 
  getTrialConversionMetrics,
  getSubscriptionMetrics 
} from "./analytics";
import {
  getDailyEmailMetrics,
  getConversionFunnel,
  getDailyTrialConversions
} from "./analyticsCharts";
import {
  getCohortAnalysis,
  getCohortRetention,
  getLifetimeValueByCohort
} from "./cohortAnalysis";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  subscription: router({
    // Get current subscription status
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const now = new Date();
      const trialEnded = ctx.user.trialEndsAt ? ctx.user.trialEndsAt < now : false;
      const subscriptionEnded = ctx.user.subscriptionEndsAt ? ctx.user.subscriptionEndsAt < now : false;

      return {
        status: ctx.user.subscriptionStatus,
        trialEndsAt: ctx.user.trialEndsAt,
        subscriptionEndsAt: ctx.user.subscriptionEndsAt,
        isActive: ctx.user.subscriptionStatus === "active" || 
                  (ctx.user.subscriptionStatus === "trial" && !trialEnded),
        freeMonthsRemaining: ctx.user.freeMonthsRemaining || 0,
      };
    }),

    // Create checkout session
    createCheckout: protectedProcedure
      .input(z.object({ referralCode: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        // Create Stripe customer if doesn't exist
        let customerId = ctx.user.stripeCustomerId;
        
        if (!customerId) {
          const customer = await createStripeCustomer({
            email: ctx.user.email || "",
            name: ctx.user.name || undefined,
            userId: ctx.user.id.toString(),
          });
          customerId = customer.id;
          
          await updateUserSubscription(ctx.user.id, {
            stripeCustomerId: customerId,
          });
        }

        // Validate referral code if provided
        if (input.referralCode) {
          const referrer = await getUserByReferralCode(input.referralCode);
          if (!referrer) {
            throw new TRPCError({ 
              code: "BAD_REQUEST", 
              message: "Invalid referral code" 
            });
          }
          if (referrer.id === ctx.user.id) {
            throw new TRPCError({ 
              code: "BAD_REQUEST", 
              message: "Cannot use your own referral code" 
            });
          }
        }

        const session = await createSubscriptionCheckout({
          customerId,
          userId: ctx.user.id.toString(),
          email: ctx.user.email || "",
          name: ctx.user.name || undefined,
          origin: ctx.req.headers.origin || "",
          referralCode: input.referralCode,
        });

        return { url: session.url };
      }),

    // Cancel subscription
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user.stripeSubscriptionId) {
        throw new TRPCError({ 
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
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "No Stripe customer found" 
        });
      }

      const session = await createCustomerPortalSession({
        customerId: ctx.user.stripeCustomerId,
        origin: ctx.req.headers.origin || "",
      });

      return { url: session.url };
    }),
  }),

  search: router({
    // Create a new search
    create: protectedProcedure
      .input(z.object({ query: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        // Check subscription status
        const now = new Date();
        const trialEnded = ctx.user.trialEndsAt ? ctx.user.trialEndsAt < now : true;
        const isActive = ctx.user.subscriptionStatus === "active" || 
                        (ctx.user.subscriptionStatus === "trial" && !trialEnded);

        if (!isActive) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: "Active subscription or trial required" 
          });
        }

        // Check daily search limit
        const searchLimit = await checkSearchLimit(ctx.user.id);
        if (!searchLimit.allowed) {
          throw new TRPCError({ 
            code: "FORBIDDEN", 
            message: `Daily search limit reached (${searchLimit.limit} searches per day). ${ctx.user.subscriptionStatus === "trial" ? "Upgrade to get unlimited searches!" : "Please try again tomorrow."}` 
          });
        }

        // Create search record
        const searchId = await createSearch({
          userId: ctx.user.id,
          query: input.query,
          status: "pending",
        });

        // Increment search count
        await incrementSearchCount(ctx.user.id);

        const newRemaining = searchLimit.remaining - 1;

        // Send warning email if user has exactly 3 searches remaining (after this search)
        if (newRemaining === 3 && ctx.user.subscriptionStatus === "trial") {
          // Check if warning already sent today
          const user = await getUserById(ctx.user.id);
          if (user && !user.searchLimitWarningToday && user.email) {
            sendSearchLimitWarning(
              user.email,
              user.name || "User",
              newRemaining
            ).catch(err => {
              console.error(`[Search] Failed to send search limit warning:`, err);
            });

            // Mark warning as sent for today
            const db = await getDb();
            if (db) {
              await db.update(users)
                .set({ searchLimitWarningToday: true })
                .where(eq(users.id, ctx.user.id));
            }
          }
        }

        // Start search process asynchronously
        processSearch(searchId, input.query, ctx.user.id).catch(err => {
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
    getResults: protectedProcedure
      .input(z.object({ searchId: z.number() }))
      .query(async ({ ctx, input }) => {
        const search = await getSearchById(input.searchId);
        
        if (!search || search.userId !== ctx.user.id) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const codes = await getDiscountCodesBySearch(input.searchId);
        
        return {
          search,
          codes: codes.filter(code => code.verified),
        };
      }),
  }),

  inbox: router({
    // Get inbox messages
    getMessages: protectedProcedure.query(async ({ ctx }) => {
      return await getUserInboxMessages(ctx.user.id);
    }),

    // Mark message as read
    markRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markMessageAsRead(input.messageId);
        return { success: true };
      }),
  }),

  referral: router({
    // Get referral info
    getInfo: protectedProcedure.query(async ({ ctx }) => {
      const referrals = await getReferralsByReferrer(ctx.user.id);
      
      return {
        referralCode: ctx.user.referralCode,
        referralLink: `${ctx.req.headers.origin}/?ref=${ctx.user.referralCode}`,
        referrals: referrals.map(r => ({
          id: r.referral.id,
          userName: r.referredUser?.name || "Unknown",
          userEmail: r.referredUser?.email || "",
          rewardGranted: r.referral.rewardGranted,
          createdAt: r.referral.createdAt,
        })),
        totalReferrals: referrals.length,
        rewardsEarned: referrals.filter(r => r.referral.rewardGranted).length,
      };
    }),
  }),

  admin: router({
    // Get all users
    getUsers: adminProcedure.query(async () => {
      return await getAllUsers();
    }),

    // Get system stats
    getStats: adminProcedure.query(async () => {
      const users = await getAllUsers();
      
      const totalUsers = users.length;
      const activeSubscriptions = users.filter(u => u.subscriptionStatus === "active").length;
      const trialUsers = users.filter(u => u.subscriptionStatus === "trial").length;
      const canceledSubscriptions = users.filter(u => u.subscriptionStatus === "canceled").length;

      return {
        totalUsers,
        activeSubscriptions,
        trialUsers,
        canceledSubscriptions,
        revenue: activeSubscriptions * 9.99,
      };
    }),
  }),

  // Analytics router for admin dashboard
  analytics: router({
    // Get overall email metrics
    emailMetrics: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        return await getEmailMetrics(startDate, endDate);
      }),

    // Get email metrics by category
    emailMetricsByCategory: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        return await getEmailMetricsByCategory(startDate, endDate);
      }),

    // Get trial conversion metrics
    trialConversion: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        return await getTrialConversionMetrics(startDate, endDate);
      }),

    // Get subscription metrics
    subscriptionMetrics: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        return await getSubscriptionMetrics(startDate, endDate);
      }),

    // Get daily email metrics for charts
    dailyEmailMetrics: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        return await getDailyEmailMetrics(startDate, endDate);
      }),

    // Get conversion funnel data
    conversionFunnel: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        return await getConversionFunnel(startDate, endDate);
      }),

    // Get daily trial conversions
    dailyTrialConversions: protectedProcedure
      .input(z.object({
        startDate: z.string(),
        endDate: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);

        return await getDailyTrialConversions(startDate, endDate);
      }),

    // Get cohort analysis
    cohortAnalysis: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        return await getCohortAnalysis();
      }),

    // Get cohort retention curve
    cohortRetention: protectedProcedure
      .input(z.object({
        cohortMonth: z.string(),
      }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        return await getCohortRetention(input.cohortMonth);
      }),

    // Get lifetime value by cohort
    lifetimeValueByCohort: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
        }

        return await getLifetimeValueByCohort();
      }),
  }),
});

export type AppRouter = typeof appRouter;

/**
 * Process a search request asynchronously
 */
async function processSearch(searchId: number, query: string, userId: number) {
  try {
    await updateSearchStatus(searchId, "processing");

    // Search for codes
    const foundCodes = await searchDiscountCodes(query);
    
    if (foundCodes.length === 0) {
      await updateSearchStatus(searchId, "completed", new Date());
      return;
    }

    // Save and verify each code
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
        verified: false,
      });

      // Verify the code
      const verification = await verifyDiscountCode(
        codeData.code,
        codeData.merchantUrl || "",
        codeData.merchantName
      );

      // Log verification
      await createVerificationLog({
        discountCodeId: codeId,
        success: verification.valid,
        errorMessage: verification.valid ? null : "Code verification failed",
        verificationDetails: verification.details,
      });

      // Update code verification status
      if (verification.valid) {
        await updateDiscountCodeVerification(codeId, true, new Date());

        // Create inbox message for verified code
        await createInboxMessage({
          userId,
          searchId,
          discountCodeId: codeId,
          isRead: false,
        });
      }
    }

    await updateSearchStatus(searchId, "completed", new Date());
  } catch (error) {
    console.error(`[Search] Error processing search ${searchId}:`, error);
    await updateSearchStatus(searchId, "failed", new Date());
  }
}
