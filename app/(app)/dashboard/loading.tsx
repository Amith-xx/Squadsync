function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-navy-surface ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export default function DashboardLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      {/* Welcome header */}
      <div className="mb-8">
        <Skeleton className="h-3.5 w-28" />
        <Skeleton className="mt-2.5 h-9 w-48" />
        <Skeleton className="mt-2 h-6 w-32" />
      </div>

      {/* Quick stats row */}
      <div className="mb-8 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-navy-border bg-navy-dark p-4 text-center">
            <Skeleton className="mx-auto h-3 w-20 rounded-full" />
            <Skeleton className="mx-auto mt-2 h-9 w-14" />
          </div>
        ))}
      </div>

      {/* Position */}
      <div className="mb-8 rounded-xl border border-navy-border bg-navy-dark px-5 py-4">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="mt-2 h-7 w-16" />
      </div>

      {/* Find a game */}
      <div className="mb-8 rounded-2xl border border-navy-border/50 bg-neon-green/5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="mt-2 h-7 w-36" />
            <Skeleton className="mt-1.5 h-4 w-52 rounded-full" />
          </div>
          <Skeleton className="h-10 w-28 shrink-0" />
        </div>
      </div>

      {/* Profile link */}
      <div className="rounded-2xl border border-navy-border bg-navy-dark p-6">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="mt-3 h-7 w-32" />
        <Skeleton className="mt-1 h-4 w-56 rounded-full" />
        <Skeleton className="mt-4 h-4 w-24 rounded-full" />
      </div>
    </main>
  );
}
