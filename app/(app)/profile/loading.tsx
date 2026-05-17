function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-navy-surface ${className ?? ""}`}
      aria-hidden="true"
    />
  );
}

export default function ProfileLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Skeleton className="mb-4 h-3 w-28 rounded-full" />

      {/* Header card */}
      <div className="mb-4 rounded-2xl border border-navy-border bg-navy-dark p-4 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
            <div>
              <Skeleton className="h-6 w-36" />
              <Skeleton className="mt-1.5 h-3 w-48 rounded-full" />
              <Skeleton className="mt-2 h-5 w-24 rounded-full" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-14 w-14 shrink-0" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Attribute circles */}
      <div className="mb-4 rounded-2xl border border-navy-border bg-navy-dark p-4 sm:p-6">
        <Skeleton className="mb-4 h-3 w-32 rounded-full" />
        <div className="flex items-center justify-around gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-3 w-8 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-navy-border bg-navy-dark p-3 text-center">
            <Skeleton className="mx-auto h-3 w-8 rounded-full" />
            <Skeleton className="mx-auto mt-2 h-5 w-10" />
          </div>
        ))}
      </div>

      {/* Info row */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-navy-border bg-navy-dark p-3">
            <Skeleton className="h-3 w-20 rounded-full" />
            <Skeleton className="mt-1.5 h-5 w-12" />
          </div>
        ))}
      </div>

      {/* Match history */}
      <div className="mb-6">
        <Skeleton className="mb-3 h-3 w-28 rounded-full" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-navy-border bg-navy-dark px-4 py-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-1 h-3 w-24 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Memory Vault */}
      <div>
        <Skeleton className="mb-4 h-3 w-40 rounded-full" />
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-navy-border bg-navy-dark p-5">
              <Skeleton className="mb-3 h-3 w-24 rounded-full" />
              <div className="flex items-center justify-between gap-4">
                <Skeleton className="h-5 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-10" />
                  <Skeleton className="h-10 w-10" />
                </div>
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="mt-3 h-3 w-full rounded-full" />
              <Skeleton className="mt-1.5 h-3 w-3/4 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
