import type { Event } from "@/lib/events";

const GOOGLE_CALENDAR_URL = "https://calendar.google.com/calendar/render";
const ICS_MAX_FIELD_LENGTH = 2_000;

function formatUtcDateTime(value: string): string {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function escapeIcsText(value: string): string {
  return value
    .slice(0, ICS_MAX_FIELD_LENGTH)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function foldIcsLine(line: string): string {
  const chunks: string[] = [];

  for (let index = 0; index < line.length; index += 73) {
    chunks.push(line.slice(index, index + 73));
  }

  return chunks.join("\r\n ");
}

function eventLocation(event: Event): string {
  return [
    event.location.venue,
    event.location.address,
    event.location.area,
    event.location.city,
    event.location.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
}

export function getGoogleCalendarUrl(event: Event): string {
  const url = new URL(GOOGLE_CALENDAR_URL);

  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", event.title);
  url.searchParams.set(
    "dates",
    `${formatUtcDateTime(event.startAt)}/${formatUtcDateTime(event.endAt)}`,
  );
  url.searchParams.set("details", event.description);
  url.searchParams.set("location", eventLocation(event));

  return url.toString();
}

export function createIcsContent(event: Event): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Weekend Quests//Weekend Quests MVP//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(event.id)}@weekendquests.app`,
    `DTSTAMP:${formatUtcDateTime(new Date().toISOString())}`,
    `DTSTART:${formatUtcDateTime(event.startAt)}`,
    `DTEND:${formatUtcDateTime(event.endAt)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
    `LOCATION:${escapeIcsText(eventLocation(event))}`,
    `URL:${escapeIcsText(event.source.url)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return `${lines.map(foldIcsLine).join("\r\n")}\r\n`;
}

export function createCalendarFilename(event: Event): string {
  const sanitizedTitle = event.title
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .toLowerCase()
    .slice(0, 60);

  return `${sanitizedTitle || "weekend-quest"}.ics`;
}
