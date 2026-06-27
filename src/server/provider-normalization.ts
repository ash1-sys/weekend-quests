import "server-only";

import type { EventCategory } from "@/lib/events";

export function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

export function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

export function mapCategory(...values: unknown[]): EventCategory {
  const text = values
    .map(readString)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(music|concert|club|jazz|rock|pop|dance|dj)/.test(text)) {
    return "Music";
  }

  if (/(food|drink|dining|restaurant|beer|wine|market)/.test(text)) {
    return "Food & drink";
  }

  if (/(sport|fitness|football|rugby|running|cycling|game)/.test(text)) {
    return "Sports";
  }

  if (/(tech|science|business|startup|developer|conference)/.test(text)) {
    return "Tech";
  }

  if (/(outdoor|nature|garden|walking|tour|festival)/.test(text)) {
    return "Outdoors";
  }

  return "Arts";
}

export function createEndAt(startAt: string, endAt?: string): string {
  if (endAt && Date.parse(endAt) > Date.parse(startAt)) {
    return endAt;
  }

  return new Date(Date.parse(startAt) + 2 * 60 * 60 * 1_000).toISOString();
}

export function normalizeDescription(
  description: unknown,
  provider: "Eventbrite" | "Skiddle" | "Ticketmaster",
): string {
  return (
    readString(description)?.slice(0, 2_000) ??
    `See the ${provider} listing for full event details.`
  );
}
