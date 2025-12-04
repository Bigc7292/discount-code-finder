import "dotenv/config";
import * as fs from "fs";
// import * as dotenv from "dotenv"; // Removed
// dotenv.config(); // Removed
import { getDb, createDiscountCode, createVerificationLog, updateDiscountCodeVerification, createInboxMessage } from "../server/db";
import { users } from "../drizzle/schema";
import { searchDiscountCodes, verifyDiscountCode } from "../server/codeSearch";
import { eq } from "drizzle-orm";

function log(message: any) {
    console.log(message);
    try {
        fs.appendFileSync("debug.log", (typeof message === "object" ? JSON.stringify(message) : message) + "\n");
    } catch (e) { }
}

async function main() {
    log("Starting full flow verification...");

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // 1. Create test user
    log("Creating test user...");
    const testUserEmail = "test@example.com";
    let userId: number;

    const existingUser = await db.select().from(users).where(eq(users.email, testUserEmail)).get();
    if (existingUser) {
        userId = existingUser.id;
        log("Test user exists, ID: " + userId);
    } else {
        const result = await db.insert(users).values({
            openId: "test-openid-" + Date.now(),
            email: testUserEmail,
            name: "Test User",
            role: "user",
            subscriptionStatus: "active"
        }).returning({ id: users.id });
        userId = result[0].id;
        log("Created test user, ID: " + userId);
    }

    // 2. Search for codes (Gemini)
    const query = "Nike";
    log(`Searching for codes for '${query}' using Gemini...`);
    const foundCodes = await searchDiscountCodes(query);
    log(`Found ${foundCodes.length} codes.`);

    if (foundCodes.length === 0) {
        log("No codes found. Check Gemini API key or quota.");
        return;
    }

    // 3. Process first code
    const codeData = foundCodes[0];
    log("Processing first code: " + JSON.stringify(codeData));

    // Save to DB
    const searchId = 999; // Mock search ID
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
    log("Saved code to DB, ID: " + codeId);

    // Verify (Puppeteer)
    // Note: This might fail if Puppeteer is not configured correctly or blocked
    log("Verifying code with Puppeteer...");
    try {
        const verification = await verifyDiscountCode(
            codeData.code,
            codeData.merchantUrl || "https://www.nike.com",
            codeData.merchantName
        );
        log("Verification result: " + JSON.stringify(verification));

        await createVerificationLog({
            discountCodeId: codeId,
            success: verification.valid,
            errorMessage: verification.valid ? null : "Code verification failed",
            verificationDetails: verification.details,
        });
        log("Saved verification log.");

    } catch (error) {
        log("Verification failed (expected if no browser env): " + error);
    }

    log("Verification complete.");
}

main().catch(e => log(e));
