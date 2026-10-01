// Copies everything from local development storage to the Vercel production services:
//   .data/app.sqlite  -> Turso      (content, settings, enquiries, download links, admins)
//   .data/uploads/*   -> Vercel Blob (as media/<file>, so existing /media/... links keep working)
//
// Usage (needs TURSO_DATABASE_URL, TURSO_AUTH_TOKEN and BLOB_READ_WRITE_TOKEN in .env or the shell):
//   npm run migrate:to-vercel              copy everything
//   npm run migrate:to-vercel -- --dry-run show what would be copied
// Rows with the same id are overwritten in Turso; existing Blob files are overwritten too.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createClient } from "@libsql/client";
import { put } from "@vercel/blob";
import { loadEnv } from "./load-env.mjs";

loadEnv();
const dryRun = process.argv.includes("--dry-run");
const root = process.cwd();
const dbFile = path.join(root, ".data", "app.sqlite");
const uploadDir = path.join(root, ".data", "uploads");

if (!existsSync(dbFile)) {
  console.error("No local database found at .data/app.sqlite.");
  process.exit(1);
}
if (!dryRun && !process.env.TURSO_DATABASE_URL) {
  console.error("Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN).");
  process.exit(1);
}

const local = new DatabaseSync(dbFile, { readOnly: true });
const tables = ["settings", "content", "leads", "downloads", "admins"];

// ---------- Database
let turso = null;
if (!dryRun) {
  turso = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
  const ready = await turso.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'content'");
  if (!ready.rows.length) {
    const sql = readFileSync(path.join(root, "drizzle", "0000_modern_tarot.sql"), "utf8");
    await turso.batch(sql.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean), "write");
    console.log("Created tables in Turso.");
  }
}
for (const table of tables) {
  const rows = local.prepare(`SELECT * FROM ${table}`).all();
  console.log(`${dryRun ? "[dry run] " : ""}${table}: ${rows.length} row(s)`);
  if (dryRun || !rows.length) continue;
  const columns = Object.keys(rows[0]);
  const sql = `INSERT OR REPLACE INTO ${table} (${columns.map((c) => `"${c}"`).join(",")}) VALUES (${columns.map(() => "?").join(",")})`;
  for (let i = 0; i < rows.length; i += 100) {
    await turso.batch(
      rows.slice(i, i + 100).map((row) => ({ sql, args: columns.map((c) => (typeof row[c] === "bigint" ? Number(row[c]) : row[c])) })),
      "write",
    );
  }
}
turso?.close();

// ---------- Uploaded files
const files = existsSync(uploadDir) ? readdirSync(uploadDir).filter((name) => !name.endsWith(".meta.json")) : [];
console.log(`${dryRun ? "[dry run] " : ""}uploads: ${files.length} file(s)`);
if (files.length && !dryRun) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Set BLOB_READ_WRITE_TOKEN to copy uploaded files. Database copy is complete.");
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
