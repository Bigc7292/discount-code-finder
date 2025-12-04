import { describe, expect, it } from "vitest";
import { trackEvent, getEmailMetrics, getTrialConversionMetrics, getSubscriptionMetrics } from "./analytics";

describe("Analytics System", () => {
  it("should track events without errors", async () => {
    await trackEvent({
      userId: 1,
      eventType: "email_sent",
      eventCategory: "welcome_email",
      metadata: JSON.stringify({ test: true }),
    });

    // Should complete without throwing
    expect(true).toBe(true);
  });

  it("should get email metrics for date range", async () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-12-31");

    const metrics = await getEmailMetrics(startDate, endDate);

    expect(metrics).toHaveProperty("sent");
    expect(metrics).toHaveProperty("opened");
    expect(metrics).toHaveProperty("clicked");
    expect(metrics).toHaveProperty("openRate");
    expect(metrics).toHaveProperty("clickRate");
    expect(metrics).toHaveProperty("clickThroughRate");

    expect(typeof metrics.sent).toBe("number");
    expect(typeof metrics.openRate).toBe("number");
  });

  it("should get trial conversion metrics", async () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-12-31");

    const metrics = await getTrialConversionMetrics(startDate, endDate);

    expect(metrics).toHaveProperty("started");
    expect(metrics).toHaveProperty("converted");
    expect(metrics).toHaveProperty("expired");
    expect(metrics).toHaveProperty("conversionRate");

    expect(typeof metrics.started).toBe("number");
    expect(typeof metrics.conversionRate).toBe("number");
  });

  it("should get subscription metrics", async () => {
    const startDate = new Date("2024-01-01");
    const endDate = new Date("2024-12-31");

    const metrics = await getSubscriptionMetrics(startDate, endDate);

    expect(metrics).toHaveProperty("created");
    expect(metrics).toHaveProperty("canceled");
    expect(metrics).toHaveProperty("churnRate");

    expect(typeof metrics.created).toBe("number");
    expect(typeof metrics.churnRate).toBe("number");
  });

  it("should calculate rates correctly when no data", async () => {
    const startDate = new Date("2030-01-01"); // Future date with no data
    const endDate = new Date("2030-12-31");

    const metrics = await getEmailMetrics(startDate, endDate);

    expect(metrics.sent).toBe(0);
    expect(metrics.openRate).toBe(0);
    expect(metrics.clickRate).toBe(0);
    expect(metrics.clickThroughRate).toBe(0);
  });
});
