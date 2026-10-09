# @z-labs/zip321

**ZIP-321 payment request URIs for Zcash** — build and parse `zcash:` URIs with strict spec compliance. TypeScript, zero dependencies, works in Node, browsers, and edge runtimes.

```bash
npm install @z-labs/zip321
```

## Usage

```ts
import { buildPaymentUri, parsePaymentUri } from "@z-labs/zip321";

// Build a payment request
const uri = buildPaymentUri([
  {
    address: "u1q7xn4zv8w2…",            // unified or transparent address
    amountZats: 250_000_000,            // 2.5 ZEC — integers only, no float drift
    memoText: "Invoice INV-0007",       // encoded as base64url, no padding
    label: "Maya Lin Studio",
    message: "Consulting — March retainer",
  },
]);
// → zcash:u1q7xn4zv8w2…?amount=2.5&memo=SW52b2ljZSBJTlYtMDAwNw&…

// Parse a URI a wallet produced
const { payments } = parsePaymentUri(uri);
// payments[0] → { index, address, amountZats, memoText, message, label, params }
```

Multi-payment requests emit indexed params (`address.1`, `amount.1`, …) automatically:

```ts
buildPaymentUri([
  { address: "u1aaa…", amount: "0.5", label: "Deposit" },
  { address: "u1bbb…", amount: "0.25", label: "Balance" },
]);
// → zcash:?address.1=u1aaa…&amount.1=0.5&address.2=u1bbb…&amount.2=0.25…
```

## API

| Export | Signature | Notes |
| --- | --- | --- |
| `buildPaymentUri` | `(payments: Zip321Payment[]) => string` | Throws on missing address or invalid params |
| `parsePaymentUri` | `(uri: string) => ParsedPaymentUri` | Throws on malformed input; binary memos are preserved raw in `memo` |
| `zecToZats` | `(amount: string) => bigint` | Rejects >8 decimals |
| `zatsToZec` | `(zats: bigint \| number) => string` | Trailing zeros trimmed |
| `base64UrlEncode` / `base64UrlDecode` | memo helpers | No padding, `+` `/` `=` rejected |

## Errors

Both builders and parsers throw `Error` on spec violations — they never return partial results:

- `buildPaymentUri` — empty payment list, missing `address`, both `amount` and `amountZats` set, invalid `paramindex`, or memos containing characters outside base64url.
- `parsePaymentUri` — non-`zcash:` scheme, params without values, duplicate params at the same index, or amounts exceeding 8 decimals.
- Amounts are handled as **zatoshi integers** internally (`bigint`), so there's no floating-point drift in either direction.

## What's in scope / out of scope

In scope: URI construction, parsing, and validation per the spec — including multi-payment indexing, `req-*` params, and memo encode/decode. Out of scope: address *validation* (the URI layer doesn't know a UA from a transparent address — verify with your address library before signing).

## Spec compliance

- Scheme `zcash:`, params grouped per-payment by `paramindex` (`address.0`, `amount.0`, …)
- `amount` is decimal ZEC with ≤ 8 decimal places — never floats, never scientific notation
- `memo` is base64url **without padding** per ZIP-321; invalid characters are rejected
- `label` / `message` are `qchar`-encoded; `req-*` params supported via `requiredParams`

Reference: [ZIP-321 — Payment Request URIs](https://zips.z.cash/zip-0321)

## License

MIT
