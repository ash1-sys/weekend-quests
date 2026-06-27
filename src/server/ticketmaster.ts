import "server-only";

import { parseEvent } from "@/lib/event-validation";
import type { Event } from "@/lib/events";
import type { WeekendWindows } from "@/lib/weekend";
import { fetchProviderJson } from "@/server/provider-http";
import {
  createEndAt,
  isRecord,
  mapCategory,
  normalizeDescription,
  readNumber,
  readString,
} from "@/server/provider-normalization";

const TICKETMASTER_API_URL =
  "https://app.ticketmaster.com/discovery/v2/events.json";

function formatTicketmasterDate(value: string): string {
  return new Date(value).toISOString().replace(/\.\d{3}Z$/, "Z");
}

function firstRecord(value: unknown): Record<string, unknown> | undefined {
  return Array.isArray(value) && isRecord(value[0]) ? value[0] : undefined;
}

function normalizeTicketmasterDescription(input: Record<string, unknown>): string {
  return normalizeDescription(input.info, "Ticketmaster");
}

function normalizeTicketmasterEvent(input: unknown): Event | null {
  if (!isRecord(input)) {
    return null;
  }

  const externalId = readString(input.id);
  const title = readString(input.name);
  const dates = isRecord(input.dates) ? input.dates : undefined;
  const start = dates && isRecord(dates.start) ? dates.start : undefined;
  const end = dates && isRecord(dates.end) ? dates.end : undefined;
  const startAt = readString(start?.dateTime);
  const sourceUrl = readString(input.url);
  const embedded = isRecord(input._embedded) ? input._embedded : undefined;
  const venue = firstRecord(embedded?.venues);

  if (!externalId || !title || !startAt || !sourceUrl || !venue) {
    return null;
  }

  const venueName = readString(venue.name);
  const city = isRecord(venue.city) ? readString(venue.city.name) : undefined;

  if (!venueName || city?.toLowerCase() !== "london") {
    return null;
  }

  const classifications = firstRecord(input.classifications);
  const segment =
    classifications && isRecord(classifications.segment)
      ? readString(classifications.segment.name)
      : undefined;
  const genre =
    classifications && isRecord(classifications.genre)
      ? readString(classifications.genre.name)
      : undefined;
  const subGenre =
    classifications && isRecord(classifications.subGenre)
      ? readString(classifications.subGenre.name)
      : undefined;
  const priceRange = firstRecord(input.priceRanges);
  const minimumPrice = readNumber(priceRange?.min) ?? null;
  const address = isRecord(venue.address)
    ? readString(venue.address.line1)
    : undefined;
  const postalCode = readString(venue.postalCode);
  const location = isRecord(venue.location) ? venue.location : undefined;
  const images = Array.isArray(input.images)
    ? input.images.filter(isRecord)
    : [];
  const preferredImages = images.filter(
    (candidate) => readString(candidate.ratio) === "16_9",
  );
  const image = [...(preferredImages.length > 0 ? preferredImages : images)].sort(
    (left, right) =>
      (readNumber(right.width) ?? 0) - (readNumber(left.width) ?? 0),
  )[0];

  try {
    return parseEvent({
      id: `ticketmaster-${externalId}`,
      title,
      description: normalizeTicketmasterDescription(input),
      category: mapCategory(segment, genre, subGenre, title),
      startAt,
      endAt: createEndAt(startAt, readString(end?.dateTime)),
      price: {
        amount: minimumPrice,
        currency: "GBP",
        isFree: minimumPrice === 0,
      },
      location: {
        venue: venueName,
        area: city,
        city: "London",
        address,
        postalCode,
        latitude: readNumber(location?.latitude),
        longitude: readNumber(location?.longitude),
      },
      imageUrl: readString(image?.url),
      source: {
        provider: "ticketmaster",
        externalId,
        url: sourceUrl,
      },
    });
  } catch {
    return null;
  }
}

export async function getTicketmasterEvents(
  windows: WeekendWindows,
): Promise<Event[]> {
  const apiKey = process.env.TICKETMASTER_KEY;

  if (!apiKey) {
    return [];
  }

  const payloads = await Promise.all(
    Object.values(windows).map(async (window) => {
      const url = new URL(TICKETMASTER_API_URL);
      url.searchParams.set("apikey", apiKey);
      url.searchParams.set("city", "London");
      url.searchParams.set("countryCode", "GB");
      url.searchParams.set(
        "startDateTime",
        formatTicketmasterDate(window.startAt),
      );
      url.searchParams.set(
        "endDateTime",
        formatTicketmasterDate(window.endAt),
      );
      url.searchParams.set("size", "100");
      url.searchParams.set("sort", "date,asc");

      return fetchProviderJson(url);
    }),
  );
  const inputs = payloads.flatMap((payload) => {
    if (!isRecord(payload) || !isRecord(payload._embedded)) {
      return [];
    }

    return Array.isArray(payload._embedded.events)
      ? payload._embedded.events
      : [];
  });

  return inputs.flatMap((input) => {
    const event = normalizeTicketmasterEvent(input);
    return event ? [event] : [];
  });
}
