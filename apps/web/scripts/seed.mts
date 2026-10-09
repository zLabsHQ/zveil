/**
 * Seed a believable demo workspace into Postgres (Neon).
 * Run: DATABASE_URL=... pnpm --filter @zveil/web seed
 */
import { createDb, workspaces, viewingKeys, invoices, payments, disclosures, counters, scannerEvents } from "@zveil/db";
import { randomBytes, createHash } from "node:crypto";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is not set");
const db = createDb(url);

const now = Date.now();
const day = 86_400_000;
const rand = (n: number) => randomBytes(n).toString("hex");
const txid = () => rand(32);
const uaddr = (i: number) => `uregtest1${rand(40).replace(/[^a-z0-9]/g, "q")}${i.toString(16)}`;
const zip321 = (addr: string, zec: number, seq: number) =>
  `zcash:${addr}?amount=${zec}&memo=${Buffer.from(`ZP-${rand(2).toUpperCase()}`).toString("base64url")}&message=${encodeURIComponent(`Invoice INV-${String(seq).padStart(4, "0")}`)}&label=${encodeURIComponent("Maya Lin Studio")}`;

// wipe existing demo data (idempotent reseed)
await db.delete(payments);
await db.delete(disclosures);
await db.delete(scannerEvents);
await db.delete(invoices);
await db.delete(viewingKeys);
await db.delete(counters);
await db.delete(workspaces);

await db.insert(workspaces).values({
  id: "ws-demo",
  businessName: "Maya Lin Studio",
  email: "maya@example.com",
  defaultConfirmations: 3,
  createdAt: now - 30 * day,
});
await db.insert(viewingKeys).values({
  id: "vk-1",
  workspaceId: "ws-demo",
  fingerprint: createHash("sha256").update("demo").digest("hex").slice(0, 16),
  network: "regtest",
  scannerAccountId: "demo-seed",
  keyRef: "env:UFVK_0",
  createdAt: now - 30 * day,
});

async function invoice(
  seq: number | null,
  slug: string,
  status: string,
  client: string,
  desc: string,
  zats: number,
  opts: { daysAgo?: number; dueInDays?: number; paidRatio?: number; fiatCents?: number } = {},
) {
  const id = rand(16);
  const created = now - (opts.daysAgo ?? 0) * day;
  const due = opts.dueInDays !== undefined ? created + opts.dueInDays * day : null;
  const addr = seq != null ? uaddr(seq) : null;
  await db.insert(invoices).values({
    id,
    workspaceId: "ws-demo",
    seq,
    slug,
    status,
    clientName: client,
    clientEmail: null,
    description: desc,
    itemsJson: JSON.stringify([{ description: desc, qty: 1, unitZats: zats }]),
    amountZats: zats,
    fiat: opts.fiatCents ? "USD" : null,
    amountFiatCents: opts.fiatCents ?? null,
    rateFiatPerZec: opts.fiatCents ? 1278 : null,
    dueDate: due,
    memoSeed: `ZP-${rand(2).toUpperCase()}`,
    diversifierIndex: seq != null ? seq - 1 : null,
    address: addr,
    zip321Uri: addr ? zip321(addr, zats / 1e8, seq!) : null,
    viewingKeyId: seq != null ? "vk-1" : null,
    confirmationsRequired: 3,
    firstSeenAt: opts.paidRatio ? created + day : null,
    paidAt: status === "paid" || status === "overpaid" ? created + 2 * day : null,
    createdAt: created,
    updatedAt: now,
  });
  if (opts.paidRatio) {
    await db.insert(payments).values({
      id: `${txid()}:ironwood:0`,
      invoiceId: id,
      txid: txid(),
      pool: "ironwood",
      outputIndex: 0,
      zats: Math.round(zats * opts.paidRatio),
      memoPreview: null,
      minedHeight: 3_512_010,
      confirmations: 3,
      seenAt: created + day,
      reorgedAt: null,
    });
  }
  return id;
}

const paidId = await invoice(4, rand(4), "paid", "Nighthawk Labs", "Brand refresh — deposit", 250_000_000, { daysAgo: 9, dueInDays: 12, paidRatio: 1 });
await invoice(1, rand(4), "paid", "Signal Foundry", "Research sprint", 100_000_000, { daysAgo: 21, dueInDays: 14, paidRatio: 1 });
await invoice(2, rand(4), "partially_paid", "Acme DAO", "Illustration set", 180_000_000, { daysAgo: 6, dueInDays: 21, paidRatio: 0.4 });
await invoice(3, "demo", "open", "ZCG Reviewers", "Demo invoice — scan & pay", 50_000_000, { daysAgo: 1, dueInDays: 14 });
await invoice(5, rand(4), "open", "Meridian Collective", "Landing page illustration", 320_000_000, { daysAgo: 20, dueInDays: 14 });
await invoice(null, rand(4), "draft", "New client", "Discovery call — draft", 75_000_000, { daysAgo: 0 });

await db.insert(disclosures).values({
  id: rand(16),
  invoiceId: paidId,
  token: rand(24).replace(/[^a-zA-Z0-9_-]/g, "a"),
  label: "CPA firm",
  expiresAt: now + 14 * day,
  createdAt: now,
});

await db.insert(counters).values([
  { key: "invoiceSeq", value: 5 },
  { key: "diversifier:vk-1", value: 5 },
]);

console.log("seeded Neon workspace — demo pay page: /i/demo");
