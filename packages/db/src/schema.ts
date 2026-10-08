import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

// Single-workspace model for the hackathon demo (multi-tenant later).
export const workspaces = sqliteTable("workspaces", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  email: text("email"),
  defaultConfirmations: integer("default_confirmations").notNull().default(3),
  createdAt: integer("created_at").notNull(),
});

export const viewingKeys = sqliteTable("viewing_keys", {
  id: text("id").primaryKey(),
  workspaceId: text("workspace_id").notNull(),
  fingerprint: text("fingerprint").notNull().unique(),
  network: text("network").notNull(), // "regtest" | "testnet" | "main"
  scannerAccountId: text("scanner_account_id").notNull().unique(),
  keyRef: text("key_ref"), // env ref / sealed key id — never the raw UFVK
  createdAt: integer("created_at").notNull(),
});

export const invoices = sqliteTable(
  "invoices",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    seq: integer("seq"), // INV-XXXX — allocated at send time
    slug: text("slug").unique(), // public pay-page slug
    status: text("status").notNull().default("draft"),
    // draft | open | seen | partially_paid | paid | overpaid | overdue | void
    clientName: text("client_name").notNull(),
    clientEmail: text("client_email"),
    description: text("description").notNull().default(""),
    itemsJson: text("items_json").notNull().default("[]"),
    amountZats: integer("amount_zats", { mode: "number" }).notNull(),
    fiat: text("fiat"), // "USD" | null
    amountFiatCents: integer("amount_fiat_cents"),
    rateFiatPerZec: integer("rate_fiat_per_zec", { mode: "number" }), // snapshot, cents
    dueDate: integer("due_date"),
    memoSeed: text("memo_seed"), // ZP-XXXX fallback token
    diversifierIndex: integer("diversifier_index"),
    address: text("address"),
    zip321Uri: text("zip321_uri"),
    viewingKeyId: text("viewing_key_id"),
    confirmationsRequired: integer("confirmations_required").notNull().default(3),
    firstSeenAt: integer("first_seen_at"),
    paidAt: integer("paid_at"),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [uniqueIndex("invoices_slug_idx").on(t.slug)],
);

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull(),
  txid: text("txid").notNull(),
  pool: text("pool").notNull(), // "ironwood" | "orchard" | "sapling" | "transparent"
  outputIndex: integer("output_index").notNull(),
  zats: integer("zats", { mode: "number" }).notNull(),
  memoPreview: text("memo_preview"),
  minedHeight: integer("mined_height"),
  confirmations: integer("confirmations").notNull().default(0),
  seenAt: integer("seen_at").notNull(),
  reorgedAt: integer("reorged_at"),
});

export const scannerEvents = sqliteTable("scanner_events", {
  eventId: text("event_id").primaryKey(), // dedup
  invoiceId: text("invoice_id"),
  type: text("type").notNull(),
  receivedAt: integer("received_at").notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
});

export const disclosures = sqliteTable("disclosures", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull(),
  token: text("token").notNull().unique(),
  label: text("label").notNull().default("Viewer"),
  expiresAt: integer("expires_at").notNull(),
  revokedAt: integer("revoked_at"),
  createdAt: integer("created_at").notNull(),
});

export const counters = sqliteTable("counters", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
});
