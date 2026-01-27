import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Database is optional - app can work without it
let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
    db = drizzle(pool, { schema });
    console.log("Database connection configured");
  } catch (error) {
    console.warn("Failed to configure database connection:", error);
  }
} else {
  console.warn("DATABASE_URL not set - running without database");
}

export { pool, db };
