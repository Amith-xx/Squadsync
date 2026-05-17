function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-navy-surface ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export default function MatchLoading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12 space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="mt-1.5 h-8 w-48" />
      </div>

      {/* Score banner */}
      <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/5 px-5 py-5">
        <Skeleton className="mx-auto h-3 w-32 rounded-full" />
        <div className="mt-4 flex items-center justify-center gap-4">
          <Skeleton className="h-16 w-16" />
          <Skeleton className="h-8 w-4 rounded-full" />
          <Skeleton className="h-16 w-16" />
        </div>
      </div>

      {/* Teams */}
      {["A", "B"].map((team) => (
        <div key={team}>
          <Skeleton className="mb-2 h-3 w-16 rounded-full" />
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-navy-border bg-navy-dark px-3 py-2.5">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-1 h-3 w-12 rounded-full" />
                </div>
                <Skeleton className="h-6 w-14 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}
