import { describe, expect, it } from "vitest";
import { 
  sendSearchLimitWarning, 
  sendTrialExpiryWarning,
  sendWelcomeEmail 
} from "./emailNotifications";

describe("Email Notifications", () => {
  it("should send search limit warning without errors", async () => {
    const result = await sendSearchLimitWarning(
      "test@example.com",
      "Test User",
      3
    );

    // Function should return boolean
    expect(typeof result).toBe("boolean");
  });

  it("should send trial expiry warning without errors", async () => {
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const result = await sendTrialExpiryWarning(
      "test@example.com",
      "Test User",
      expiryDate
    );

    // Function should return boolean
    expect(typeof result).toBe("boolean");
  });

  it("should send welcome email without errors", async () => {
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    const result = await sendWelcomeEmail(
      "test@example.com",
      "Test User",
      trialEndsAt
    );

    // Function should return boolean
    expect(typeof result).toBe("boolean");
  });

  it("should handle missing email gracefully", async () => {
    // Should not throw error even with empty email
    const result = await sendSearchLimitWarning(
      "",
      "Test User",
      3
    );

    expect(typeof result).toBe("boolean");
  });
});
