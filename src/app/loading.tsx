import { EventFeedSkeleton } from "@/components/event-feed-skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-canvas text-ink md:px-6 md:py-6 lg:px-10 lg:py-8">
      <div className="mx-auto min-h-screen w-full bg-paper px-5 py-8 md:max-w-[1120px] md:rounded-[20px] md:border md:border-[#dddbd7] md:px-7 md:shadow-[0_30px_70px_-36px_rgba(34,30,24,0.4)] lg:px-8">
        <EventFeedSkeleton />
      </div>
    </main>
  );
}
