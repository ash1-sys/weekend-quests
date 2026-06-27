import { parseEvents } from "@/lib/event-validation";
import type { Event } from "@/lib/events";
import {
  addCalendarDays,
  getLondonDateParts,
  londonDateTimeToIso,
  type WeekendKey,
  type WeekendWindows,
} from "@/lib/weekend";

const rawMockEvents = [
  {
    id: "cosmic-soul-yussef-dayes",
    title: "Cosmic Soul: Yussef Dayes Live",
    description:
      "Drummer-composer Yussef Dayes brings his spiritual-jazz quartet to a Shoreditch railway arch for a night of long, hypnotic grooves and expansive live improvisation.",
    category: "Music",
    startAt: "2026-06-20T20:00:00+01:00",
    endAt: "2026-06-20T23:00:00+01:00",
    price: { amount: 28, currency: "GBP" },
    location: {
      venue: "Village Underground",
      area: "Shoreditch",
      city: "London",
      address: "54 Holywell Lane",
      postalCode: "EC2A 3PQ",
    },
    source: {
      provider: "mock",
      externalId: "mock-yussef-dayes",
      url: "https://villageunderground.co.uk/",
    },
  },
  {
    id: "brockley-market",
    title: "Brockley Market",
    description:
      "A neighbourhood food market with independent traders, small-batch coffee, fresh produce and plenty of excellent things to eat on the spot.",
    category: "Food & drink",
    startAt: "2026-06-20T10:00:00+01:00",
    endAt: "2026-06-20T14:00:00+01:00",
    price: { amount: 0, currency: "GBP" },
    location: {
      venue: "Lewisham College Car Park",
      area: "Brockley",
      city: "London",
      address: "Lewisham Way",
      postalCode: "SE4 1UT",
    },
    source: {
      provider: "mock",
      externalId: "mock-brockley-market",
      url: "https://www.brockleymarket.com/",
    },
  },
  {
    id: "hampstead-heath-sunrise-swim",
    title: "Hampstead Heath Sunrise Swim",
    description:
      "Start Sunday with an early dip at the Hampstead Heath ponds before the crowds arrive. Bring a towel, warm layers and something hot for afterwards.",
    category: "Outdoors",
    startAt: "2026-06-21T07:00:00+01:00",
    endAt: "2026-06-21T08:30:00+01:00",
    price: { amount: 0, currency: "GBP" },
    location: {
      venue: "Hampstead Heath Ponds",
      area: "Hampstead",
      city: "London",
      address: "Hampstead Heath",
      postalCode: "NW5 1QR",
    },
    source: {
      provider: "mock",
      externalId: "mock-hampstead-swim",
      url: "https://www.cityoflondon.gov.uk/things-to-do/green-spaces/hampstead-heath",
    },
  },
  {
    id: "late-at-the-tate-soft-machine",
    title: "Late at the Tate: Soft Machine",
    description:
      "An after-hours evening at Tate Modern with ambient live sets, artist talks and the galleries open late around the Turbine Hall.",
    category: "Arts",
    startAt: "2026-06-20T21:00:00+01:00",
    endAt: "2026-06-20T23:30:00+01:00",
    price: { amount: 12, currency: "GBP" },
    location: {
      venue: "Tate Modern",
      area: "Bankside",
      city: "London",
      address: "Bankside",
      postalCode: "SE1 9TG",
    },
    source: {
      provider: "mock",
      externalId: "mock-late-at-tate",
      url: "https://www.tate.org.uk/visit/tate-modern",
    },
  },
  {
    id: "run-dem-crew-saturday-social",
    title: "Run Dem Crew Saturday Social",
    description:
      "A friendly East London social run at conversational pace, followed by coffee nearby. The route is suitable for a range of running abilities.",
    category: "Sports",
    startAt: "2026-06-20T09:30:00+01:00",
    endAt: "2026-06-20T11:00:00+01:00",
    price: { amount: 0, currency: "GBP" },
    location: {
      venue: "Rich Mix",
      area: "Shoreditch",
      city: "London",
      address: "35-47 Bethnal Green Road",
      postalCode: "E1 6LA",
    },
    source: {
      provider: "mock",
      externalId: "mock-run-dem-crew",
      url: "https://www.rundemcrew.com/",
    },
  },
  {
    id: "ai-after-hours-builders-meetup",
    title: "AI After Hours: Builders Meetup",
    description:
      "Short demos from people building and shipping practical tools, followed by informal drinks and conversations about what worked, what broke and what comes next.",
    category: "Tech",
    startAt: "2026-06-20T18:00:00+01:00",
    endAt: "2026-06-20T21:00:00+01:00",
    price: { amount: 0, currency: "GBP" },
    location: {
      venue: "Second Home Spitalfields",
      area: "Spitalfields",
      city: "London",
      address: "68-80 Hanbury Street",
      postalCode: "E1 5JL",
    },
    source: {
      provider: "mock",
      externalId: "mock-builders-meetup",
      url: "https://secondhome.io/location/spitalfields/",
    },
  },
  {
    id: "peckham-rooftop-supper-club",
    title: "Peckham Rooftop Supper Club",
    description:
      "A five-course communal dinner above Peckham's rooftops, with seasonal cooking, natural wine and one long table as the sun goes down.",
    category: "Food & drink",
    startAt: "2026-06-27T19:30:00+01:00",
    endAt: "2026-06-27T22:30:00+01:00",
    price: { amount: 45, currency: "GBP" },
    location: {
      venue: "Bussey Building",
      area: "Peckham",
      city: "London",
      address: "133 Rye Lane",
      postalCode: "SE15 4ST",
    },
    source: {
      provider: "mock",
      externalId: "mock-peckham-supper-club",
      url: "https://www.copelandpark.com/",
    },
  },
  {
    id: "hot-chip-dj-set",
    title: "Hot Chip (DJ Set)",
    description:
      "Hot Chip take over the booth for an extended late-night set at Phonox, moving between left-field pop, house and dance-floor classics.",
    category: "Music",
    startAt: "2026-06-27T23:00:00+01:00",
    endAt: "2026-06-28T05:00:00+01:00",
    price: { amount: 22, currency: "GBP" },
    location: {
      venue: "Phonox",
      area: "Brixton",
      city: "London",
      address: "418 Brixton Road",
      postalCode: "SW9 7AY",
    },
    source: {
      provider: "mock",
      externalId: "mock-hot-chip",
      url: "https://phonox.co.uk/",
    },
  },
  {
    id: "columbia-road-flower-market",
    title: "Columbia Road Flower Market",
    description:
      "Columbia Road fills with flowers, plants and independent shops every Sunday. Arrive early for space to browse or later for the livelier market atmosphere.",
    category: "Outdoors",
    startAt: "2026-06-28T08:00:00+01:00",
    endAt: "2026-06-28T14:00:00+01:00",
    price: { amount: 0, currency: "GBP" },
    location: {
      venue: "Columbia Road",
      area: "Hackney",
      city: "London",
      address: "Columbia Road",
      postalCode: "E2 7RG",
    },
    source: {
      provider: "mock",
      externalId: "mock-columbia-road",
      url: "https://columbiaroad.info/",
    },
  },
  {
    id: "print-club-open-studio",
    title: "Print Club Open Studio",
    description:
      "See screen-printing in progress, browse limited-edition artwork and learn how the Dalston studio turns illustrations into hand-pulled prints.",
    category: "Arts",
    startAt: "2026-06-28T12:00:00+01:00",
    endAt: "2026-06-28T16:00:00+01:00",
    price: { amount: 0, currency: "GBP" },
    location: {
      venue: "Print Club London",
      area: "Dalston",
      city: "London",
      address: "10-28 Millers Avenue",
      postalCode: "E8 2DS",
    },
    source: {
      provider: "mock",
      externalId: "mock-print-club",
      url: "https://printclublondon.com/",
    },
  },
  {
    id: "sunday-league-five-a-side",
    title: "Sunday League 5-a-side Drop-in",
    description:
      "Turn up solo and join a friendly five-a-side game. Teams are organised on arrival, with bibs and footballs provided.",
    category: "Sports",
    startAt: "2026-06-28T11:00:00+01:00",
    endAt: "2026-06-28T12:30:00+01:00",
    price: { amount: 8, currency: "GBP" },
    location: {
      venue: "Powerleague Shoreditch",
      area: "Shoreditch",
      city: "London",
      address: "Braithwaite Street",
      postalCode: "E1 6GJ",
    },
    source: {
      provider: "mock",
      externalId: "mock-five-a-side",
      url: "https://www.powerleague.co.uk/",
    },
  },
  {
    id: "founders-and-funders-pitch-night",
    title: "Founders & Funders Pitch Night",
    description:
      "Six early-stage teams present concise product pitches before an open feedback session and informal drinks with founders, operators and investors.",
    category: "Tech",
    startAt: "2026-06-28T18:30:00+01:00",
    endAt: "2026-06-28T21:00:00+01:00",
    price: { amount: 15, currency: "GBP" },
    location: {
      venue: "Huckletree Shoreditch",
      area: "Shoreditch",
      city: "London",
      address: "18 Finsbury Square",
      postalCode: "EC2A 1AH",
    },
    source: {
      provider: "mock",
      externalId: "mock-pitch-night",
      url: "https://www.huckletree.com/",
    },
  },
] as const;

