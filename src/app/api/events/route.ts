import { getEventFeed } from "@/server/events";

export const dynamic = "force-dynamic";

export async function GET() {
  const eventFeed = await getEventFeed();

  return Response.json(eventFeed, {
    headers: {
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
