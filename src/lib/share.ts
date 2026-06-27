import type { Event } from "@/lib/events";

export function createEventShareUrl(eventId: string, origin: string): string {
  const url = new URL("/", origin);
  url.searchParams.set("event", eventId);
  return url.toString();
}

export function createEventShareText(event: Event): string {
  return `${event.title} — ${event.location.venue}, ${event.location.area}`;
}
