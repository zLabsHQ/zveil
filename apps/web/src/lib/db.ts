import { createDb, type Db, workspaces, viewingKeys } from "@zveil/db";
import { eq } from "drizzle-orm";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "zveil.db");

let _db: Db | null = null;

export function db(): Db {
  if (!_db) {
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
    _db = createDb(DB_PATH);
    seed();
  }
  return _db;
}

// Single demo workspace — the merchant using Zveil.
function seed() {
  if (!_db) return;
  const existing = _db.select().from(workspaces).all();
  if (existing.length === 0) {
    _db
      .insert(workspaces)
      .values({
        id: "ws-demo",
        businessName: process.env.BUSINESS_NAME ?? "Maya Lin Studio",
        email: "maya@example.com",
        defaultConfirmations: 3,
        createdAt: Date.now(),
      })
      .run();
  }
}

export function workspace() {
  const rows = db().select().from(workspaces).limit(1).all();
  return rows[0];
}

export function viewingKey() {
  const ws = workspace();
  return (
    db().select().from(viewingKeys).where(eq(viewingKeys.workspaceId, ws.id)).all()[0] ?? null
  );
}
