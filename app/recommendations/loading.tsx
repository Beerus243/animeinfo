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

export default function RecommendationsLoading() {
  return (
    <div className="shell-container py-6 md:py-9">
      {/* Recommendations hero banner skeleton */}
      <section className="panel recommendations-hero relative isolate min-h-[15.5rem] overflow-hidden px-5 py-6 md:px-8 md:py-8">
        <div className="recommendations-hero-overlay" aria-hidden="true" />
        <div className="absolute inset-0 -z-3 bg-[linear-gradient(135deg,rgba(235,94,40,0.14),rgba(53,141,123,0.10))]" />
        <div className="relative z-1 space-y-4">
          <Shimmer className="h-6 w-32 rounded-full opacity-60" />
          <Shimmer className="h-10 w-80 rounded-2xl md:h-14 md:w-[28rem]" />
          <Shimmer className="h-4 w-96 max-w-full rounded-xl opacity-70" />
          <Shimmer className="h-4 w-64 rounded-xl opacity-70" />
        </div>
      </section>

      {/* Anime recommendations section skeleton */}
      <section className="mt-6 space-y-6 md:mt-8 md:space-y-8">
        <div>
          <Shimmer className="h-8 w-64 rounded-xl" />
          <div className="grid-auto-fit mt-5 md:mt-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>

        {/* Manga recommendations section skeleton */}
        <div>
          <Shimmer className="h-8 w-56 rounded-xl" />
          <div className="grid-auto-fit mt-5 md:mt-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>

        {/* Webtoon recommendations section skeleton */}
        <div>
          <Shimmer className="h-8 w-60 rounded-xl" />
          <div className="grid-auto-fit mt-5 md:mt-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </section>
    </div>
  );
}
