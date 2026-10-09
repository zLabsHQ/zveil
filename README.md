# Zveil

**Private invoices and payment requests for people and teams paid in Zcash.**
Stripe Invoicing for shielded ZEC — create an invoice, get a unique shielded address, watch it reconcile itself.

Built for the Colosseum "Crypto World's Fair" hackathon — Zcash track.

## What it does

- **Connect a viewing key (UFVK)** — Zveil watches your wallet but can never move funds. No seed phrase, no custody.
- **One address per invoice** — every invoice derives a fresh diversified shielded address, so payments reconcile without memos and without linking your customers.
- **ZIP-321 pay links + QR** — the hosted pay page (`/i/...`) gives the payer a QR, a copyable address, and an "Open in wallet" deep link.
- **Live detection** — mempool detection → confirmation ring → `Paid`, pushed over SSE. Partial and overpayment handled.
- **Receipts, disclosures, exports** — Ed25519-signed receipts, invoice-scoped accountant links (selective disclosure without leaking the viewing key), CSV export.
- **Ironwood-aware** — built for the NU6.3 upgrade; payments are labelled by pool.

## Layout

```
apps/web            Next.js 16 app — landing, merchant dashboard, hosted pay pages, receipts
packages/zip321     ZIP-321 URI builder/parser (TypeScript, dependency-free)
packages/db         Drizzle schema + client (SQLite for the demo; Postgres-shaped)
services/scanner    Rust (axum) viewing-key scanner — detects payments, signs webhook events
docs/               Product spec, architecture, design system ("Quiet Ledger"), pitch deck
```

## Run it (demo mode, zero infrastructure)

```bash
pnpm install

# 1. the payment scanner (Rust)
pnpm scanner            # http://localhost:8080 — runs in demo mode by default

# 2. the web app
pnpm --filter @zveil/web seed   # optional: demo workspace "Maya Lin Studio" + invoices
pnpm dev                        # http://localhost:3010
```

Then walk the demo: open `/i/demo` (seeded open invoice) → hit **"simulate wallet payment"** → watch
`Payment seen → 3/3 confirmations → Paid` → open the receipt → export CSV.

### Real chain mode (regtest via `ths`)

```bash
ths start --no-open                              # local regtest + lightwalletd on :9067
SCANNER_MODE=chain LIGHTWALLETD_URL=http://localhost:9067 pnpm scanner
```

Chain mode decodes the real UFVK you import, derives real diversified `uregtest1…`
addresses, and trial-decrypts compact blocks (Orchard + Ironwood, NU6.3) to emit the
same signed `payment.detected → payment.mined` events demo mode produces.

## Tests

```bash
pnpm --filter @zveil/zip321 test   # 8 tests — URI build/parse, memos, amounts
pnpm --filter @zveil/web build
cargo check --manifest-path services/scanner/Cargo.toml
```

## Security model

- The app never touches a spending key — UFVK only.
- Scanner→app webhooks are HMAC-SHA256 signed and deduplicated.
- Disclosure links are scoped to one invoice, expirable and revocable.
- Address allocation is deterministic per viewing key (diversifier index counter).

## Roadmap (post-hackathon)

Neon/Postgres, auth + workspaces, recurring invoices, public API, FROST team treasuries
(integrating ZF tooling/Konclave), payouts/payroll, NEAR Intents cross-asset funding.

`docs/` has the full spec. MIT.
