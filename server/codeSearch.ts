import { invokeLLM } from "./_core/llm";
import { z } from "zod";
import puppeteer from "puppeteer";
import * as fs from "fs";
import { verifyCodeWithBrowser } from "./browserVerification";

function log(message: any) {
  console.log(message);
  try {
    fs.appendFileSync("debug.log", "[CodeSearch] " + (typeof message === "object" ? JSON.stringify(message) : message) + "\n");
  } catch (e) { }
}

export interface DiscountCodeResult {
  code: string;
  merchantName: string;
  merchantUrl?: string;
  description?: string;
  discountAmount?: string;
  expiryDate?: Date;
  source: string;
}

/**
 * Search for discount codes using AI-powered web search
 */
export async function searchDiscountCodes(query: string): Promise<DiscountCodeResult[]> {
  try {
    log(`Starting search for: ${query}`);

    // Use LLM to search for discount codes
    const searchPrompt = `You are a discount code finder assistant. Search for valid, active discount codes for: "${query}".

Your task:
1. Find discount codes from multiple sources (coupon websites, official merchant sites, promotional pages)
2. Extract the following information for each code:
   - Code: The actual discount code
   - Merchant Name: The company/website offering the discount
   - Merchant URL: The website where the code can be used
   - Description: What the discount is for
   - Discount Amount: The discount percentage or amount (e.g., "20% off", "$10 off")
   - Expiry Date: When the code expires (if available)
   - Source: Where you found this code

Return ONLY a JSON array of discount codes. Each object should have these fields:
{
  "code": "string",
  "merchantName": "string",
  "merchantUrl": "string",
  "description": "string",
  "discountAmount": "string",
  "expiryDate": "YYYY-MM-DD or null",
  "source": "string"
}

Find at least 3-5 different codes from various sources. Focus on recent, active codes.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are a discount code search expert. You find valid, active discount codes from multiple sources across the web.",
        },
        {
          role: "user",
          content: searchPrompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "discount_codes",
          strict: true,
          schema: {
            type: "object",
            properties: {
              codes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    code: { type: "string" },
                    merchantName: { type: "string" },
                    merchantUrl: { type: "string" },
                    description: { type: "string" },
                    discountAmount: { type: "string" },
                    expiryDate: { type: ["string", "null"] },
                    source: { type: "string" },
                  },
                  required: ["code", "merchantName", "merchantUrl", "description", "discountAmount", "source"],
                  additionalProperties: false,
                },
              },
            },
            required: ["codes"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    log("LLM Response content: " + content);

    if (!content || typeof content !== 'string') {
      log("No content in LLM response");
      return [];
    }

    const parsed = JSON.parse(content);

    let codesArray: any[] = [];
    if (Array.isArray(parsed)) {
      codesArray = parsed;
    } else if (parsed.codes && Array.isArray(parsed.codes)) {
      codesArray = parsed.codes;
    } else {
      log("Invalid response format: " + JSON.stringify(parsed));
      return [];
    }

    const codes: DiscountCodeResult[] = codesArray.map((item: any) => ({
      code: item.code,
      merchantName: item.merchantName,
      merchantUrl: item.merchantUrl,
      description: item.description,
      discountAmount: item.discountAmount,
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
      source: item.source,
    }));

    log(`Found ${codes.length} codes`);
    return codes;
  } catch (error) {
    log("!!! Error searching for codes: " + error);
    return [];
  }
}

/**
 * Verify a discount code using real browser automation with Puppeteer
 * Simulates actual checkout process to test if code works
 */
export async function verifyDiscountCode(
  code: string,
  merchantUrl: string,
  merchantName: string
): Promise<{ valid: boolean; details: string }> {
  try {
    log(`Verifying code ${code} for ${merchantName} using browser automation`);

    // Use Puppeteer to verify the code on the actual merchant website
    const result = await verifyCodeWithBrowser(code, merchantUrl, merchantName);

    log(`Browser result for ${code}: ${result.valid ? 'VALID' : 'INVALID'} - ${result.details}`);

    return result;
  } catch (error) {
    log("Error verifying code: " + error);
    return {
      valid: false,
      details: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
