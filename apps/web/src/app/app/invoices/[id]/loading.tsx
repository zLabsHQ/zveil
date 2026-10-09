export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="h-7 w-32 animate-pulse rounded-md bg-surface-sunken" />
        <div className="h-[22px] w-16 animate-pulse rounded-full bg-surface-sunken" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[80px] animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
      <div className="h-[240px] animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}
