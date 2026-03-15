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

export default function AppLoading() {
  return (
    <div className="shell-container py-6 md:py-10">
      {/* Hero banner skeleton */}
      <section className="panel grid gap-6 overflow-hidden px-5 py-6 md:grid-cols-[1.2fr_0.8fr] md:px-8 md:py-9">
        <div className="space-y-5">
          <Shimmer className="h-6 w-32 rounded-full" />
          <div className="space-y-3">
            <Shimmer className="h-12 w-4/5 rounded-2xl md:h-16" />
            <Shimmer className="h-5 w-3/5 rounded-xl" />
            <Shimmer className="h-5 w-2/5 rounded-xl" />
          </div>
          <div className="flex gap-2.5">
            <Shimmer className="h-10 w-32 rounded-full" />
            <Shimmer className="h-10 w-36 rounded-full" />
          </div>
        </div>
        {/* Featured card skeleton with gradient bg */}
        <div className="panel relative min-h-[20rem] overflow-hidden bg-[linear-gradient(145deg,rgba(18,14,10,0.85),rgba(18,14,10,0.45)_48%,rgba(18,14,10,0.78))] p-5 md:p-6">
          <div className="absolute inset-0 -z-3 bg-[linear-gradient(135deg,rgba(235,94,40,0.12),rgba(53,141,123,0.10))]" />
          <Shimmer className="h-3 w-24 rounded-full opacity-50" />
          <div className="mt-5 space-y-3.5">
            <Shimmer className="h-5 w-20 rounded-full" />
            <Shimmer className="h-8 w-full rounded-xl" />
            <Shimmer className="h-8 w-3/4 rounded-xl" />
            <Shimmer className="h-4 w-full rounded-lg opacity-60" />
            <Shimmer className="h-4 w-2/3 rounded-lg opacity-60" />
            <Shimmer className="mt-2 h-10 w-32 rounded-full" />
          </div>
        </div>
      </section>

      {/* Latest articles + sidebar skeleton */}
      <section className="mt-6 grid gap-6 md:mt-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2.5">
              <Shimmer className="h-5 w-28 rounded-full" />
              <Shimmer className="h-7 w-52 rounded-xl" />
            </div>
            <Shimmer className="h-4 w-20 rounded-full" />
          </div>
          <div className="grid-auto-fit">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
        <aside className="space-y-5">
          {/* Airing sidebar skeleton */}
          <div className="panel p-5 md:p-6">
            <Shimmer className="h-5 w-28 rounded-full" />
            <div className="mt-4 space-y-3.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Shimmer className="h-12 w-12 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Shimmer className="h-4 w-4/5 rounded-lg" />
                    <Shimmer className="h-3 w-1/2 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* SEO block skeleton */}
          <div className="panel p-5 md:p-6">
            <Shimmer className="h-5 w-24 rounded-full" />
            <Shimmer className="mt-3 h-7 w-3/4 rounded-xl" />
            <Shimmer className="mt-2.5 h-4 w-full rounded-lg" />
            <Shimmer className="mt-1.5 h-4 w-2/3 rounded-lg" />
          </div>
        </aside>
      </section>
    </div>
  );
}