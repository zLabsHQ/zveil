/**
 * @z-labs/zip321 — ZIP-321 Zcash payment request URIs.
 *
 * Spec: https://zips.z.cash/zip-0321
 * - Scheme: zcash:<address>?<params>
 * - Params per payment are grouped by `paramindex` (e.g. `address.1=`, `amount.1=`).
 * - `memo` is base64url WITHOUT padding; `+`, `/`, `=` are rejected.
 * - `amount` is decimal ZEC, up to 8 decimal places.
 */
export interface Zip321Payment {
    address?: string;
    /** Amount in decimal ZEC as a string, max 8 dp. */
    amount?: string;
    /** Amount in zatoshis (convenience; mutually exclusive with `amount`). */
    amountZats?: bigint | number;
    /** Plain text memo — encoded to base64url. */
    memoText?: string;
    /** Pre-encoded base64url memo (no padding). */
    memo?: string;
    /** Display message (qchar, URI-encoded). */
    message?: string;
    /** Label (qchar, URI-encoded). */
    label?: string;
    /** req-* params, e.g. { "req-something": "1" } */
    requiredParams?: Record<string, string>;
    /** Other free-form params. */
    extraParams?: Record<string, string>;
}
export declare function base64UrlEncode(text: string): string;
export declare function base64UrlDecode(b64url: string): Uint8Array;
export declare function zecToZats(amount: string): bigint;
export declare function zatsToZec(zats: bigint | number): string;
/**
 * Build a ZIP-321 URI. `payments.length > 1` emits indexed params
 * (`address.1=`, `amount.1=`…). Single payment puts the address in the URI path.
 */
export declare function buildPaymentUri(payments: Zip321Payment[]): string;
export interface ParsedPayment {
    index: number;
    address?: string;
    amountZats?: bigint;
    memo?: string;
    memoText?: string;
    message?: string;
    label?: string;
    params: Record<string, string>;
}
export interface ParsedPaymentUri {
    payments: ParsedPayment[];
}
/** Parse a ZIP-321 URI. Throws on malformed input. */
export declare function parsePaymentUri(uri: string): ParsedPaymentUri;
