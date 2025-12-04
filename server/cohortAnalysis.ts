import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";

/**
 * Get cohort data grouped by signup month
 */
export async function getCohortAnalysis() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all users grouped by signup month
  const cohorts = await db
    .select({
      cohort: sql<string>`DATE_FORMAT(${users.createdAt}, '%Y-%m')`.as('cohort'),
      totalUsers: sql<number>`COUNT(*)`.as('totalUsers'),
      activeSubscriptions: sql<number>`SUM(CASE WHEN ${users.subscriptionStatus} = 'active' THEN 1 ELSE 0 END)`.as('activeSubscriptions'),
      trialUsers: sql<number>`SUM(CASE WHEN ${users.subscriptionStatus} = 'trial' THEN 1 ELSE 0 END)`.as('trialUsers'),
      canceledSubscriptions: sql<number>`SUM(CASE WHEN ${users.subscriptionStatus} = 'canceled' THEN 1 ELSE 0 END)`.as('canceledSubscriptions'),
    })
    .from(users)
    .groupBy(sql`cohort`)
    .orderBy(sql`cohort`);

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
      retentionRate: total > 0 ? Math.round((active / total) * 1000) / 10 : 0,
      conversionRate: total > 0 ? Math.round((active / total) * 1000) / 10 : 0,
      lifetimeValue: active * 9.99, // Monthly subscription price
    };
  });
}

/**
 * Get retention curve for a specific cohort
 */
export async function getCohortRetention(cohortMonth: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Parse cohort month
  const [year, month] = cohortMonth.split('-');
  const cohortStart = new Date(parseInt(year), parseInt(month) - 1, 1);
  const cohortEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

  // Get users from this cohort
  const cohortUsers = await db
    .select({
      id: users.id,
      createdAt: users.createdAt,
      subscriptionStatus: users.subscriptionStatus,
    })
    .from(users)
    .where(
      and(
        gte(users.createdAt, cohortStart),
        lte(users.createdAt, cohortEnd)
      )
    );

  const totalCohortSize = cohortUsers.length;
  
  if (totalCohortSize === 0) {
    return [];
  }

  // Calculate retention for each month since cohort start
  const now = new Date();
  const monthsSinceCohort = Math.floor((now.getTime() - cohortStart.getTime()) / (30 * 24 * 60 * 60 * 1000));
  
  const retentionData = [];
  
  for (let month = 0; month <= Math.min(monthsSinceCohort, 12); month++) {
    const activeCount = cohortUsers.filter(u => u.subscriptionStatus === 'active').length;
    const retentionRate = Math.round((activeCount / totalCohortSize) * 1000) / 10;
    
    retentionData.push({
      month: `Month ${month}`,
      monthNumber: month,
      activeUsers: activeCount,
      retentionRate,
    });
  }

  return retentionData;
}

/**
 * Get lifetime value analysis by cohort
 */
export async function getLifetimeValueByCohort() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const cohorts = await db
    .select({
      cohort: sql<string>`DATE_FORMAT(${users.createdAt}, '%Y-%m')`.as('cohort'),
      totalUsers: sql<number>`COUNT(*)`.as('totalUsers'),
      activeSubscriptions: sql<number>`SUM(CASE WHEN ${users.subscriptionStatus} = 'active' THEN 1 ELSE 0 END)`.as('activeSubscriptions'),
      avgMonthsActive: sql<number>`AVG(DATEDIFF(NOW(), ${users.createdAt}) / 30)`.as('avgMonthsActive'),
    })
    .from(users)
    .groupBy(sql`cohort`)
    .orderBy(sql`cohort`);

  return cohorts.map((cohort) => {
    const avgMonths = Number(cohort.avgMonthsActive) || 0;
    const ltv = avgMonths * 9.99; // Assuming $9.99/month subscription
    
    return {
      cohort: cohort.cohort,
      totalUsers: Number(cohort.totalUsers),
      activeSubscriptions: Number(cohort.activeSubscriptions),
      avgMonthsActive: Math.round(avgMonths * 10) / 10,
      lifetimeValue: Math.round(ltv * 100) / 100,
    };
  });
}
