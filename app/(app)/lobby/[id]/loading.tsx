function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-navy-surface ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export default function LobbyLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Skeleton className="h-3 w-36 rounded-full" />
            <Skeleton className="mt-2 h-8 w-48" />
            <Skeleton className="mt-2 h-6 w-32 rounded-full" />
            <Skeleton className="mt-2 h-4 w-64 rounded-full" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </div>

      {/* Stats bar */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-navy-border bg-navy-dark p-3 text-center">
            <Skeleton className="mx-auto h-3 w-14 rounded-full" />
            <Skeleton className="mx-auto mt-1.5 h-8 w-10" />
          </div>
        ))}
      </div>

      {/* Player slots */}
      <div className="space-y-2">
        <Skeleton className="h-3 w-16 rounded-full" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-navy-border bg-navy-dark px-4 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-1.5 h-3 w-20 rounded-full" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-dashed border-navy-border/40 bg-navy-dark/40 px-4 py-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full opacity-30" />
            <Skeleton className="h-4 w-24 opacity-30" />
          </div>
        ))}
      </div>
    </main>
  );
}
