import puppeteer, { Browser, Page } from "puppeteer";

let browserInstance: Browser | null = null;

/**
 * Get or create a browser instance
 */
async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });
  }
  return browserInstance;
}

/**
 * Close the browser instance
 */
export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

/**
 * Verify a discount code by attempting to apply it on the merchant website
 */
export async function verifyCodeWithBrowser(
  code: string,
  merchantUrl: string,
  merchantName: string
): Promise<{ valid: boolean; details: string }> {
  let page: Page | null = null;
  
  try {
    console.log(`[BrowserVerification] Starting verification for code ${code} at ${merchantUrl}`);
    
    const browser = await getBrowser();
    page = await browser.newPage();
    
    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );
    
    // Set timeout for navigation
    page.setDefaultNavigationTimeout(30000);
    page.setDefaultTimeout(30000);
    
    // Navigate to merchant URL
    try {
      await page.goto(merchantUrl, { waitUntil: "networkidle2", timeout: 30000 });
    } catch (navError) {
      console.log(`[BrowserVerification] Navigation timeout, trying with domcontentloaded`);
      await page.goto(merchantUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    }
    
    // Wait a bit for page to settle
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot for debugging
    const screenshotPath = `/tmp/verification-${code}-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: false });
    
    // Look for common discount code input patterns
    const codeInputSelectors = [
      'input[name*="coupon"]',
      'input[name*="promo"]',
      'input[name*="discount"]',
      'input[id*="coupon"]',
      'input[id*="promo"]',
      'input[id*="discount"]',
      'input[placeholder*="coupon" i]',
      'input[placeholder*="promo" i]',
      'input[placeholder*="discount" i]',
      'input[type="text"][name*="code"]',
      '#coupon_code',
      '#promo_code',
      '#discount_code',
    ];
    
    let codeInput = null;
    for (const selector of codeInputSelectors) {
      try {
        codeInput = await page.$(selector);
        if (codeInput) {
          console.log(`[BrowserVerification] Found code input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!codeInput) {
      // Try to find "apply coupon" or similar buttons/links that might reveal the input
      const revealButtonSelectors = [
        'a:has-text("coupon")',
        'button:has-text("coupon")',
        'a:has-text("promo")',
        'button:has-text("promo")',
        'a:has-text("discount")',
        'button:has-text("discount")',
      ];
      
      for (const selector of revealButtonSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to find input again
            for (const inputSelector of codeInputSelectors) {
              codeInput = await page.$(inputSelector);
              if (codeInput) break;
            }
            
            if (codeInput) break;
          }
        } catch (e) {
          // Continue
        }
      }
    }
    
    if (!codeInput) {
      console.log(`[BrowserVerification] No discount code input found on page`);
      return {
        valid: false,
        details: `Could not locate discount code input field on ${merchantName} website. The site may not have a visible coupon field on the main page, or may require adding items to cart first.`,
      };
    }
    
    // Enter the discount code
    await codeInput.click();
    await codeInput.type(code, { delay: 100 });
    
    // Look for apply button
    const applyButtonSelectors = [
      'button[type="submit"]',
      'button:has-text("apply")',
      'button:has-text("submit")',
      'input[type="submit"]',
      'button[name*="apply"]',
    ];
    
    let applied = false;
    for (const selector of applyButtonSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          applied = true;
          console.log(`[BrowserVerification] Clicked apply button with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (!applied) {
      // Try pressing Enter on the input
      await codeInput.press("Enter");
      applied = true;
    }
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for success/error messages
    const pageContent = await page.content();
    const pageText = await page.evaluate(() => document.body.innerText);
    
    // Common success indicators
    const successPatterns = [
      /coupon.*applied/i,
      /promo.*applied/i,
      /discount.*applied/i,
      /code.*applied/i,
      /successfully.*applied/i,
      /saved/i,
      /\$\d+.*off/i,
      /\d+%.*off/i,
    ];
    
    // Common error indicators
    const errorPatterns = [
      /invalid.*code/i,
      /invalid.*coupon/i,
      /expired/i,
      /not.*valid/i,
      /doesn't.*exist/i,
      /does not exist/i,
      /incorrect/i,
    ];
    
    const hasSuccess = successPatterns.some(pattern => pattern.test(pageText));
    const hasError = errorPatterns.some(pattern => pattern.test(pageText));
    
    if (hasSuccess && !hasError) {
      return {
        valid: true,
        details: `Code successfully applied on ${merchantName}. Discount appears to be active and working.`,
      };
    } else if (hasError) {
      return {
        valid: false,
        details: `Code was rejected by ${merchantName}. The website indicated the code is invalid or expired.`,
      };
    } else {
      // Ambiguous result - code entered but no clear success/error message
      return {
        valid: false,
        details: `Code entered on ${merchantName} but verification inconclusive. The site may require items in cart or additional steps to validate the code.`,
      };
    }
    
  } catch (error) {
    console.error(`[BrowserVerification] Error during verification:`, error);
    return {
      valid: false,
      details: `Verification failed due to technical error: ${error instanceof Error ? error.message : 'Unknown error'}. The website may be blocking automated access or experiencing issues.`,
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Verify multiple codes in sequence
 */
export async function verifyMultipleCodes(
  codes: Array<{ code: string; merchantUrl: string; merchantName: string }>
): Promise<Array<{ code: string; valid: boolean; details: string }>> {
  const results = [];
  
  for (const codeData of codes) {
    const result = await verifyCodeWithBrowser(
      codeData.code,
      codeData.merchantUrl,
      codeData.merchantName
    );
    
    results.push({
      code: codeData.code,
      valid: result.valid,
      details: result.details,
    });
    
    // Small delay between verifications
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return results;
}

// Cleanup on process exit
process.on("exit", () => {
  if (browserInstance) {
    browserInstance.close();
  }
});
