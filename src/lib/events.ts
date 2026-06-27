export const EVENT_CATEGORIES = [
  "Music",
  "Food & drink",
  "Outdoors",
  "Arts",
  "Sports",
  "Tech",
] as const;

export const EVENT_SOURCES = [
  "mock",
  "eventbrite",
  "skiddle",
  "ticketmaster",
] as const;

export type EventCategory = (typeof EVENT_CATEGORIES)[number];
export type EventSource = (typeof EVENT_SOURCES)[number];

export type EventPrice = {
  amount: number | null;
  currency: "GBP";
  isFree: boolean;
};

export type EventLocation = {
  venue: string;
  area: string;
  city: "London";
  address?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
};

export type EventSourceDetails = {
  provider: EventSource;
  externalId: string;
  url: string;
};

export type Event = {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  startAt: string;
  endAt: string;
  price: EventPrice;
  location: EventLocation;
  imageUrl?: string;
  source: EventSourceDetails;
};