export const mockEvents = parseEvents(rawMockEvents);

const MOCK_WEEKEND_STARTS: Record<WeekendKey, string> = {
  this: "2026-06-20T00:00:00+01:00",
  next: "2026-06-27T00:00:00+01:00",
};

function differenceInCalendarDays(value: string, base: string): number {
  const date = getLondonDateParts(value);
  const baseDate = getLondonDateParts(base);

  return Math.round(
    (Date.UTC(date.year, date.month - 1, date.day) -
      Date.UTC(baseDate.year, baseDate.month - 1, baseDate.day)) /
      86_400_000,
  );
}

function getLondonTimeParts(value: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(value))
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function shiftEventDate(
  value: string,
  sourceWeekendStart: string,
  targetWeekendStart: string,
): string {
  const targetDate = addCalendarDays(
    getLondonDateParts(targetWeekendStart),
    differenceInCalendarDays(value, sourceWeekendStart),
  );
  const time = getLondonTimeParts(value);

  return londonDateTimeToIso(
    targetDate,
    time.hour,
    time.minute,
    time.second,
  );
}

export function getMockEventsForWindows(windows: WeekendWindows): Event[] {
  return mockEvents.map((event, index) => {
    const weekend: WeekendKey = index < 6 ? "this" : "next";
    const sourceStart = MOCK_WEEKEND_STARTS[weekend];
    const targetStart = windows[weekend].startAt;

    return {
      ...event,
      startAt: shiftEventDate(event.startAt, sourceStart, targetStart),
      endAt: shiftEventDate(event.endAt, sourceStart, targetStart),
    };
  });
}
