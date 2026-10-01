// Creates the database tables in Turso (safe to run more than once).
// Usage: TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run db:migrate
// The app also does this automatically on first request, so this is optional.
import { readFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { loadEnv } from "./load-env.mjs";

loadEnv();
const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) first, in .env or the shell.");
  process.exit(1);
}
const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
const ready = await client.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'content'");
if (ready.rows.length) {
  console.log("Tables already exist. Nothing to do.");
} else {
  const sql = readFileSync(path.join(process.cwd(), "drizzle", "0000_modern_tarot.sql"), "utf8");
  const statements = sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);
  await client.batch(statements, "write");
  console.log(`Created tables (${statements.length} statements).`);
}
client.close();
