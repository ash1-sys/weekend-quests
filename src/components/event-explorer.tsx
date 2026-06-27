"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EmptyEventState } from "@/components/empty-event-state";
import { EventCard } from "@/components/event-card";
import { EventDetail } from "@/components/event-detail";
import {
  FilterBar,
  type PriceFilter,
} from "@/components/filter-bar";
import { SavedEventsDrawer } from "@/components/saved-events-drawer";
import { Toast } from "@/components/toast";
import { WeekendQuestsLogo } from "@/components/weekend-quests-logo";
import type { Event, EventCategory } from "@/lib/events";
import {
  parseSavedEventIds,
  SAVED_EVENTS_STORAGE_KEY,
  serializeSavedEventIds,
} from "@/lib/saved-events-storage";
import {
  createEventShareText,
  createEventShareUrl,
} from "@/lib/share";
import {
  eventIsInWeekend,
  type WeekendWindows,
  type WeekendKey,
} from "@/lib/weekend";

const TOAST_DURATION_MS = 1_800;

function SparklesIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px] shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
      <path d="m19 15 .7 1.8 1.8.2-1.8.7L19 19l-.7-1.8-1.8-.2 1.8-.5L19 15Z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

type EventExplorerProps = {
  initialEvents: readonly Event[];
  initialWeekendWindows: WeekendWindows;
};

