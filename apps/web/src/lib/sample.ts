import { createDb, invoices, payments, counters } from "@zveil/db";
import { randomBytes } from "node:crypto";

// Clearly-labelled sample history so a fresh sandbox shows how Zveil looks
// with a few months of activity. Sample invoices have no public pay page and
// can be cleared in one click; real testnet invoices are never marked sample.

const DAY = 86_400_000;
const ZEC = 100_000_000;

type Sample = {
  client: string;
  description: string;
  zec: number;
  daysAgo: number;
  dueIn: number;
  status: string;
  paid?: { ratio: number; afterDays: number; pool: "ironwood" | "orchard"; usd: number };
};

const SAMPLES: Sample[] = [
  { client: "Nighthawk Labs", description: "Brand system — phase 1", zec: 2.5, daysAgo: 74, dueIn: 14, status: "paid", paid: { ratio: 1, afterDays: 3, pool: "orchard", usd: 1184.2 } },
  { client: "Signal Foundry", description: "Research sprint", zec: 1.2, daysAgo: 52, dueIn: 14, status: "paid", paid: { ratio: 1, afterDays: 6, pool: "ironwood", usd: 1221.7 } },
  { client: "Helios Research", description: "Protocol diagrams", zec: 0.8, daysAgo: 33, dueIn: 14, status: "paid", paid: { ratio: 1, afterDays: 2, pool: "ironwood", usd: 1263.4 } },
  { client: "Acme DAO", description: "Illustration set (12)", zec: 1.8, daysAgo: 30, dueIn: 14, status: "partially_paid", paid: { ratio: 0.4, afterDays: 5, pool: "ironwood", usd: 1249.9 } },
  { client: "Orbit Collective", description: "Landing page copy", zec: 0.5, daysAgo: 9, dueIn: 14, status: "overpaid", paid: { ratio: 1.1, afterDays: 1, pool: "ironwood", usd: 1290.5 } },
  { client: "Meridian Studio", description: "Discovery workshop — draft", zec: 0.75, daysAgo: 1, dueIn: 14, status: "draft" },
];

export async function seedSampleData(workspaceId: string) {
  const db = createDb(process.env.DATABASE_URL!);
  const now = Date.now();
  let seq = 0;
  const invRows: (typeof invoices.$inferInsert)[] = [];
  const payRows: (typeof payments.$inferInsert)[] = [];

  for (const s of SAMPLES) {
    const id = randomBytes(16).toString("hex");
    const created = now - s.daysAgo * DAY;
    const amountZats = Math.round(s.zec * ZEC);
    const sent = s.status !== "draft";
    const paidAt = s.paid && s.paid.ratio >= 1 ? created + s.paid.afterDays * DAY : null;
    invRows.push({
      id,
      workspaceId,
      seq: sent ? ++seq : null,
      status: s.status,
      clientName: s.client,
      description: s.description,
      itemsJson: JSON.stringify([{ description: s.description, qty: 1, unitZats: amountZats }]),
      amountZats,
      dueDate: created + s.dueIn * DAY,
      confirmationsRequired: 1,
      firstSeenAt: s.paid ? created + s.paid.afterDays * DAY : null,
      paidAt,
      sample: true,
      createdAt: created,
      updatedAt: now,
    });
    if (s.paid) {
      const txid = randomBytes(32).toString("hex");
      payRows.push({
        id: `${txid}:${s.paid.pool}:0`,
        invoiceId: id,
        txid,
        pool: s.paid.pool,
        outputIndex: 0,
        zats: Math.round(amountZats * s.paid.ratio),
        minedHeight: 4_400_000 + Math.round((70 - s.daysAgo) * 1150),
        confirmations: 12,
        seenAt: created + s.paid.afterDays * DAY,
        rateUsdCents: Math.round(s.paid.usd * 100),
      });
    }
  }

  await db.insert(invoices).values(invRows);
  if (payRows.length) await db.insert(payments).values(payRows);
  await db
    .insert(counters)
    .values({ key: `invoiceSeq:${workspaceId}`, value: seq })
    .onConflictDoNothing();
}
