import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

let quoteSchemaPromise: Promise<void> | null = null;

async function initializeQuoteSchema() {
  if (!env.DB) {
    throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  }

  await env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS quote_requests (
      id integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      reference text NOT NULL UNIQUE,
      name text,
      email text NOT NULL,
      phone text,
      company text NOT NULL,
      product_id integer,
      requirement text NOT NULL,
      quantity integer NOT NULL,
      delivery_pincode text NOT NULL,
      required_by text,
      project_type text,
      notes text,
      status text DEFAULT 'new' NOT NULL,
      created_at integer NOT NULL
    )`),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS quote_requests_status_idx ON quote_requests (status)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS quote_requests_email_idx ON quote_requests (email)"),
  ]);

  const columns = await env.DB.prepare("PRAGMA table_info(quote_requests)").all<{ name: string }>();
  const existing = new Set(columns.results.map((column) => column.name));
  const additions = [
    ["name", "ALTER TABLE quote_requests ADD COLUMN name text"],
    ["phone", "ALTER TABLE quote_requests ADD COLUMN phone text"],
    ["required_by", "ALTER TABLE quote_requests ADD COLUMN required_by text"],
    ["project_type", "ALTER TABLE quote_requests ADD COLUMN project_type text"],
    ["notes", "ALTER TABLE quote_requests ADD COLUMN notes text"],
  ].filter(([column]) => !existing.has(column)).map(([, sql]) => env.DB.prepare(sql));

  if (additions.length) await env.DB.batch(additions);
}

export function ensureQuoteSchema() {
  quoteSchemaPromise ??= initializeQuoteSchema().catch((error) => {
    quoteSchemaPromise = null;
    throw error;
  });
  return quoteSchemaPromise;
}

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
