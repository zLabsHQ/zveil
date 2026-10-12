import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Zveil — Private books and proof of income for Zcash",
    template: "%s · Zveil",
  },
  description:
    "Invoices that reconcile themselves, and signed proof of income you can share without exposing anything else. Non-custodial, viewing keys only, built on Zcash.",
  metadataBase: new URL(process.env.WEB_BASE_URL ?? "https://zveil.zlabs.tech"),
  openGraph: {
    title: "Zveil — Private books and proof of income for Zcash",
    description:
      "Invoices that reconcile themselves. Signed statements you can share with an accountant. Viewing keys only — never a spending key.",
    siteName: "Zveil",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAFAF9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">{children}</body>
    </html>
  );
}
