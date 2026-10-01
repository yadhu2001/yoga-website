// Creates the site's tables in Supabase/Postgres (safe to run more than once).
// Usage: put DATABASE_URL in .env (Supabase → Connect → Transaction pooler), then: npm run db:migrate
// The site also does this automatically on its first request, so this is optional.
import pg from "pg";
import { pgSchemaStatements } from "../lib/pg-schema.mjs";
import { loadEnv } from "./load-env.mjs";
import { postgresClientConfig, postgresSchema } from "./postgres-config.mjs";

loadEnv();
const client = new pg.Client(postgresClientConfig());
await client.connect();
const schema = postgresSchema();
try {
  for (const sql of pgSchemaStatements(schema)) await client.query(sql);
  console.log(`Tables are ready in schema "${schema}".`);
} finally {
  await client.end();
}
