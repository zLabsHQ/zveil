export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-7 w-48 animate-pulse rounded-md bg-surface-sunken" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[92px] animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
      <div className="h-[320px] animate-pulse rounded-lg border border-border bg-surface" />
    </div>
  );
}
