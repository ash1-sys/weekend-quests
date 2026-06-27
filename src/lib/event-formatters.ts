import type { Event } from "@/lib/events";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "short",
  day: "numeric",
  month: "short",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const PRICE_FORMATTER = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 2,
});

export function formatEventDate(event: Event): string {
  return DATE_FORMATTER.format(new Date(event.startAt));
}

export function formatEventTime(event: Event): string {
  return TIME_FORMATTER.format(new Date(event.startAt))
    .replace(" ", "")
    .toLowerCase();
}

export function formatEventPrice(event: Event): string {
  if (event.price.isFree) {
    return "Free";
  }

  if (event.price.amount === null) {
    return "Check price";
  }

  return PRICE_FORMATTER.format(event.price.amount).replace(/\.00$/, "");
}

export function formatEventVenue(event: Event): string {
  return `${event.location.venue}, ${event.location.area}`;
}
