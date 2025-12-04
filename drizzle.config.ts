import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL || "sqlite.db";

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  },
});
