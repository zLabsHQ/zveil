# @zveil/zip321

ZIP-321 Zcash payment-request URIs — build and parse. TypeScript, zero dependencies.

```ts
import { buildPaymentUri, parsePaymentUri } from "@zveil/zip321";

const uri = buildPaymentUri({
  address: "uregtest1...",
  amountZats: 250_000_000,          // 2.5 ZEC — max 8 decimals enforced
  memoUtf8: "Invoice INV-0007",     // encoded base64url, no padding
  label: "Maya Lin Studio",
  message: "Invoice INV-0007",
});

const parsed = parsePaymentUri(uri);
// → [{ address, amountZats, memoUtf8, label, message }]
```

- Single- and multi-payment URIs (indexed params `addr.0`, `amount.0`, …)
- ZEC ⇄ zatoshis conversion without float drift
- Rejects amounts with >8 decimals, invalid memos, and malformed params

Built for [Zveil](https://github.com) — MIT.
