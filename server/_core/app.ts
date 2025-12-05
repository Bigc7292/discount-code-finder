import "dotenv/config";
import express from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createServer } from "http";

export async function createApp() {
    const app = express();
    const server = createServer(app);

    // Start trial expiry checker
    const { startTrialExpiryChecker } = await import("../trialExpiryChecker");
    startTrialExpiryChecker();

    // Start weekly report scheduler
    const { scheduleWeeklyReports } = await import("../weeklyReports");
    scheduleWeeklyReports();

    // Stripe webhook MUST be registered before body parsers
    // Import webhook handler
    const { handleStripeWebhook } = await import("../webhooks");
    app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);

    // Configure body parser with larger size limit for file uploads
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    // OAuth callback under /api/oauth/callback
    registerOAuthRoutes(app);
    // tRPC API
    app.use(
        "/api/trpc",
        trpcExpress.createExpressMiddleware({
            router: appRouter,
            createContext,
        })
    );

    // development mode uses Vite, production mode uses static files
    if (process.env.NODE_ENV === "development") {
        await setupVite(app, server);
    } else {
        serveStatic(app);
    }

    return { app, server };
}
