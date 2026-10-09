/**
 * @z-labs/zip321 — ZIP-321 Zcash payment request URIs.
 *
 * Spec: https://zips.z.cash/zip-0321
 * - Scheme: zcash:<address>?<params>
 * - Params per payment are grouped by `paramindex` (e.g. `address.1=`, `amount.1=`).
 * - `memo` is base64url WITHOUT padding; `+`, `/`, `=` are rejected.
 * - `amount` is decimal ZEC, up to 8 decimal places.
 */
const B64URL = /^[A-Za-z0-9\-_]*$/;
const AMOUNT_RE = /^\d+(\.\d{1,8})?$/;
const PARAM_INDEX_RE = /^\.[0-9]{1,4}$/;
export function base64UrlEncode(text) {
    const bytes = new TextEncoder().encode(text);
    let bin = "";
    for (const b of bytes)
        bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
export function base64UrlDecode(b64url) {
    if (!B64URL.test(b64url))
        throw new Error("Invalid base64url characters");
    const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const bin = atob(b64 + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++)
        bytes[i] = bin.charCodeAt(i);
    return bytes;
}
export function zecToZats(amount) {
    if (!AMOUNT_RE.test(amount))
        throw new Error(`Invalid ZEC amount: ${amount}`);
    const [whole, frac = ""] = amount.split(".");
    return BigInt(whole) * 100000000n + BigInt(frac.padEnd(8, "0") || "0");
}
export function zatsToZec(zats) {
    const z = BigInt(zats);
    const whole = z / 100000000n;
    const frac = (z % 100000000n).toString().padStart(8, "0").replace(/0+$/, "");
    return frac ? `${whole}.${frac}` : whole.toString();
}
function validateAmount(amount) {
    if (!AMOUNT_RE.test(amount))
        throw new Error(`Amount must be decimal ZEC with <= 8 decimal places, got: ${amount}`);
}
function pushParam(parts, index, name, value) {
    const idx = index !== undefined ? `.${index}` : "";
    if (index !== undefined && !PARAM_INDEX_RE.test(idx))
        throw new Error(`Invalid paramindex: ${idx}`);
    parts.push(`${name}${idx}=${value}`);
}
/**
 * Build a ZIP-321 URI. `payments.length > 1` emits indexed params
 * (`address.1=`, `amount.1=`…). Single payment puts the address in the URI path.
 */
export function buildPaymentUri(payments) {
    if (payments.length === 0)
        throw new Error("At least one payment is required");
    const single = payments.length === 1;
    const parts = [];
    let pathAddress = "";
    payments.forEach((p, i) => {
        const idx = single ? undefined : i;
        if (!p.address)
            throw new Error(`Payment ${i} is missing an address`);
        if (single)
            pathAddress = p.address;
        else
            pushParam(parts, idx, "address", p.address);
        let amount = p.amount;
        if (p.amountZats !== undefined) {
            if (amount)
                throw new Error("Provide amount or amountZats, not both");
            amount = zatsToZec(BigInt(p.amountZats));
        }
        if (amount) {
            validateAmount(amount);
            pushParam(parts, idx, "amount", amount);
        }
        if (p.memoText !== undefined && p.memo !== undefined)
            throw new Error("Provide memoText or memo, not both");
        const memo = p.memoText !== undefined ? base64UrlEncode(p.memoText) : p.memo;
        if (memo) {
            if (!B64URL.test(memo))
                throw new Error("Memo must be base64url without padding");
            pushParam(parts, idx, "memo", memo);
        }
        if (p.message)
            pushParam(parts, idx, "message", encodeURIComponent(p.message));
        if (p.label)
            pushParam(parts, idx, "label", encodeURIComponent(p.label));
        for (const [k, v] of Object.entries(p.requiredParams ?? {}))
            pushParam(parts, idx, `req-${k}`, encodeURIComponent(v));
        for (const [k, v] of Object.entries(p.extraParams ?? {}))
            pushParam(parts, idx, k, encodeURIComponent(v));
    });
    return `zcash:${pathAddress}${parts.length ? `?${parts.join("&")}` : ""}`;
}
/** Parse a ZIP-321 URI. Throws on malformed input. */
export function parsePaymentUri(uri) {
    if (!uri.startsWith("zcash:"))
        throw new Error("URI must start with zcash:");
    const rest = uri.slice(6);
    const [pathAddr, query = ""] = rest.split("?", 2);
    const byIndex = new Map();
    const put = (idx, name, value) => {
        if (!byIndex.has(idx))
            byIndex.set(idx, new Map());
        const m = byIndex.get(idx);
        if (m.has(name))
            throw new Error(`Duplicate param ${name} at index ${idx}`);
        m.set(name, value);
    };
    for (const pair of query.split("&").filter(Boolean)) {
        const eq = pair.indexOf("=");
        if (eq === -1)
            throw new Error(`Param missing value: ${pair}`);
        let name = pair.slice(0, eq);
        const value = decodeURIComponent(pair.slice(eq + 1));
        let idx = 0;
        const dot = name.lastIndexOf(".");
        if (dot !== -1) {
            const suffix = name.slice(dot);
            if (!PARAM_INDEX_RE.test(suffix))
                throw new Error(`Invalid paramindex: ${suffix}`);
            idx = Number(suffix.slice(1));
            name = name.slice(0, dot);
        }
        put(idx, name, value);
    }
    if (pathAddr)
        put(0, "address", pathAddr);
    const payments = [...byIndex.entries()].map(([index, m]) => {
        const p = { index, params: {} };
        for (const [k, v] of m) {
            if (k === "address")
                p.address = v;
            else if (k === "amount") {
                validateAmount(v);
                p.amountZats = zecToZats(v);
            }
            else if (k === "memo") {
                p.memo = v;
                try {
                    p.memoText = new TextDecoder().decode(base64UrlDecode(v));
                }
                catch {
                    /* binary memo */
                }
            }
            else if (k === "message")
                p.message = v;
            else if (k === "label")
                p.label = v;
            else
                p.params[k] = v;
        }
        return p;
    });
    return { payments };
}
