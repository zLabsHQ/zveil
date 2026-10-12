const wallets = ["ZODL", "Zingo!", "Zkool", "Vizor", "Keystone", "Edge", "Cake Wallet", "YWallet"];

export function WalletStrip() {
  const row = [...wallets, ...wallets];
  return (
    <div className="border-y border-border bg-surface">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 overflow-hidden px-4 py-4 sm:gap-8 sm:px-8 sm:py-5">
        <span className="shrink-0 text-xs font-medium uppercase tracking-[0.06em] text-ink-faint max-sm:hidden">
          Pay from any shielded wallet
        </span>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <div className="flex w-max animate-marquee gap-10">
            {row.map((w, i) => (
              <span key={`${w}-${i}`} className="whitespace-nowrap text-sm font-medium text-ink-faint">
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
