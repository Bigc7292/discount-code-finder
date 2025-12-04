import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as dotenv from "dotenv";
dotenv.config();
import { getDb } from "../server/db";

async function main() {
    console.log("Starting migration...");
    const db = await getDb();
    if (!db) {
        throw new Error("Failed to initialize database connection");
    }

    try {
        await migrate(db, { migrationsFolder: "./drizzle" });
        console.log("Migration completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

main();
