import { createDb, type Db, workspaces, viewingKeys } from "@zveil/db";
import { eq } from "drizzle-orm";

let _db: Db | null = null;

// Postgres via Neon HTTP (DATABASE_URL). Schema is applied out-of-band with
// `pnpm --filter @zveil/db db:push`, so the client is cheap to create.
export function db(): Db {
  if (!_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set");
    _db = createDb(url);
  }
  return _db;
}

// Single demo workspace — the merchant using Zveil.
async function seed() {
  const existing = await db().select().from(workspaces).limit(1);
  if (existing.length === 0) {
    await db()
      .insert(workspaces)
      .values({
        id: "ws-demo",
        businessName: process.env.BUSINESS_NAME ?? "Maya Lin Studio",
        email: "maya@example.com",
        defaultConfirmations: 3,
        createdAt: Date.now(),
      });
  }
}

export async function workspace() {
  await seed();
  const rows = await db().select().from(workspaces).limit(1);
  return rows[0];
}

export async function viewingKey() {
  const ws = await workspace();
  const rows = await db()
    .select()
    .from(viewingKeys)
    .where(eq(viewingKeys.workspaceId, ws.id))
    .limit(1);
  return rows[0] ?? null;
}
