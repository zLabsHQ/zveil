import { pgTable, text, integer, bigint, boolean, uniqueIndex, index } from "drizzle-orm/pg-core";

// One workspace per visitor (cookie-provisioned sandbox) — every query is scoped by it.
export const workspaces = pgTable("workspaces", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  email: text("email"),
  network: text("network").notNull().default("testnet"),
  defaultConfirmations: integer("default_confirmations").notNull().default(3),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

// A scanner account may be shared across sandbox workspaces (the shared
// testnet key); diversifier counters are keyed by scanner account, so
// addresses stay unique per invoice regardless.
export const viewingKeys = pgTable(
  "viewing_keys",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    fingerprint: text("fingerprint").notNull(),
    network: text("network").notNull(), // "regtest" | "testnet" | "main"
    scannerAccountId: text("scanner_account_id").notNull(),
    shared: boolean("shared").notNull().default(false),
    keyRef: text("key_ref"), // env ref / sealed key id — never the raw UFVK
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (t) => [index("viewing_keys_ws_idx").on(t.workspaceId)],
);

export const invoices = pgTable(
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
    amountZats: bigint("amount_zats", { mode: "number" }).notNull(),
    fiat: text("fiat"), // "USD" | null
    amountFiatCents: bigint("amount_fiat_cents", { mode: "number" }),
    rateFiatPerZec: bigint("rate_fiat_per_zec", { mode: "number" }), // snapshot, cents
    dueDate: bigint("due_date", { mode: "number" }),
    memoSeed: text("memo_seed"), // ZP-XXXX fallback token
    diversifierIndex: integer("diversifier_index"),
    address: text("address"),
    zip321Uri: text("zip321_uri"),
    viewingKeyId: text("viewing_key_id"),
    confirmationsRequired: integer("confirmations_required").notNull().default(3),
    firstSeenAt: bigint("first_seen_at", { mode: "number" }),
    paidAt: bigint("paid_at", { mode: "number" }),
    sample: boolean("sample").notNull().default(false),
    reconResolvedAt: bigint("recon_resolved_at", { mode: "number" }),
    reconNote: text("recon_note"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
  },
  (t) => [uniqueIndex("invoices_slug_idx").on(t.slug), index("invoices_ws_idx").on(t.workspaceId)],
);

export const payments = pgTable("payments", {
  id: text("id").primaryKey(),
  invoiceId: text("invoice_id").notNull(),
  txid: text("txid").notNull(),
  pool: text("pool").notNull(), // "ironwood" | "orchard" | "sapling" | "transparent"
  outputIndex: integer("output_index").notNull(),
  zats: bigint("zats", { mode: "number" }).notNull(),
  memoPreview: text("memo_preview"),
  minedHeight: integer("mined_height"),
  confirmations: integer("confirmations").notNull().default(0),
  seenAt: bigint("seen_at", { mode: "number" }).notNull(),
  reorgedAt: bigint("reorged_at", { mode: "number" }),
  rateUsdCents: bigint("rate_usd_cents", { mode: "number" }), // ZEC/USD at time received (cents per ZEC)
});

export const scannerEvents = pgTable("scanner_events", {
  eventId: text("event_id").primaryKey(), // dedup
  invoiceId: text("invoice_id"),
  type: text("type").notNull(),
  receivedAt: bigint("received_at", { mode: "number" }).notNull(),
  payloadJson: text("payload_json").notNull().default("{}"),
});

// Scoped, expiring read-only links: one invoice, or an income statement for a period.
export const disclosures = pgTable("disclosures", {
  id: text("id").primaryKey(),
  kind: text("kind").notNull().default("invoice"), // "invoice" | "statement"
  workspaceId: text("workspace_id"),
  invoiceId: text("invoice_id"),
  periodFrom: bigint("period_from", { mode: "number" }),
  periodTo: bigint("period_to", { mode: "number" }),
  token: text("token").notNull().unique(),
  label: text("label").notNull().default("Viewer"),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  revokedAt: bigint("revoked_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
});

export const counters = pgTable("counters", {
  key: text("key").primaryKey(),
  value: integer("value").notNull().default(0),
});

// WebAuthn passkeys that unlock a workspace (no email, no password).
export const passkeys = pgTable(
  "passkeys",
  {
    id: text("id").primaryKey(),
    workspaceId: text("workspace_id").notNull(),
    credentialId: text("credential_id").notNull(), // base64url credential id
    publicKey: text("public_key").notNull(), // base64url COSE public key
    counter: bigint("counter", { mode: "number" }).notNull().default(0),
    transports: text("transports"), // comma-separated, for hints only
    deviceType: text("device_type"), // "multiDevice" (synced) | "singleDevice" (this device only)
    backedUp: boolean("backed_up").notNull().default(false),
    name: text("name").notNull().default("Passkey"),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
    lastUsedAt: bigint("last_used_at", { mode: "number" }),
  },
  (t) => [uniqueIndex("passkeys_credential_id").on(t.credentialId), index("passkeys_workspace").on(t.workspaceId)],
);

// One-time recovery code (SHA-256 hash) — shown once at passkey setup.
export const recoveryCodes = pgTable("recovery_codes", {
  workspaceId: text("workspace_id").primaryKey(),
  codeHash: text("code_hash").notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  usedAt: bigint("used_at", { mode: "number" }),
});
