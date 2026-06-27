export function EventFeedSkeleton() {
  return (
    <div
      aria-label="Loading events"
      className="mt-7 grid gap-5 md:grid-cols-2 md:gap-4 lg:gap-5"
      role="status"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[20px] border border-border bg-white md:rounded-[22px]"
        >
          <div className="skeleton-shimmer h-[218px] md:h-[170px]" />
          <div className="space-y-2.5 px-4 py-4">
            <div className="skeleton-shimmer h-3 w-1/2 rounded-full" />
            <div className="h-2.5 w-3/4 rounded-full bg-[#eae9e5]" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading weekend events…</span>
    </div>
  );
}
