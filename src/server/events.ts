import "server-only";

import { getMockEventsForWindows } from "@/data/mock-events";
import type { EventFeedResponse } from "@/lib/event-feed";
import type { Event } from "@/lib/events";
import { getWeekendWindows } from "@/lib/weekend";
import { getEventbriteEvents } from "@/server/eventbrite";
import { getSkiddleEvents } from "@/server/skiddle";
import { getTicketmasterEvents } from "@/server/ticketmaster";

const MINIMUM_FEED_SIZE = 12;
const MAXIMUM_FEED_SIZE = 200;

function eventIdentity(event: Event): string {
  const normalizedTitle = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const day = event.startAt.slice(0, 10);

  return `${normalizedTitle}|${day}|${event.location.venue.toLowerCase()}`;
}

function mergeEvents(
  providerEvents: readonly Event[],
  mockEvents: readonly Event[],
): Event[] {
  const dedupedEventsByIdentity = new Map<string, Event>();
  const candidates =
    providerEvents.length >= MINIMUM_FEED_SIZE
      ? providerEvents
      : [...providerEvents, ...mockEvents];

  for (const event of candidates) {
    const identity = eventIdentity(event);

    if (dedupedEventsByIdentity.has(identity)) {
      continue;
    }

    dedupedEventsByIdentity.set(identity, event);
  }

  const maximumEvents =
    providerEvents.length < MINIMUM_FEED_SIZE
      ? MINIMUM_FEED_SIZE
      : MAXIMUM_FEED_SIZE;

  return [...dedupedEventsByIdentity.values()]
    .sort((left, right) => Date.parse(left.startAt) - Date.parse(right.startAt))
    .slice(0, maximumEvents);
}

export async function getEventFeed(): Promise<EventFeedResponse> {
  const weekendWindows = getWeekendWindows();
  const mockEvents = getMockEventsForWindows(weekendWindows);
  const results = await Promise.allSettled([
    getSkiddleEvents(weekendWindows),
    getTicketmasterEvents(weekendWindows),
    getEventbriteEvents(weekendWindows),
  ]);
  const providerEvents = results.flatMap((result) =>
    result.status === "fulfilled" ? result.value : [],
  );

  return {
    events: mergeEvents(providerEvents, mockEvents),
    weekendWindows,
  };
}