export function EventExplorer({
  initialEvents,
  initialWeekendWindows,
}: EventExplorerProps) {
  const events = initialEvents;
  const weekendWindows = initialWeekendWindows;
  const [price, setPrice] = useState<PriceFilter>("all");
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [weekend, setWeekend] = useState<WeekendKey>("this");
  const [isSavedHydrated, setIsSavedHydrated] = useState(false);
  const [savedEventIds, setSavedEventIds] = useState<string[]>([]);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const feedScrollPositionRef = useRef(0);

  const validEventIds = useMemo(
    () => new Set(events.map((event) => event.id)),
    [events],
  );

  useEffect(() => {
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      try {
        setSavedEventIds(
          parseSavedEventIds(
            window.localStorage.getItem(SAVED_EVENTS_STORAGE_KEY),
            validEventIds,
          ),
        );
      } catch {
        setSavedEventIds([]);
      } finally {
        setIsSavedHydrated(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [validEventIds]);

  useEffect(() => {
    function syncSelectedEventFromUrl() {
      const eventId = new URL(window.location.href).searchParams.get("event");
      setSelectedEventId(
        eventId && validEventIds.has(eventId) ? eventId : null,
      );
    }

    syncSelectedEventFromUrl();
    window.addEventListener("popstate", syncSelectedEventFromUrl);

    return () =>
      window.removeEventListener("popstate", syncSelectedEventFromUrl);
  }, [validEventIds]);

  useEffect(
    () => () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!isSavedHydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        SAVED_EVENTS_STORAGE_KEY,
        serializeSavedEventIds(savedEventIds),
      );
    } catch {
      // Saving still works for the current tab when storage is unavailable.
    }
  }, [isSavedHydrated, savedEventIds]);

  useEffect(() => {
    function syncSavedEvents(event: StorageEvent) {
      if (event.key !== SAVED_EVENTS_STORAGE_KEY) {
        return;
      }

      setSavedEventIds(parseSavedEventIds(event.newValue, validEventIds));
    }

    window.addEventListener("storage", syncSavedEvents);

    return () => window.removeEventListener("storage", syncSavedEvents);
  }, [validEventIds]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const matchesWeekend = eventIsInWeekend(
          event,
          weekend,
          weekendWindows,
        );
        const matchesPrice =
          price === "all" ||
          (price === "free" && event.price.isFree) ||
          (price === "paid" && !event.price.isFree);
        const matchesCategory =
          categories.length === 0 || categories.includes(event.category);

        return matchesWeekend && matchesPrice && matchesCategory;
      }),
    [categories, events, price, weekend, weekendWindows],
  );

  const savedEvents = useMemo(() => {
    const eventsById = new Map(events.map((event) => [event.id, event]));

    return savedEventIds.flatMap((eventId) => {
      const event = eventsById.get(eventId);
      return event ? [event] : [];
    });
  }, [events, savedEventIds]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) ?? null,
    [events, selectedEventId],
  );

  function toggleCategory(category: EventCategory) {
    setCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
    );
  }

  function clearFilters() {
    setPrice("all");
    setCategories([]);
  }

  function toggleSavedEvent(eventId: string) {
    if (!validEventIds.has(eventId)) {
      return;
    }

    setSavedEventIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId],
    );
  }

  const closeSavedDrawer = useCallback(() => {
    setIsSavedDrawerOpen(false);
  }, []);

  function openEvent(eventId: string) {
    if (!validEventIds.has(eventId)) {
      return;
    }

    feedScrollPositionRef.current = window.scrollY;
    setIsSavedDrawerOpen(false);
    setSelectedEventId(eventId);

    const url = new URL(window.location.href);
    url.searchParams.set("event", eventId);
    window.history.pushState({}, "", url);
  }

  function closeEvent() {
    setSelectedEventId(null);

    const url = new URL(window.location.href);
    url.searchParams.delete("event");
    window.history.replaceState({}, "", url);

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: feedScrollPositionRef.current,
        behavior: "instant",
      });
    });
  }

  const showToast = useCallback((message: string) => {
    setToastMessage(message);

    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, TOAST_DURATION_MS);
  }, []);

  const copyShareUrl = useCallback(
    async (shareUrl: string) => {
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast("Copied!");
        return;
      } catch {
        const previouslyFocused =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const textarea = document.createElement("textarea");

        textarea.value = shareUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();

        const copied = document.execCommand("copy");
        textarea.remove();
        previouslyFocused?.focus();
        showToast(copied ? "Copied!" : "Unable to copy");
      }
    },
    [showToast],
  );

  const shareEvent = useCallback(
    async (event: Event) => {
      const shareUrl = createEventShareUrl(event.id, window.location.origin);
      const shouldUseNativeShare =
        typeof navigator.share === "function" &&
        (window.matchMedia("(pointer: coarse)").matches ||
          window.innerWidth < 768);

      if (shouldUseNativeShare) {
        try {
          await navigator.share({
            title: event.title,
            text: createEventShareText(event),
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }

      await copyShareUrl(shareUrl);
    },
    [copyShareUrl],
  );

  return (
    <>
      {selectedEvent ? (
        <EventDetail
          event={selectedEvent}
          isSaved={savedEventIds.includes(selectedEvent.id)}
          onBack={closeEvent}
          onShare={shareEvent}
          onToggleSave={toggleSavedEvent}
        />
      ) : (
      <div
        inert={isSavedDrawerOpen ? true : undefined}
        aria-hidden={isSavedDrawerOpen ? true : undefined}
      >
        <header className="sticky top-0 z-20 border-b border-border/90 bg-paper/95 px-5 pb-3 pt-5 backdrop-blur-md md:px-7 md:pb-5 md:pt-6 lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <WeekendQuestsLogo
            weekendLabel={weekendWindows[weekend].label}
          />

          <button
            type="button"
            aria-label="Open saved events"
            onClick={() => setIsSavedDrawerOpen(true)}
            className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-white px-3 text-[13px] font-bold shadow-[0_1px_2px_rgba(34,30,24,0.03)] transition-colors hover:border-ink md:h-11 md:px-4 md:text-sm"
          >
            <BookmarkIcon />
            <span>Saved</span>
            <span
              className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] text-white ${
                savedEventIds.length > 0 ? "bg-accent" : "bg-[#c0c1c3]"
              }`}
            >
              {savedEventIds.length}
            </span>
          </button>
        </div>

        <button
          type="button"
          disabled
          className="mt-5 flex h-[54px] w-full cursor-not-allowed items-center gap-3 rounded-[14px] border border-border bg-disabled px-[15px] text-left text-muted md:h-14 md:max-w-none md:px-4"
        >
          <SparklesIcon />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            What are you in the mood for?
          </span>
          <span className="rounded-full border border-border bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#aeb0b2]">
            Soon
          </span>
        </button>
        </header>

        <section className="px-5 pb-10 pt-5 md:px-7 md:pb-12 md:pt-6 lg:px-8">
        <FilterBar
          price={price}
          categories={categories}
          weekend={weekend}
          onPriceChange={setPrice}
          onCategoryToggle={toggleCategory}
          onWeekendChange={setWeekend}
        />

        <div
          className="mt-7 grid gap-5 md:grid-cols-2 md:gap-4 lg:gap-5"
          aria-live="polite"
        >
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                isSaved={savedEventIds.includes(event.id)}
                loadImageEagerly={index < 2}
                onOpen={openEvent}
                onToggleSave={toggleSavedEvent}
                onShare={shareEvent}
              />
            ))
          ) : (
            <EmptyEventState onClear={clearFilters} />
          )}
          </div>
        </section>

        <button
          type="button"
          aria-label={`Open saved events, ${savedEventIds.length} saved`}
          onClick={() => setIsSavedDrawerOpen(true)}
          className="fixed bottom-5 right-5 z-30 flex h-12 items-center gap-2 rounded-full bg-ink px-4 text-sm font-bold text-white shadow-[0_8px_24px_rgba(34,30,24,0.3)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:hidden"
        >
          <BookmarkIcon />
          <span>Saved</span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px]">
            {savedEventIds.length}
          </span>
        </button>
      </div>
      )}

      <SavedEventsDrawer
        events={savedEvents}
        isOpen={isSavedDrawerOpen && !selectedEvent}
        onClose={closeSavedDrawer}
        onOpen={openEvent}
        onRemove={toggleSavedEvent}
      />

      <Toast message={toastMessage} />
    </>
  );
}
