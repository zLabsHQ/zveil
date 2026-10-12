const wallets = ["ZODL", "Zingo!", "Zkool", "Vizor", "Keystone", "Edge", "Cake Wallet"];

export function WalletStrip() {
  return (
    <div className="border-y border-border bg-surface">
      <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-5 sm:px-8">
        <span className="text-xs font-medium uppercase tracking-[0.06em] text-ink-faint">
          Works with every Zcash wallet
        </span>
        {wallets.map((w) => (
          <span key={w} className="text-sm font-medium text-ink-faint">
            {w}
          </span>
        ))}
      </div>
    </div>
  );
}
