import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const dataDir = path.join(process.cwd(), ".data");
const uploadDir = path.join(dataDir, "uploads");

function openDatabase() {
  mkdirSync(dataDir, { recursive: true });
  const database = new DatabaseSync(path.join(dataDir, "app.sqlite"));
  const ready = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'content'")
    .get();
  if (!ready) {
    const migration = readFileSync(
      path.join(process.cwd(), "drizzle", "0000_modern_tarot.sql"),
      "utf8",
    );
    for (const statement of migration.split("--> statement-breakpoint")) {
      const sql = statement.trim();
      if (sql) database.exec(sql);
    }
  }
  return database;
}

type Bound = {
  sql: string;
  bind: (...args: unknown[]) => Bound;
  first: <T = Record<string, unknown>>() => Promise<T | null>;
  all: <T = Record<string, unknown>>() => Promise<{ results: T[]; success: true }>;
  run: () => Promise<{ success: true; meta: { changes: number; last_row_id: number | bigint } }>;
  raw: () => Promise<unknown[][]>;
};

function statement(database: DatabaseSync, sql: string, params: unknown[]): Bound {
  const prepared = () => database.prepare(sql);
  const bound: Bound = {
    sql,
    bind(...args) {
      return statement(database, sql, args);
    },
    async first() {
      const row = prepared().get(...(params as never[]));
      return (row as Record<string, unknown> | undefined) ?? null;
    },
    async all() {
      return {
        results: prepared().all(...(params as never[])) as Record<string, unknown>[],
        success: true,
      };
    },
    async run() {
      const info = prepared().run(...(params as never[]));
      return { success: true, meta: { changes: info.changes, last_row_id: info.lastInsertRowid } };
    },
    async raw() {
      return (prepared().all(...(params as never[])) as Record<string, unknown>[]).map((row) =>
        Object.values(row),
      );
    },
  };
  return bound;
}

const database = openDatabase();

const localDb = {
  prepare(sql: string) {
    return statement(database, sql, []);
  },
  batch(statements: Bound[]) {
    return Promise.all(
      statements.map((item) =>
        /^\s*(select|with|pragma)\b/i.test(item.sql) ? item.all() : item.run(),
      ),
    );
  },
};

const bucket = {
  async put(
    key: string,
    bytes: Uint8Array,
    options?: { httpMetadata?: { contentType?: string }; customMetadata?: { name?: string } },
  ) {
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
  async get(key: string) {
    try {
      const body = readFileSync(path.join(uploadDir, key));
      const meta = JSON.parse(readFileSync(path.join(uploadDir, `${key}.meta.json`), "utf8")) as {
        contentType: string;
      };
      return { body, httpMetadata: { contentType: meta.contentType } };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  },
};

export const env = {
  DB: localDb,
  BUCKET: bucket,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
};
