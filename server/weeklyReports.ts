import { getEmailMetrics, getTrialConversionMetrics, getSubscriptionMetrics } from "./analytics";
import { getDailyEmailMetrics, getDailyTrialConversions } from "./analyticsCharts";
import { getCohortAnalysis } from "./cohortAnalysis";
import { notifyOwner } from "./_core/notification";

/**
 * Generate and send weekly analytics report to admins
 */
export async function generateWeeklyReport() {
  try {
    // Calculate date range (last 7 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    // Fetch all metrics
    const emailMetrics = await getEmailMetrics(startDate, endDate);
    const trialMetrics = await getTrialConversionMetrics(startDate, endDate);
    const subscriptionMetrics = await getSubscriptionMetrics(startDate, endDate);
    const dailyEmailData = await getDailyEmailMetrics(startDate, endDate);
    const dailyTrialData = await getDailyTrialConversions(startDate, endDate);
    const cohortData = await getCohortAnalysis();

    // Calculate trends
    const totalEmailsSent = emailMetrics.sent;
    const avgOpenRate = emailMetrics.openRate;
    const avgClickRate = emailMetrics.clickRate;
    const trialConversionRate = trialMetrics.conversionRate;
    const churnRate = subscriptionMetrics.churnRate;

    // Find best performing day for emails
    let bestEmailDay = dailyEmailData[0];
    for (const day of dailyEmailData) {
      if (day.openRate > (bestEmailDay?.openRate || 0)) {
        bestEmailDay = day;
      }
    }

    // Find best performing cohort
    let bestCohort = cohortData[0];
    for (const cohort of cohortData) {
      if (cohort.retentionRate > (bestCohort?.retentionRate || 0)) {
        bestCohort = cohort;
      }
    }

    // Generate report content
    const reportContent = `
📊 **Weekly Analytics Report**
${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}

---

**📧 Email Performance**
• Total Sent: ${totalEmailsSent}
• Open Rate: ${avgOpenRate}%
• Click Rate: ${avgClickRate}%
• Click-Through Rate: ${emailMetrics.clickThroughRate}%
• Best Day: ${bestEmailDay?.date || 'N/A'} (${bestEmailDay?.openRate || 0}% open rate)

---

**👥 Trial & Conversion Metrics**
• Trials Started: ${trialMetrics.started}
• Trials Converted: ${trialMetrics.converted}
• Trials Expired: ${trialMetrics.expired}
• Conversion Rate: ${trialConversionRate}%

---

**💰 Subscription Metrics**
• New Subscriptions: ${subscriptionMetrics.created}
• Canceled Subscriptions: ${subscriptionMetrics.canceled}
• Churn Rate: ${churnRate}%

---

**🎯 Cohort Insights**
• Total Cohorts: ${cohortData.length}
• Best Performing Cohort: ${bestCohort?.cohort || 'N/A'} (${bestCohort?.retentionRate || 0}% retention)
• Avg Lifetime Value: $${bestCohort?.lifetimeValue?.toFixed(2) || '0.00'}

---

**📈 Key Takeaways**
${avgOpenRate > 20 ? '✅ Email open rates are healthy (>20%)' : '⚠️ Email open rates need improvement (<20%)'}
${trialConversionRate > 30 ? '✅ Trial conversion rate is strong (>30%)' : '⚠️ Trial conversion rate could be improved (<30%)'}
${churnRate < 5 ? '✅ Churn rate is low (<5%)' : '⚠️ Churn rate is concerning (>5%)'}

---

View full analytics dashboard for detailed insights.
    `.trim();

    // Send notification to owner
    const success = await notifyOwner({
      title: "Weekly Analytics Report",
      content: reportContent,
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

/**
 * Schedule weekly report generation
 * Runs every Monday at 9 AM
 */
export function scheduleWeeklyReports() {
  const checkAndSendReport = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
    const hour = now.getHours();

    // Run on Monday (1) at 9 AM
    if (dayOfWeek === 1 && hour === 9) {
      console.log("[WeeklyReport] Generating weekly report...");
      generateWeeklyReport();
    }
  };

  // Check every hour
  setInterval(checkAndSendReport, 60 * 60 * 1000);
  
  // Also check immediately on startup
  checkAndSendReport();

  console.log("[WeeklyReport] Scheduler started (runs every Monday at 9 AM)");
}
