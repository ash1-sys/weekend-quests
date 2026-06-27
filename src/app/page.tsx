import { EventExplorer } from "@/components/event-explorer";
import { getEventFeed } from "@/server/events";

export const dynamic = "force-dynamic";

export default async function Home() {
  const eventFeed = await getEventFeed();

  return (
    <main className="min-h-screen bg-canvas text-ink md:px-6 md:py-6 lg:px-10 lg:py-8">
      <div className="mx-auto min-h-screen w-full bg-paper md:max-w-[1120px] md:overflow-hidden md:rounded-[20px] md:border md:border-[#dddbd7] md:shadow-[0_30px_70px_-36px_rgba(34,30,24,0.4)]">
        <EventExplorer
          initialEvents={eventFeed.events}
          initialWeekendWindows={eventFeed.weekendWindows}
        />
      </div>
    </main>
  );
}
