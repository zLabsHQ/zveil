import { describe, it, expect } from "vitest";
import {
  buildPaymentUri,
  parsePaymentUri,
  base64UrlEncode,
  base64UrlDecode,
  zecToZats,
  zatsToZec,
} from "../src/index.js";

const UA = "u1q7xzveildemoaddress9k9w7";

describe("buildPaymentUri", () => {
  it("builds a single-payment URI with amount + memo + message", () => {
    const uri = buildPaymentUri([
      {
        address: UA,
        amountZats: 250_000_000n,
        memoText: "ZP-7F3A",
        message: "Invoice INV-0007",
      },
    ]);
    expect(uri.startsWith(`zcash:${UA}?`)).toBe(true);
    expect(uri).toContain("amount=2.5");
    expect(uri).toContain(`memo=${base64UrlEncode("ZP-7F3A")}`);
    expect(uri).toContain("message=Invoice%20INV-0007");
  });

  it("encodes memos as base64url without padding or +//=", () => {
    const enc = base64UrlEncode("hello?+/=world");
    expect(enc).not.toMatch(/[+/=]/);
    expect(new TextDecoder().decode(base64UrlDecode(enc))).toBe("hello?+/=world");
  });

  it("rejects amounts with >8dp", () => {
    expect(() =>
      buildPaymentUri([{ address: UA, amount: "1.000000001" }]),
    ).toThrow();
  });

  it("rejects invalid memo characters", () => {
    expect(() =>
      buildPaymentUri([{ address: UA, memo: "ab+/=" }]),
    ).toThrow();
  });

  it("builds multi-payment URIs with indexed params", () => {
    const uri = buildPaymentUri([
      { address: "u1aaa", amountZats: 100_000_000n },
      { address: "u1bbb", amountZats: 50_000_000n },
    ]);
    expect(uri).toContain("address.0=u1aaa&amount.0=1");
    expect(uri).toContain("address.1=u1bbb&amount.1=0.5");
    expect(uri.startsWith("zcash:?")).toBe(true);
  });
});

describe("parsePaymentUri", () => {
  it("round-trips a single payment", () => {
    const uri = buildPaymentUri([
      {
        address: UA,
        amountZats: 123_456_789n,
        memoText: "hi",
        message: "rent for October",
        label: "Maya Lin Studio",
      },
    ]);
    const { payments } = parsePaymentUri(uri);
    expect(payments).toHaveLength(1);
    const p = payments[0];
    expect(p.address).toBe(UA);
    expect(p.amountZats).toBe(123_456_789n);
    expect(p.memoText).toBe("hi");
    expect(p.message).toBe("rent for October");
    expect(p.label).toBe("Maya Lin Studio");
  });

  it("rejects non-zcash URIs and malformed params", () => {
    expect(() => parsePaymentUri("http://x")).toThrow();
    expect(() => parsePaymentUri("zcash:u1x?amount=abc")).toThrow();
    expect(() => parsePaymentUri("zcash:u1x?foo")).toThrow();
  });
});

describe("zats ↔ zec", () => {
  it("converts cleanly", () => {
    expect(zecToZats("2.5")).toBe(250_000_000n);
    expect(zecToZats("0.00000001")).toBe(1n);
    expect(zatsToZec(250_000_000n)).toBe("2.5");
    expect(zatsToZec(1n)).toBe("0.00000001");
    expect(zatsToZec(100_000_000n)).toBe("1");
  });
});
