import { parseEvents } from "@/lib/event-validation";
import type { Event } from "@/lib/events";
import {
  WEEKEND_KEYS,
  type WeekendWindow,
  type WeekendWindows,
} from "@/lib/weekend";

export type EventFeedResponse = {
  events: Event[];
  weekendWindows: WeekendWindows;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseWindow(value: unknown): WeekendWindow {
  if (!isRecord(value)) {
    throw new Error("Weekend window must be an object.");
  }

  const { label, startAt, endAt } = value;

  if (
    typeof label !== "string" ||
    label.length === 0 ||
    label.length > 40 ||
    typeof startAt !== "string" ||
    typeof endAt !== "string" ||
    Number.isNaN(Date.parse(startAt)) ||
    Number.isNaN(Date.parse(endAt)) ||
    Date.parse(endAt) <= Date.parse(startAt)
  ) {
    throw new Error("Weekend window is invalid.");
  }

  return { label, startAt, endAt };
}

export function parseEventFeedResponse(input: unknown): EventFeedResponse {
  if (!isRecord(input) || !Array.isArray(input.events)) {
    throw new Error("Event feed response is invalid.");
  }

  if (!isRecord(input.weekendWindows)) {
    throw new Error("Weekend windows are missing.");
  }

  const rawWeekendWindows = input.weekendWindows;
  const weekendWindows = Object.fromEntries(
    WEEKEND_KEYS.map((key) => [key, parseWindow(rawWeekendWindows[key])]),
  ) as WeekendWindows;

  return {
    events: parseEvents(input.events),
    weekendWindows,
  };
}
