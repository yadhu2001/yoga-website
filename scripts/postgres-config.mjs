// Same connection rules as lib/local-env.ts, for the command-line scripts.
export function postgresClientConfig() {
  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!raw) {
    console.error("Set DATABASE_URL (Supabase → Connect → Transaction pooler) in .env or the shell first.");
    process.exit(1);
  }
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  const local = ["localhost", "127.0.0.1"].includes(url.hostname);
  return { connectionString: url.toString(), ssl: local ? undefined : { rejectUnauthorized: false }, connectionTimeoutMillis: 15000 };
}

export function postgresSchema() {
  const schema = process.env.DATABASE_SCHEMA || "yoga_site";
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("DATABASE_SCHEMA may only contain lowercase letters, numbers and _.");
  return schema;
}
