// Runtime bindings for the database (DB) and file storage (BUCKET).
// - Production (Vercel): Supabase Postgres when DATABASE_URL (or POSTGRES_URL) is set, Vercel Blob when BLOB_READ_WRITE_TOKEN is set.
// - Local development: a SQLite file and an uploads folder under .data/.
// Both expose the same D1/R2-style interface, so the rest of the app does not care which one is active.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv() {
  try {
    const text = readFileSync(path.join(process.cwd(), ".env"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key]) continue;
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}

loadDotEnv();

const dataDir = path.join(process.cwd(), ".data");
const uploadDir = path.join(dataDir, "uploads");

type Row = Record<string, unknown>;
type RunResult = { success: true; meta: { changes: number; last_row_id: number | bigint } };

// Minimal SQL engine both backends implement.
interface Engine {
  all(sql: string, params: unknown[]): Promise<Row[]>;
  run(sql: string, params: unknown[]): Promise<RunResult["meta"]>;
  batch(items: { sql: string; params: unknown[] }[]): Promise<Row[][]>;
}

export function migrationStatements() {
  const migration = readFileSync(path.join(process.cwd(), "drizzle", "0000_modern_tarot.sql"), "utf8");
  return migration
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function plainRow(row: Row) {
  const copy: Row = {};
  for (const [key, value] of Object.entries(row)) {
    copy[key] = typeof value === "bigint" ? Number(value) : value;
  }
  return copy;
}

// ---------- Local SQLite file (development)
async function localEngine(): Promise<Engine> {
  if (process.env.VERCEL) {
    throw new Error("Database not configured: set DATABASE_URL (Supabase → Connect → Transaction pooler) in Vercel → Settings → Environment Variables, then redeploy.");
  }
  const { DatabaseSync } = await import("node:sqlite");
  mkdirSync(dataDir, { recursive: true });
  const database = new DatabaseSync(path.join(dataDir, "app.sqlite"));
  const ready = database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'content'").get();
  if (!ready) for (const sql of migrationStatements()) database.exec(sql);
  const all = async (sql: string, params: unknown[]) =>
    (database.prepare(sql).all(...(params as never[])) as Row[]).map(plainRow);
  const run = async (sql: string, params: unknown[]) => {
    const info = database.prepare(sql).run(...(params as never[]));
    return { changes: Number(info.changes), last_row_id: info.lastInsertRowid };
  };
  return {
    all,
    run,
    async batch(items) {
      const results: Row[][] = [];
      for (const item of items) {
        if (/^\s*(select|with|pragma)\b/i.test(item.sql)) results.push(await all(item.sql, item.params));
        else {
          await run(item.sql, item.params);
          results.push([]);
        }
      }
      return results;
    },
  };
}

// ---------- Supabase / Postgres (production)
export function postgresUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

export function postgresSchema() {
  const schema = process.env.DATABASE_SCHEMA || "yoga_site";
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("DATABASE_SCHEMA may only contain lowercase letters, numbers and _.");
  return schema;
}

// Supabase needs SSL; its certificate is not in Node's default store, so verification is relaxed
// (the connection is still encrypted). Any sslmode in the URL is dropped so this setting applies.
export function postgresConfig() {
  const url = new URL(postgresUrl());
  url.searchParams.delete("sslmode");
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  return { connectionString: url.toString(), ssl: local ? undefined : { rejectUnauthorized: false } };
}

async function postgresEngine(): Promise<Engine> {
  const { default: pg } = await import("pg");
  const { pgSchemaStatements, toPostgres } = await import("./pg-schema.mjs");
  // bigint (timestamps, counts) comes back as a string by default; the app expects numbers.
  pg.types.setTypeParser(20, (value: string) => Number(value));
  const schema = postgresSchema();
  const pool = new pg.Pool({ ...postgresConfig(), max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 15_000 });
  const ready = await pool.query("SELECT to_regclass($1) AS t", [`"${schema}".content`]);
  if (!ready.rows[0]?.t) for (const sql of pgSchemaStatements(schema)) await pool.query(sql);
  const sqlFor = (sql: string) => toPostgres(sql, schema);
  return {
    async all(sql, params) {
      return (await pool.query(sqlFor(sql), params)).rows.map(plainRow);
    },
    async run(sql, params) {
      const result = await pool.query(sqlFor(sql), params);
      return { changes: result.rowCount ?? 0, last_row_id: 0 };
    },
    async batch(items) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const results: Row[][] = [];
        for (const item of items) results.push((await client.query(sqlFor(item.sql), item.params)).rows.map(plainRow));
        await client.query("COMMIT");
        return results;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally {
        client.release();
      }
    },
  };
}

