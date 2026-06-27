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

const EVENTBRITE_API_URL = "https://www.eventbriteapi.com/v3";
const MAX_ORGANIZATIONS = 3;

function nestedText(value: unknown): string | undefined {
  return isRecord(value) ? readString(value.text) : undefined;
}

function normalizeEventbriteEvent(input: unknown): Event | null {
  if (!isRecord(input)) {
    return null;
  }

  const externalId = readString(input.id);
  const title = nestedText(input.name);
  const start = isRecord(input.start) ? input.start : undefined;
  const end = isRecord(input.end) ? input.end : undefined;
  const startAt = readString(start?.utc);
  const sourceUrl = readString(input.url);
  const venue = isRecord(input.venue) ? input.venue : undefined;
  const address = venue && isRecord(venue.address) ? venue.address : undefined;
  const city = readString(address?.city);
  const venueName = readString(venue?.name);

  if (
    !externalId ||
    !title ||
    !startAt ||
    !sourceUrl ||
    !venueName ||
    city?.toLowerCase() !== "london"
  ) {
    return null;
  }

  const ticketAvailability = isRecord(input.ticket_availability)
    ? input.ticket_availability
    : undefined;
  const minimumTicket =
    ticketAvailability && isRecord(ticketAvailability.minimum_ticket_price)
      ? ticketAvailability.minimum_ticket_price
      : undefined;
  const isFree = input.is_free === true;
  const logo = isRecord(input.logo) ? input.logo : undefined;

  try {
    return parseEvent({
      id: `eventbrite-${externalId}`,
      title,
      description: normalizeDescription(
        nestedText(input.description) ?? nestedText(input.summary),
        "Eventbrite",
      ),
      category: mapCategory(title, nestedText(input.summary)),
      startAt,
      endAt: createEndAt(startAt, readString(end?.utc)),
      price: {
        amount: isFree
          ? 0
          : (readNumber(minimumTicket?.major_value) ?? null),
        currency: "GBP",
        isFree,
      },
      location: {
        venue: venueName,
        area: readString(address?.region) ?? city,
        city: "London",
        address: readString(address?.address_1),
        postalCode: readString(address?.postal_code),
        latitude: readNumber(address?.latitude),
        longitude: readNumber(address?.longitude),
      },
      imageUrl: readString(logo?.url),
      source: {
        provider: "eventbrite",
        externalId,
        url: sourceUrl,
      },
    });
  } catch {
    return null;
  }
}

async function getOrganizationIds(token: string): Promise<string[]> {
  const payload = await fetchProviderJson(
    new URL(`${EVENTBRITE_API_URL}/users/me/organizations/`),
    { Authorization: `Bearer ${token}` },
  );

  if (!isRecord(payload) || !Array.isArray(payload.organizations)) {
    return [];
  }

  return payload.organizations
    .flatMap((organization) => {
      if (!isRecord(organization)) {
        return [];
      }

      const id = readString(organization.id);
      return id ? [id] : [];
    })
    .slice(0, MAX_ORGANIZATIONS);
}

async function getOrganizationEvents(
  organizationId: string,
  token: string,
): Promise<unknown[]> {
  const url = new URL(
    `${EVENTBRITE_API_URL}/organizations/${encodeURIComponent(organizationId)}/events/`,
  );
  url.searchParams.set("status", "live");
  url.searchParams.set("order_by", "start_asc");
  url.searchParams.set("expand", "venue,ticket_availability");
  url.searchParams.set("time_filter", "current_future");
  url.searchParams.set("page_size", "50");

  const payload = await fetchProviderJson(url, {
    Authorization: `Bearer ${token}`,
  });

  return isRecord(payload) && Array.isArray(payload.events)
    ? payload.events
    : [];
}

export async function getEventbriteEvents(
  windows: WeekendWindows,
): Promise<Event[]> {
  const token = process.env.EVENTBRITE_TOKEN;

  if (!token) {
    return [];
  }

  const organizationIds = await getOrganizationIds(token);
  const responses = await Promise.allSettled(
    organizationIds.map((id) => getOrganizationEvents(id, token)),
  );
  const rangeStart = Date.parse(windows.this.startAt);
  const rangeEnd = Date.parse(windows.next.endAt);

  return responses
    .flatMap((result) => (result.status === "fulfilled" ? result.value : []))
    .flatMap((input) => {
      const event = normalizeEventbriteEvent(input);
      return event ? [event] : [];
    })
    .filter((event) => {
      const start = Date.parse(event.startAt);
      return start >= rangeStart && start < rangeEnd;
    });
}
