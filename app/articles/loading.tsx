function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-line ${className ?? ""}`}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 40%, rgba(255,255,255,0.06) 60%, transparent 100%)",
        backgroundSize: "200% 100%",
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      }}
    />
  );
}

function CardSkeleton() {
  return (
    <div className="panel overflow-hidden">
      <div className="relative h-40 overflow-hidden rounded-t-[inherit] bg-[linear-gradient(135deg,rgba(235,94,40,0.18),rgba(53,141,123,0.14))] md:h-44">
        <Shimmer className="absolute inset-0 rounded-none opacity-40" />
        <div className="absolute left-3 top-3">
          <Shimmer className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="space-y-3 p-4 md:p-4.5">
        <div className="flex justify-end">
          <Shimmer className="h-3 w-20 rounded-full" />
        </div>
        <Shimmer className="h-6 w-4/5 rounded-xl" />
        <Shimmer className="h-4 w-full rounded-lg" />
        <Shimmer className="h-4 w-2/3 rounded-lg" />
        <Shimmer className="h-9 w-28 rounded-full" />
      </div>
    </div>
  );
}

export default function ArticlesLoading() {
  return (
    <div className="shell-container py-6 md:py-9">
      {/* News hero banner skeleton */}
      <section className="panel news-hero relative isolate min-h-[15.5rem] overflow-hidden px-5 py-6 md:px-8 md:py-8">
        <div className="news-hero-overlay" aria-hidden="true" />
        <div className="absolute inset-0 -z-3 bg-[linear-gradient(135deg,rgba(235,94,40,0.14),rgba(53,141,123,0.10))]" />
        <div className="relative z-1 space-y-3.5">
          <Shimmer className="h-6 w-28 rounded-full opacity-60" />
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <Shimmer className="h-10 w-72 rounded-2xl md:h-14 md:w-96" />
              <Shimmer className="h-4 w-64 rounded-xl opacity-70" />
            </div>
          </div>
        </div>
      </section>

      {/* Articles grid + sidebar */}
      <div className="mt-6 grid gap-5 md:mt-8 lg:grid-cols-[1fr_280px]">
        <div className="grid-auto-fit">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <aside className="space-y-5">
          {/* Archive note skeleton */}
          <div className="panel p-5">
            <Shimmer className="h-4 w-full rounded-lg" />
            <Shimmer className="mt-2 h-4 w-3/4 rounded-lg" />
          </div>
          {/* Recommendations sidebar skeleton */}
          <div className="panel p-5 md:p-6">
            <Shimmer className="h-5 w-28 rounded-full" />
            <Shimmer className="mt-3 h-7 w-3/4 rounded-xl" />
            <Shimmer className="mt-2.5 h-4 w-full rounded-lg" />
            <Shimmer className="mt-1.5 h-4 w-2/3 rounded-lg" />
            <div className="mt-4 flex items-center justify-between">
              <Shimmer className="h-4 w-8 rounded-md" />
              <Shimmer className="h-9 w-24 rounded-full" />
            </div>
          </div>
        </aside>
      </div>

      {/* Pagination skeleton */}
      <div className="mt-6 flex items-center justify-between md:mt-8">
        <Shimmer className="h-9 w-28 rounded-full" />
        <Shimmer className="h-4 w-16 rounded-md" />
        <Shimmer className="h-9 w-28 rounded-full" />
      </div>
    </div>
  );
}
