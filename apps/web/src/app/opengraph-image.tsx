import { ImageResponse } from "next/og";

export const alt = "Zveil — private invoices for Zcash";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#FAFAF9",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #4F46E5, #818CF8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 30,
              fontWeight: 700,
            }}
          >
            Z
          </div>
          <div style={{ fontSize: 44, fontWeight: 700, color: "#1C1917" }}>Zveil</div>
        </div>

        <div style={{ fontSize: 64, fontWeight: 700, color: "#1C1917", marginTop: 48, lineHeight: 1.15, display: "flex", flexDirection: "column" }}>
          <span>Private books for money</span>
          <span>you&apos;re paid in Zcash.</span>
        </div>

        <div style={{ fontSize: 28, color: "#78716C", marginTop: 24 }}>
          Invoices that reconcile themselves · signed proof of income · viewing keys only
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 48,
            fontSize: 24,
            color: "#44403C",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              borderRadius: 999,
              background: "#ECFDF5",
              color: "#047857",
              fontWeight: 600,
            }}
          >
            ● Non-custodial
          </div>
          <div
            style={{
              display: "flex",
              padding: "10px 20px",
              borderRadius: 999,
              background: "#EEF2FF",
              color: "#4F46E5",
              fontWeight: 600,
            }}
          >
            Signed proofs · Testnet
          </div>
        </div>
      </div>
    ),
    size,
  );
}
