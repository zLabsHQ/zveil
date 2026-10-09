/**
 * Seed a believable demo workspace.
 * Run: pnpm --filter @zveil/web seed
 */
import Database from "better-sqlite3";
import path from "node:path";
import { mkdirSync, existsSync, rmSync } from "node:fs";
import { randomBytes, createHash } from "node:crypto";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "zveil.db");
mkdirSync(path.dirname(DB_PATH), { recursive: true });
if (existsSync(DB_PATH)) rmSync(DB_PATH);
const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
  CREATE TABLE workspaces (
    id TEXT PRIMARY KEY, business_name TEXT NOT NULL, email TEXT,
    default_confirmations INTEGER NOT NULL DEFAULT 3, created_at INTEGER NOT NULL);
  CREATE TABLE viewing_keys (
    id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, fingerprint TEXT NOT NULL UNIQUE,
    network TEXT NOT NULL, scanner_account_id TEXT NOT NULL UNIQUE, key_ref TEXT,
    created_at INTEGER NOT NULL);
  CREATE TABLE invoices (
    id TEXT PRIMARY KEY, workspace_id TEXT NOT NULL, seq INTEGER, slug TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'draft', client_name TEXT NOT NULL, client_email TEXT,
    description TEXT NOT NULL DEFAULT '', items_json TEXT NOT NULL DEFAULT '[]',
    amount_zats INTEGER NOT NULL, fiat TEXT, amount_fiat_cents INTEGER,
    rate_fiat_per_zec INTEGER, due_date INTEGER, memo_seed TEXT, diversifier_index INTEGER,
    address TEXT, zip321_uri TEXT, viewing_key_id TEXT,
    confirmations_required INTEGER NOT NULL DEFAULT 3,
    first_seen_at INTEGER, paid_at INTEGER, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
  CREATE TABLE payments (
    id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL, txid TEXT NOT NULL, pool TEXT NOT NULL,
    output_index INTEGER NOT NULL, zats INTEGER NOT NULL, memo_preview TEXT,
    mined_height INTEGER, confirmations INTEGER NOT NULL DEFAULT 0,
    seen_at INTEGER NOT NULL, reorged_at INTEGER);
  CREATE TABLE scanner_events (
    event_id TEXT PRIMARY KEY, invoice_id TEXT, type TEXT NOT NULL,
    received_at INTEGER NOT NULL, payload_json TEXT NOT NULL DEFAULT '{}');
  CREATE TABLE disclosures (
    id TEXT PRIMARY KEY, invoice_id TEXT NOT NULL, token TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL DEFAULT 'Viewer', expires_at INTEGER NOT NULL,
    revoked_at INTEGER, created_at INTEGER NOT NULL);
  CREATE TABLE counters (key TEXT PRIMARY KEY, value INTEGER NOT NULL DEFAULT 0);
`);

const now = Date.now();
const day = 86_400_000;
const rand = (n: number) => randomBytes(n).toString("hex");
const txid = () => rand(32);
const uaddr = (i: number) => `uregtest1${rand(40).replace(/[^a-z0-9]/g, "q")}${i.toString(16)}`;
const zip321 = (addr: string, zec: number, seq: number) =>
  `zcash:${addr}?amount=${zec}&memo=${Buffer.from(`ZP-${rand(2).toUpperCase()}`).toString("base64url")}&message=${encodeURIComponent(`Invoice INV-${String(seq).padStart(4, "0")}`)}&label=${encodeURIComponent("Maya Lin Studio")}`;

// workspace + viewing key
sqlite.prepare("INSERT INTO workspaces VALUES (?,?,?,?,?)").run("ws-demo", "Maya Lin Studio", "maya@example.com", 3, now - 30 * day);
sqlite.prepare("INSERT INTO viewing_keys VALUES (?,?,?,?,?,?,?)").run("vk-1", "ws-demo", createHash("sha256").update("demo").digest("hex").slice(0, 16), "regtest", "demo-seed", "env:UFVK_0", now - 30 * day);

const insInv = sqlite.prepare(`INSERT INTO invoices (
  id, workspace_id, seq, slug, status, client_name, client_email, description, items_json,
  amount_zats, fiat, amount_fiat_cents, rate_fiat_per_zec, due_date, memo_seed, diversifier_index,
  address, zip321_uri, viewing_key_id, confirmations_required, first_seen_at, paid_at, created_at, updated_at
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insPay = sqlite.prepare(`INSERT INTO payments VALUES (?,?,?,?,?,?,?,?,?,?,NULL)`);
const insDisc = sqlite.prepare(`INSERT INTO disclosures VALUES (?,?,?,?,?,NULL,?)`);

function invoice(
  seq: number | null, slug: string, status: string, client: string, desc: string,
  zats: number, opts: { daysAgo?: number; dueInDays?: number; paidRatio?: number; overdue?: boolean; fiatCents?: number } = {},
) {
  const id = rand(16);
  const created = now - (opts.daysAgo ?? 0) * day;
  const due = opts.dueInDays !== undefined ? created + opts.dueInDays * day : null;
  const addr = seq != null ? uaddr(seq) : null;
  insInv.run(
    id, "ws-demo", seq, slug, status, client, null, desc,
    JSON.stringify([{ description: desc, qty: 1, unitZats: zats }]),
    zats, opts.fiatCents ? "USD" : null, opts.fiatCents ?? null, opts.fiatCents ? 1278 : null,
    due, `ZP-${rand(2).toUpperCase()}`, seq != null ? seq - 1 : null,
    addr, addr ? zip321(addr, zats / 1e8, seq!) : null,
    seq != null ? "vk-1" : null, 3,
    opts.paidRatio ? created + day : null,
    status === "paid" || status === "overpaid" ? created + 2 * day : null,
    created, now,
  );
  if (opts.paidRatio) {
    insPay.run(`${txid()}:ironwood:0`, id, txid(), "ironwood", 0, Math.round(zats * opts.paidRatio), null, 3_512_010, 3, created + day);
  }
  return id;
}

// 6 invoices in realistic mixed states
const paidId = invoice(4, rand(4), "paid", "Nighthawk Labs", "Brand refresh — deposit", 250_000_000, { daysAgo: 9, dueInDays: 12, paidRatio: 1 });
invoice(1, rand(4), "paid", "Signal Foundry", "Research sprint", 100_000_000, { daysAgo: 21, dueInDays: 14, paidRatio: 1 });
invoice(2, rand(4), "partially_paid", "Acme DAO", "Illustration set", 180_000_000, { daysAgo: 6, dueInDays: 21, paidRatio: 0.4 });
invoice(3, "demo", "open", "ZCG Reviewers", "Demo invoice — scan & pay", 50_000_000, { daysAgo: 1, dueInDays: 14 });
invoice(5, rand(4), "open", "Meridian Collective", "Landing page illustration", 320_000_000, { daysAgo: 20, dueInDays: 14, overdue: true });
invoice(null, rand(4), "draft", "New client", "Discovery call — draft", 75_000_000, { daysAgo: 0 });

// disclosure link for the paid invoice
insDisc.run(rand(16), paidId, rand(24).replace(/[^a-zA-Z0-9_-]/g, "a"), "CPA firm", now + 14 * day, now);

// counters
sqlite.prepare("INSERT INTO counters VALUES (?,?)").run("invoiceSeq", 5);
sqlite.prepare("INSERT INTO counters VALUES (?,?)").run("diversifier:vk-1", 5);

console.log("seeded", DB_PATH);
console.log("demo pay page: /i/demo");