let enginePromise: Promise<Engine> | null = null;
function engine() {
  if (!enginePromise) {
    enginePromise = (postgresUrl() ? postgresEngine() : localEngine()).catch((error) => {
      enginePromise = null;
      throw error;
    });
  }
  return enginePromise;
}

type Bound = {
  sql: string;
  params: unknown[];
  bind: (...args: unknown[]) => Bound;
  first: <T = any>() => Promise<T | null>;
  all: <T = any>() => Promise<{ results: T[]; success: true }>;
  run: () => Promise<RunResult>;
  raw: () => Promise<unknown[][]>;
};

function statement(sql: string, params: unknown[]): Bound {
  return {
    sql,
    params,
    bind(...args) {
      return statement(sql, args);
    },
    async first<T>() {
      const rows = await (await engine()).all(sql, params);
      return (rows[0] ?? null) as T | null;
    },
    async all<T>() {
      return { results: (await (await engine()).all(sql, params)) as T[], success: true as const };
    },
    async run() {
      return { success: true as const, meta: await (await engine()).run(sql, params) };
    },
    async raw() {
      return (await (await engine()).all(sql, params)).map((row) => Object.values(row));
    },
  };
}

const database = {
  prepare(sql: string) {
    return statement(sql, []);
  },
  async batch(statements: Bound[]) {
    const results = await (await engine()).batch(statements.map((item) => ({ sql: item.sql, params: item.params })));
    return results.map((rows) => ({ results: rows, success: true as const }));
  },
};

// ---------- File storage
type PutOptions = { httpMetadata?: { contentType?: string }; customMetadata?: { name?: string } };
type StoredFile = { body: ReadableStream<Uint8Array> | Uint8Array; httpMetadata: { contentType: string } };

export const BLOB_PREFIX = "media/";

// Public Vercel Blob URLs follow https://<storeId>.public.blob.vercel-storage.com/<pathname>.
// The store id is part of the read-write token (vercel_blob_rw_<storeId>_<secret>).
export function blobPublicUrl(key: string) {
  const fromEnv = process.env.BLOB_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (fromEnv) return `${fromEnv}/${BLOB_PREFIX}${key}`;
  const storeId = (process.env.BLOB_READ_WRITE_TOKEN || "").split("_")[3];
  if (!storeId) return null;
  return `https://${storeId.toLowerCase()}.public.blob.vercel-storage.com/${BLOB_PREFIX}${key}`;
}

const blobBucket = {
  kind: "blob" as const,
  async put(key: string, bytes: Uint8Array, options?: PutOptions) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PREFIX + key, Buffer.from(bytes), {
      access: "public",
      contentType: options?.httpMetadata?.contentType,
      addRandomSuffix: false,
      allowOverwrite: false,
    });
  },
  async get(key: string): Promise<StoredFile | null> {
    let url = blobPublicUrl(key);
    if (!url) {
      const { head } = await import("@vercel/blob");
      url = (await head(BLOB_PREFIX + key).catch(() => null))?.url ?? null;
    }
    if (!url) return null;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok || !response.body) return null;
    return { body: response.body, httpMetadata: { contentType: response.headers.get("content-type") || "application/octet-stream" } };
  },
  publicUrl(key: string) {
    return blobPublicUrl(key);
  },
};

const localBucket = {
  kind: "local" as const,
  async put(key: string, bytes: Uint8Array, options?: PutOptions) {
    if (process.env.VERCEL) {
      throw new Error("File storage not configured: connect a Public Vercel Blob store (adds BLOB_READ_WRITE_TOKEN), then redeploy.");
    }
    mkdirSync(uploadDir, { recursive: true });
    writeFileSync(path.join(uploadDir, key), bytes);
    writeFileSync(
      path.join(uploadDir, `${key}.meta.json`),
      JSON.stringify({
        contentType: options?.httpMetadata?.contentType ?? "application/octet-stream",
        name: options?.customMetadata?.name ?? key,
      }),
    );
  },
  async get(key: string): Promise<StoredFile | null> {
    try {
      const body = readFileSync(path.join(uploadDir, key));
      const meta = JSON.parse(readFileSync(path.join(uploadDir, `${key}.meta.json`), "utf8")) as { contentType: string };
      return { body: new Uint8Array(body), httpMetadata: { contentType: meta.contentType } };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  },
  publicUrl(): string | null {
    return null;
  },
};

export const env = {
  DB: database,
  get BUCKET() {
    return process.env.BLOB_READ_WRITE_TOKEN ? blobBucket : localBucket;
  },
  get RESEND_API_KEY() {
    return process.env.RESEND_API_KEY;
  },
};
