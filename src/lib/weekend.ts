import type { Event } from "@/lib/events";

export const WEEKEND_KEYS = ["this", "next"] as const;

export type WeekendKey = (typeof WEEKEND_KEYS)[number];

export type WeekendWindow = {
  label: string;
  startAt: string;
  endAt: string;
};

export type WeekendWindows = Record<WeekendKey, WeekendWindow>;

export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

const LONDON_TIME_ZONE = "Europe/London";

const LONDON_PARTS_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const WEEKEND_LABEL_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  day: "numeric",
  month: "long",
});

export function addCalendarDays(
  date: CalendarDate,
  numberOfDays: number,
): CalendarDate {
  const shifted = new Date(
    Date.UTC(date.year, date.month - 1, date.day + numberOfDays),
  );

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function getLondonOffsetMs(date: Date): number {
  const values = Object.fromEntries(
    LONDON_PARTS_FORMATTER.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return (
    Date.UTC(
      values.year,
      values.month - 1,
      values.day,
      values.hour,
      values.minute,
      values.second,
    ) - Math.floor(date.getTime() / 1_000) * 1_000
  );
}

export function londonDateTimeToIso(
  date: CalendarDate,
  hour = 0,
  minute = 0,
  second = 0,
): string {
  const initialUtc = Date.UTC(
    date.year,
    date.month - 1,
    date.day,
    hour,
    minute,
    second,
  );
  const initialOffset = getLondonOffsetMs(new Date(initialUtc));
  let resolvedUtc = initialUtc - initialOffset;
  const resolvedOffset = getLondonOffsetMs(new Date(resolvedUtc));

  if (resolvedOffset !== initialOffset) {
    resolvedUtc = initialUtc - resolvedOffset;
  }

  return new Date(resolvedUtc).toISOString();
}

export function getLondonDateParts(value: string | Date): CalendarDate {
  const date = typeof value === "string" ? new Date(value) : value;
  const values = Object.fromEntries(
    LONDON_PARTS_FORMATTER.formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
}

function formatWeekendLabel(start: CalendarDate): string {
  const end = addCalendarDays(start, 1);
  const startDate = new Date(Date.UTC(start.year, start.month - 1, start.day));
  const endDate = new Date(Date.UTC(end.year, end.month - 1, end.day));

  return `${startDate.getUTCDate()}–${WEEKEND_LABEL_FORMATTER.format(endDate)}`;
}

function createWindow(start: CalendarDate): WeekendWindow {
  return {
    label: formatWeekendLabel(start),
    startAt: londonDateTimeToIso(start),
    endAt: londonDateTimeToIso(addCalendarDays(start, 2)),
  };
}

export function getWeekendWindows(referenceDate = new Date()): WeekendWindows {
  const today = getLondonDateParts(referenceDate);
  const todayUtc = new Date(Date.UTC(today.year, today.month - 1, today.day));
  const dayOfWeek = todayUtc.getUTCDay();
  const daysUntilSaturday = dayOfWeek === 0 ? -1 : (6 - dayOfWeek + 7) % 7;
  const thisWeekendStart = addCalendarDays(today, daysUntilSaturday);

  return {
    this: createWindow(thisWeekendStart),
    next: createWindow(addCalendarDays(thisWeekendStart, 7)),
  };
}

export function eventIsInWeekend(
  event: Event,
  weekend: WeekendKey,
  windows: WeekendWindows,
): boolean {
  const eventStart = Date.parse(event.startAt);
  const window = windows[weekend];

  return (
    eventStart >= Date.parse(window.startAt) &&
    eventStart < Date.parse(window.endAt)
  );
}
