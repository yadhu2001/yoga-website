// Postgres (Supabase) version of drizzle/0000_modern_tarot.sql.
// Keep the two in step when the schema changes.
// Tables live in their own schema so they never collide with other tables in the same Supabase project.
// Timestamps are milliseconds since 1970, so they use bigint.
// Row level security is switched on with no policies: Supabase's public REST API (anon key) cannot read
// these tables, while the site's own database connection (table owner) is unaffected.
/** @type {readonly string[]} */
export const PG_TABLES = ['admins', 'content', 'downloads', 'leads', 'rate_limits', 'settings'];

/** @param {string} schema */
export function pgSchemaStatements(schema) {
  const s = `"${schema}"`;
  return [
    `CREATE SCHEMA IF NOT EXISTS ${s}`,
    `CREATE TABLE IF NOT EXISTS ${s}.admins (id text PRIMARY KEY NOT NULL, email text NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS ${s}.content (id text PRIMARY KEY NOT NULL, type text NOT NULL, data text NOT NULL, published integer DEFAULT 1 NOT NULL, "position" integer DEFAULT 0 NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_content_type ON ${s}.content (type, "position")`,
    `CREATE TABLE IF NOT EXISTS ${s}.downloads (id text PRIMARY KEY NOT NULL, resource text NOT NULL, expires bigint NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS ${s}.leads (id text PRIMARY KEY NOT NULL, name text NOT NULL, email text NOT NULL, phone text NOT NULL, city text, type text NOT NULL, interest text, message text, source text, status text DEFAULT 'New' NOT NULL, notification text DEFAULT 'Not configured' NOT NULL, created_at bigint NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS idx_leads_created ON ${s}.leads (created_at)`,
    `CREATE TABLE IF NOT EXISTS ${s}.rate_limits (id text PRIMARY KEY NOT NULL, count integer NOT NULL, expires bigint NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS ${s}.settings (id text PRIMARY KEY NOT NULL, data text NOT NULL)`,
    ...PG_TABLES.map((table) => `ALTER TABLE ${s}.${table} ENABLE ROW LEVEL SECURITY`),
  ];
}

// Turns the app's SQLite-style SQL into Postgres SQL for the given schema.
/** @param {string} sql @param {string} schema */
export function toPostgres(sql, schema) {
  let out = sql;
  let ignore = false;
  if (/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i.test(out)) {
    out = out.replace(/^\s*INSERT\s+OR\s+IGNORE\s+INTO\b/i, 'INSERT INTO');
    ignore = true;
  }
  // Postgres needs the existing-row value qualified inside ON CONFLICT ... DO UPDATE.
  out = out.replace(/\bcount\s*=\s*count\s*\+\s*1\b/gi, 'count=rate_limits.count+1');
  out = out.replace(
    new RegExp(`\\b(FROM|INTO|UPDATE|JOIN)\\s+(${PG_TABLES.join('|')})\\b`, 'gi'),
    (_, keyword, table) => `${keyword} "${schema}".${table}`,
  );
  let n = 0;
  out = out.replace(/'(?:[^']|'')*'|\?/g, (match) => (match === '?' ? `$${++n}` : match));
  if (ignore) out += ' ON CONFLICT DO NOTHING';
  return out;
}
