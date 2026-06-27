import {
  EVENT_CATEGORIES,
  EVENT_SOURCES,
  type Event,
  type EventCategory,
  type EventSource,
} from "@/lib/events";

const MAX = {
  id: 120,
  title: 180,
  description: 2_000,
  venue: 160,
  area: 100,
  address: 220,
  postalCode: 12,
  externalId: 180,
} as const;

const PROVIDER_HOSTS: Record<Exclude<EventSource, "mock">, readonly string[]> = {
  eventbrite: ["eventbrite.co.uk", "eventbrite.com"],
  skiddle: ["skiddle.com"],
  ticketmaster: ["ticketmaster.co.uk", "ticketmaster.com"],
};

const IMAGE_HOSTS: Record<Exclude<EventSource, "mock">, readonly string[]> = {
  eventbrite: ["img.evbuc.com"],
  skiddle: ["d31fr2pwly4c4s.cloudfront.net"],
  ticketmaster: ["s1.ticketm.net", "images.universe.com"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const value = record[key];

  if (typeof value !== "string") {
    throw new Error(`Event field "${key}" must be a string.`);
  }

  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > maxLength) {
    throw new Error(
      `Event field "${key}" must contain 1–${maxLength} characters.`,
    );
  }

  return trimmed;
}

function readOptionalString(
  record: Record<string, unknown>,
  key: string,
  maxLength: number,
): string | undefined {
  if (record[key] === undefined) {
    return undefined;
  }

  return readString(record, key, maxLength);
}

function readFiniteNumber(
  record: Record<string, unknown>,
  key: string,
): number {
  const value = record[key];

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`Event field "${key}" must be a finite number.`);
  }

  return value;
}

function readNullableFiniteNumber(
  record: Record<string, unknown>,
  key: string,
): number | null {
  if (record[key] === null) {
    return null;
  }

  return readFiniteNumber(record, key);
}

function readOptionalFiniteNumber(
  record: Record<string, unknown>,
  key: string,
): number | undefined {
  if (record[key] === undefined) {
    return undefined;
  }

  return readFiniteNumber(record, key);
}

function readIsoDate(record: Record<string, unknown>, key: string): string {
  const value = readString(record, key, 40);

  if (!value.includes("T") || Number.isNaN(Date.parse(value))) {
    throw new Error(`Event field "${key}" must be a valid ISO date-time.`);
  }

  return value;
}

function readHttpsUrl(
  record: Record<string, unknown>,
  key: string,
  allowedHosts?: readonly string[],
): string {
  const value = readString(record, key, 2_048);
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`Event field "${key}" must be a valid URL.`);
  }

  if (
    url.protocol !== "https:" ||
    url.username.length > 0 ||
    url.password.length > 0
  ) {
    throw new Error(`Event field "${key}" must be a safe HTTPS URL.`);
  }

  if (
    allowedHosts &&
    !allowedHosts.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
    )
  ) {
    throw new Error(`Event field "${key}" uses an unexpected provider host.`);
  }

  return url.toString();
}

function parseCategory(value: unknown): EventCategory {
  if (
    typeof value !== "string" ||
    !EVENT_CATEGORIES.includes(value as EventCategory)
  ) {
    throw new Error("Event category is not supported.");
  }

  return value as EventCategory;
}

function parseSource(value: unknown): EventSource {
  if (
    typeof value !== "string" ||
    !EVENT_SOURCES.includes(value as EventSource)
  ) {
    throw new Error("Event source is not supported.");
  }

  return value as EventSource;
}

export function parseEvent(input: unknown): Event {
  if (!isRecord(input)) {
    throw new Error("Event must be an object.");
  }

  if (!isRecord(input.price)) {
    throw new Error('Event field "price" must be an object.');
  }

  if (!isRecord(input.location)) {
    throw new Error('Event field "location" must be an object.');
  }

  if (!isRecord(input.source)) {
    throw new Error('Event field "source" must be an object.');
  }

  const startAt = readIsoDate(input, "startAt");
  const endAt = readIsoDate(input, "endAt");
  const amount = readNullableFiniteNumber(input.price, "amount");
  const isFree =
    typeof input.price.isFree === "boolean"
      ? input.price.isFree
      : amount === 0;
  const provider = parseSource(input.source.provider);

  if (Date.parse(endAt) <= Date.parse(startAt)) {
    throw new Error("Event end time must be after its start time.");
  }

  if (amount !== null && (amount < 0 || amount > 10_000)) {
    throw new Error("Event price is outside the accepted range.");
  }

  if (isFree && amount !== 0) {
    throw new Error("Free events must have a zero price.");
  }

  if (input.price.currency !== "GBP") {
    throw new Error("MVP event prices must use GBP.");
  }

  if (input.location.city !== "London") {
    throw new Error("MVP events must be located in London.");
  }

  const latitude = readOptionalFiniteNumber(input.location, "latitude");
  const longitude = readOptionalFiniteNumber(input.location, "longitude");

  if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
    throw new Error("Event latitude is outside the accepted range.");
  }

  if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
    throw new Error("Event longitude is outside the accepted range.");
  }

  const providerHosts =
    provider === "mock" ? undefined : PROVIDER_HOSTS[provider];

  const imageUrl =
    input.imageUrl === undefined
      ? undefined
      : readHttpsUrl(
          input,
          "imageUrl",
          provider === "mock" ? undefined : IMAGE_HOSTS[provider],
        );

  return {
    id: readString(input, "id", MAX.id),
    title: readString(input, "title", MAX.title),
    description: readString(input, "description", MAX.description),
    category: parseCategory(input.category),
    startAt,
    endAt,
    price: {
      amount,
      currency: "GBP",
      isFree,
    },
    location: {
      venue: readString(input.location, "venue", MAX.venue),
      area: readString(input.location, "area", MAX.area),
      city: "London",
      address: readOptionalString(input.location, "address", MAX.address),
      postalCode: readOptionalString(
        input.location,
        "postalCode",
        MAX.postalCode,
      ),
      latitude,
      longitude,
    },
    imageUrl,
    source: {
      provider,
      externalId: readString(
        input.source,
        "externalId",
        MAX.externalId,
      ),
      url: readHttpsUrl(input.source, "url", providerHosts),
    },
  };
}

export function parseEvents(inputs: readonly unknown[]): Event[] {
  const events = inputs.map(parseEvent);
  const ids = new Set<string>();

  for (const event of events) {
    if (ids.has(event.id)) {
      throw new Error(`Duplicate event id "${event.id}".`);
    }

    ids.add(event.id);
  }

  return events;
}
