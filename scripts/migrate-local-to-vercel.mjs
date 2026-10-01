// Copies everything from local development storage to production:
//   .data/app.sqlite  -> Supabase Postgres (content, settings, enquiries, download links, admins)
//   .data/uploads/*   -> Vercel Blob       (as media/<file>, so existing /media/... links keep working)
//
// Needs DATABASE_URL (Supabase → Connect → Transaction pooler) and BLOB_READ_WRITE_TOKEN in .env or the shell.
//   npm run migrate:to-vercel              copy everything
//   npm run migrate:to-vercel -- --dry-run show what would be copied
// Content and settings in Supabase are replaced by your local copy; enquiries, download links and admins
// are merged (same id = overwritten). Existing Blob files with the same name are overwritten.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import pg from "pg";
import { put } from "@vercel/blob";
import { PG_TABLES, pgSchemaStatements } from "../lib/pg-schema.mjs";
import { loadEnv } from "./load-env.mjs";
import { postgresClientConfig, postgresSchema } from "./postgres-config.mjs";

loadEnv();
const dryRun = process.argv.includes("--dry-run");
const root = process.cwd();
const dbFile = path.join(root, ".data", "app.sqlite");
const uploadDir = path.join(root, ".data", "uploads");

if (!existsSync(dbFile)) {
  console.error("No local database found at .data/app.sqlite.");
  process.exit(1);
}

const local = new DatabaseSync(dbFile, { readOnly: true });
const REPLACE = new Set(["content", "settings"]);

// ---------- Database
let client = null;
const schema = postgresSchema();
if (!dryRun) {
  client = new pg.Client(postgresClientConfig());
  await client.connect();
  for (const sql of pgSchemaStatements(schema)) await client.query(sql);
}
try {
  if (client) await client.query("BEGIN");
  // rate_limits only holds short-lived login/enquiry counters, so it is not copied.
  for (const table of PG_TABLES.filter((t) => t !== "rate_limits")) {
    const rows = local.prepare(`SELECT * FROM ${table}`).all();
    console.log(`${dryRun ? "[dry run] " : ""}${table}: ${rows.length} row(s)`);
    if (!client) continue;
    // Your local content and settings are the source of truth, so they replace what is there
    // (otherwise starter items you deleted locally would come back). Enquiries are merged, never removed.
    if (REPLACE.has(table)) await client.query(`DELETE FROM "${schema}".${table}`);
    if (!rows.length) continue;
    const columns = Object.keys(rows[0]);
    const updates = columns.filter((c) => c !== "id").map((c) => `"${c}"=excluded."${c}"`).join(",");
    const sql = `INSERT INTO "${schema}".${table} (${columns.map((c) => `"${c}"`).join(",")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(",")}) ON CONFLICT (id) DO ${updates ? `UPDATE SET ${updates}` : "NOTHING"}`;
    for (const row of rows) await client.query(sql, columns.map((c) => (typeof row[c] === "bigint" ? Number(row[c]) : row[c])));
  }
  if (client) await client.query("COMMIT");
} catch (error) {
  if (client) await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client?.end();
}

// ---------- Uploaded files
const files = existsSync(uploadDir) ? readdirSync(uploadDir).filter((name) => !name.endsWith(".meta.json")) : [];
console.log(`${dryRun ? "[dry run] " : ""}uploads: ${files.length} file(s)`);
if (files.length && !dryRun) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Database copy is complete. Set BLOB_READ_WRITE_TOKEN to copy the uploaded files as well.");
    process.exit(1);
  }
  for (const name of files) {
    let contentType = "application/octet-stream";
    try {
      contentType = JSON.parse(readFileSync(path.join(uploadDir, `${name}.meta.json`), "utf8")).contentType || contentType;
    } catch {}
    await put(`media/${name}`, readFileSync(path.join(uploadDir, name)), {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    console.log(`  uploaded media/${name}`);
  }
}
console.log(dryRun ? "Dry run finished. Nothing was changed." : "Migration finished.");
