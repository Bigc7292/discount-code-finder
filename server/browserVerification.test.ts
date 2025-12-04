import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { verifyCodeWithBrowser, closeBrowser } from "./browserVerification";

describe("Browser Verification", () => {
  afterAll(async () => {
    // Clean up browser instance after tests
    await closeBrowser();
  });

  it("should handle verification when merchant URL is accessible", async () => {
    // Test with a simple, accessible URL
    const result = await verifyCodeWithBrowser(
      "TEST123",
      "https://example.com",
      "Example Merchant"
    );

    expect(result).toBeDefined();
    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("details");
    expect(typeof result.valid).toBe("boolean");
    expect(typeof result.details).toBe("string");
  }, 60000); // 60 second timeout for browser operations

  it("should return invalid for non-existent discount code input", async () => {
    // Test with a page that likely doesn't have discount code input
    const result = await verifyCodeWithBrowser(
      "TESTCODE",
      "https://example.com",
      "Example"
    );

    // Should return invalid when no code input is found
    expect(result.valid).toBe(false);
    expect(result.details).toContain("Could not locate discount code input field");
  }, 60000);

  it("should handle errors gracefully", async () => {
    // Test with invalid URL
    const result = await verifyCodeWithBrowser(
      "CODE123",
      "https://invalid-url-that-does-not-exist-12345.com",
      "Invalid Merchant"
    );

    expect(result.valid).toBe(false);
    expect(result.details).toBeDefined();
  }, 60000);
});
