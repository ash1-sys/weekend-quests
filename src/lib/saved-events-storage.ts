const SAVED_EVENTS_VERSION = 1;
const MAX_STORED_IDS = 100;
const MAX_STORAGE_LENGTH = 10_000;

export const SAVED_EVENTS_STORAGE_KEY = "weekend-quests:saved-events";

type SavedEventsPayload = {
  version: typeof SAVED_EVENTS_VERSION;
  eventIds: string[];
};

export function parseSavedEventIds(
  rawValue: string | null,
  validEventIds: ReadonlySet<string>,
): string[] {
  if (!rawValue || rawValue.length > MAX_STORAGE_LENGTH) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawValue);
  } catch {
    return [];
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed)
  ) {
    return [];
  }

  const payload = parsed as Partial<SavedEventsPayload>;

  if (
    payload.version !== SAVED_EVENTS_VERSION ||
    !Array.isArray(payload.eventIds)
  ) {
    return [];
  }

  const uniqueIds = new Set<string>();

  for (const value of payload.eventIds.slice(0, MAX_STORED_IDS)) {
    if (
      typeof value === "string" &&
      validEventIds.has(value) &&
      !uniqueIds.has(value)
    ) {
      uniqueIds.add(value);
    }
  }

  return [...uniqueIds];
}

export function serializeSavedEventIds(eventIds: readonly string[]): string {
  const payload: SavedEventsPayload = {
    version: SAVED_EVENTS_VERSION,
    eventIds: [...new Set(eventIds)].slice(0, MAX_STORED_IDS),
  };

  return JSON.stringify(payload);
}
