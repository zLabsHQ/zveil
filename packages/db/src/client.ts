import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;

export function createDb(path: string) {
  const sqlite = new Database(path);
  sqlite.pragma("journal_mode = WAL");
  migrate(sqlite);
  return drizzle(sqlite, { schema });
}

export function migrate(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      business_name TEXT NOT NULL,
      email TEXT,
      default_confirmations INTEGER NOT NULL DEFAULT 3,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS viewing_keys (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      fingerprint TEXT NOT NULL UNIQUE,
      network TEXT NOT NULL,
      scanner_account_id TEXT NOT NULL UNIQUE,
      key_ref TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      seq INTEGER,
      slug TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'draft',
      client_name TEXT NOT NULL,
      client_email TEXT,
      description TEXT NOT NULL DEFAULT '',
      items_json TEXT NOT NULL DEFAULT '[]',
      amount_zats INTEGER NOT NULL,
      fiat TEXT,
      amount_fiat_cents INTEGER,
      rate_fiat_per_zec INTEGER,
      due_date INTEGER,
      memo_seed TEXT,
      diversifier_index INTEGER,
      address TEXT,
      zip321_uri TEXT,
      viewing_key_id TEXT,
      confirmations_required INTEGER NOT NULL DEFAULT 3,
      first_seen_at INTEGER,
      paid_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      txid TEXT NOT NULL,
      pool TEXT NOT NULL,
      output_index INTEGER NOT NULL,
      zats INTEGER NOT NULL,
      memo_preview TEXT,
      mined_height INTEGER,
      confirmations INTEGER NOT NULL DEFAULT 0,
      seen_at INTEGER NOT NULL,
      reorged_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS scanner_events (
      event_id TEXT PRIMARY KEY,
      invoice_id TEXT,
      type TEXT NOT NULL,
      received_at INTEGER NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE TABLE IF NOT EXISTS disclosures (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL DEFAULT 'Viewer',
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS counters (
      key TEXT PRIMARY KEY,
      value INTEGER NOT NULL DEFAULT 0
    );
  `);
}
