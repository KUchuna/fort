import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/lib/auth-schema";

const sql = neon(process.env.DB_DATABASE_URL!);
export const db = drizzle(sql, {schema});