"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ZveilWordmark } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "/how", label: "How it works" },
  { href: "/#privacy", label: "Privacy" },
  { href: "/verify", label: "Verify" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full bg-paper/80 backdrop-blur-md transition-shadow duration-200",
        scrolled && "hairline-b",
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1200px] items-center justify-between px-4 sm:px-8">
        <Link href="/" aria-label="Zveil home" className="rounded-sm">
          <ZveilWordmark />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href="/login" className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink sm:inline-flex">
            Log in
          </a>
          <Link href="/onboarding">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
