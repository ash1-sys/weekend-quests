import "server-only";

import { parseEvent } from "@/lib/event-validation";
import type { Event, EventCategory } from "@/lib/events";
import {
  getLondonDateParts,
  londonDateTimeToIso,
  type WeekendWindow,
  type WeekendWindows,
} from "@/lib/weekend";
import { fetchProviderJson } from "@/server/provider-http";
import {
  createEndAt,
  isRecord,
  mapCategory,
  normalizeDescription,
  readNumber,
  readString,
} from "@/server/provider-normalization";

const SKIDDLE_EVENTS_API_URL =
  "https://www.skiddle.com/api/v1/events/search/";
const LONDON_LATITUDE = "51.5072";
const LONDON_LONGITUDE = "-0.1276";
const LONDON_RADIUS_MILES = "15";
const SKIDDLE_LIMIT = "100";

function formatSkiddleDate(value: string): string {
  const { year, month, day } = getLondonDateParts(value);

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0",
  )}`;
}

function formatSkiddleMaxDate(window: WeekendWindow): string {
  return formatSkiddleDate(
    new Date(Date.parse(window.endAt) - 1).toISOString(),
  );
}

function normalizeSkiddleDateTime(value: string | undefined): string | undefined {
  const match = value?.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/,
  );

  if (!match) {
    return value;
  }

  return londonDateTimeToIso(
    {
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
    },
    Number(match[4]),
    Number(match[5]),
    Number(match[6] ?? 0),
  );
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstRecord(value: unknown): Record<string, unknown> | undefined {
  return Array.isArray(value) && isRecord(value[0]) ? value[0] : undefined;
}

function readMinimumPoundPrice(value: string | undefined): number | undefined {
  const matches = value?.matchAll(/£\s*(\d+(?:\.\d{1,2})?)/g);
  const prices = matches
    ? [...matches].flatMap((match) => {
        const price = Number(match[1]);
        return Number.isFinite(price) ? [price] : [];
      })
    : [];

  return prices.length > 0 ? Math.min(...prices) : undefined;
}

function hasExplicitFreeText(...values: Array<string | undefined>): boolean {
  return values.some((value) => /\bfree\b/i.test(value ?? ""));
}

function normalizeSkiddlePrice({
  description,
  entryPrice,
  minimumPrice,
  title,
}: {
  description: string | undefined;
  entryPrice: string | undefined;
  minimumPrice: number | undefined;
  title: string;
}): { amount: number | null; isFree: boolean } {
  const entryAmount = readMinimumPoundPrice(entryPrice);

  if (entryAmount !== undefined) {
    return {
      amount: entryAmount,
      isFree: false,
    };
  }

  if (minimumPrice !== undefined && minimumPrice > 0) {
    return {
      amount: minimumPrice,
      isFree: false,
    };
  }

  const explicitlyFree = hasExplicitFreeText(title, entryPrice, description);

  if (explicitlyFree) {
    return {
      amount: 0,
      isFree: true,
    };
  }

  return {
    amount: null,
    isFree: false,
  };
}

function mapSkiddleCategory(
  eventCode: string | undefined,
  title: string,
  venueType: string | undefined,
  genreName: string | undefined,
): EventCategory {
  switch (eventCode?.toUpperCase()) {
    case "CLUB":
    case "LIVE":
      return "Music";
    case "FOOD":
    case "BARPUB":
      return "Food & drink";
    case "FEST":
      return "Outdoors";
    case "SPORT":
      return "Sports";
    case "ARTS":
    case "COMEDY":
    case "EXHIB":
    case "EXPER":
    case "THEATRE":
      return "Arts";
    default:
      return mapCategory(eventCode, title, venueType, genreName);
  }
}

function normalizeSkiddleEvent(input: unknown): Event | null {
  if (!isRecord(input)) {
    return null;
  }

  const externalId = readString(input.id);
  const title = readString(input.eventname);
  const startAt = normalizeSkiddleDateTime(readString(input.startdate));
  const sourceUrl = readString(input.link);
  const venue = isRecord(input.venue) ? input.venue : undefined;
  const venueName = readString(venue?.name);

  if (
    !externalId ||
    !title ||
    !startAt ||
    !sourceUrl ||
    !venueName ||
    input.cancelled === "1"
  ) {
    return null;
  }

  const eventCode = readString(input.EventCode);
  const genre = firstRecord(input.genres);
  const ticketPricing = isRecord(input.ticketpricing)
    ? input.ticketpricing
    : undefined;
  const minimumPrice = readNumber(ticketPricing?.minPrice);
  const entryPrice = readString(input.entryprice);
  const description = readString(input.description);
  const price = normalizeSkiddlePrice({
    description,
    entryPrice,
    minimumPrice,
    title,
  });
  const imageUrl =
    readString(input.xlargeimageurlWebP) ??
    readString(input.xlargeimageurl) ??
    readString(input.largeimageurl) ??
    readString(input.imageurl);
  const venueTown = readString(venue?.town);
  const venueRegion = readString(venue?.region);

  try {
    return parseEvent({
      id: `skiddle-${externalId}`,
      title,
      description: normalizeDescription(
        description ? stripHtml(description) : undefined,
        "Skiddle",
      ),
      category: mapSkiddleCategory(
        eventCode,
        title,
        readString(venue?.type),
        readString(genre?.name),
      ),
      startAt,
      endAt: createEndAt(
        startAt,
        normalizeSkiddleDateTime(readString(input.enddate)),
      ),
      price: {
        amount: price.amount,
        currency: "GBP",
        isFree: price.isFree,
      },
      location: {
        venue: venueName,
        area: venueTown ?? venueRegion ?? "London",
        city: "London",
        address: readString(venue?.address),
        postalCode: readString(venue?.postcode),
        latitude: readNumber(venue?.latitude),
        longitude: readNumber(venue?.longitude),
      },
      imageUrl,
      source: {
        provider: "skiddle",
        externalId,
        url: sourceUrl,
      },
    });
  } catch {
    return null;
  }
}

async function getSkiddleWindowEvents(
  apiKey: string,
  window: WeekendWindow,
): Promise<Event[]> {
  const url = new URL(SKIDDLE_EVENTS_API_URL);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("latitude", LONDON_LATITUDE);
  url.searchParams.set("longitude", LONDON_LONGITUDE);
  url.searchParams.set("radius", LONDON_RADIUS_MILES);
  url.searchParams.set("minDate", formatSkiddleDate(window.startAt));
  url.searchParams.set("maxDate", formatSkiddleMaxDate(window));
  url.searchParams.set("limit", SKIDDLE_LIMIT);
  url.searchParams.set("description", "1");
  url.searchParams.set("imagefilter", "1");

  const payload = await fetchProviderJson(url);

  if (!isRecord(payload) || payload.error !== 0 || !Array.isArray(payload.results)) {
    return [];
  }

  return payload.results.flatMap((input) => {
    const event = normalizeSkiddleEvent(input);
    return event ? [event] : [];
  });
}

export async function getSkiddleEvents(
  windows: WeekendWindows,
): Promise<Event[]> {
  const apiKey = process.env.SKIDDLE_API_KEY;

  if (!apiKey) {
    return [];
  }

  const events = await Promise.all(
    Object.values(windows).map((window) =>
      getSkiddleWindowEvents(apiKey, window),
    ),
  );

  return events.flat();
}
