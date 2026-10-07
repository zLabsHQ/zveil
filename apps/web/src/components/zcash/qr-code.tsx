import QRCode from "qrcode";
import { cn } from "@/lib/utils";

interface QrCodeProps {
  value: string;
  size?: number;
  className?: string;
}

// Renders a QR as an inline SVG with rounded modules (the "soft QR" look).
export function QrCode({ value, size = 160, className }: QrCodeProps) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const quiet = 2;
  const total = n + quiet * 2;
  const cell = size / total;
  const cells: boolean[][] = [];
  for (let y = 0; y < n; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < n; x++) row.push(Boolean(qr.modules.get(x, y)));
    cells.push(row);
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("block", className)}
      role="img"
      aria-label="Payment QR code"
    >
      {cells.map((row, y) =>
        row.map((filled, x) =>
          filled ? (
            <rect
              key={`${x}-${y}`}
              x={(x + quiet) * cell}
              y={(y + quiet) * cell}
              width={cell * 0.92}
              height={cell * 0.92}
              rx={cell * 0.34}
              fill="var(--color-ink-strong)"
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
