"use client";

import { useEffect, useId, useRef, useState } from "react";
import { EventArtwork } from "@/components/event-artwork";
import {
  createCalendarFilename,
  createIcsContent,
  getGoogleCalendarUrl,
} from "@/lib/calendar";
import {
  formatEventDate,
  formatEventPrice,
  formatEventTime,
  formatEventVenue,
} from "@/lib/event-formatters";
import type { Event } from "@/lib/events";

function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[18px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9h18M8 2.5v4M16 2.5v4M12 12v5M9.5 14.5h5" />
    </svg>
  );
}

function GoogleCalendarIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 items-center justify-center rounded-[9px] bg-accent-tint font-bold text-accent"
    >
      G
    </span>
  );
}

function DownloadIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex size-8 items-center justify-center rounded-[9px] bg-[#e6f0ed] text-teal"
    >
      <svg
        className="size-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" />
      </svg>
    </span>
  );
}

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mt-px size-[17px] shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

type EventCardProps = {
  event: Event;
  isSaved: boolean;
  loadImageEagerly?: boolean;
  onOpen: (eventId: string) => void;
  onToggleSave: (eventId: string) => void;
  onShare: (event: Event) => void;
};

export function EventCard({
  event,
  isSaved,
  loadImageEagerly = false,
  onOpen,
  onToggleSave,
  onShare,
}: EventCardProps) {
  const isFree = event.price.isFree;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarMenuRef = useRef<HTMLDivElement>(null);
  const calendarButtonRef = useRef<HTMLButtonElement>(null);
  const calendarMenuId = useId();

  useEffect(() => {
    if (!isCalendarOpen) {
      return;
    }

    function closeCalendarMenu(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !calendarMenuRef.current?.contains(event.target)
      ) {
        setIsCalendarOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsCalendarOpen(false);
        calendarButtonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", closeCalendarMenu);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", closeCalendarMenu);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCalendarOpen]);

  function downloadCalendarFile() {
    const calendarBlob = new Blob([createIcsContent(event)], {
      type: "text/calendar;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(calendarBlob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = createCalendarFilename(event);
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    setIsCalendarOpen(false);
    calendarButtonRef.current?.focus();
  }

  return (
    <article
      className="group relative h-[272px] cursor-pointer overflow-hidden rounded-[20px] border border-white/10 text-white shadow-[0_12px_30px_-24px_rgba(34,30,24,0.7)] transition-transform hover:-translate-y-0.5 md:h-[220px] md:rounded-[22px]"
    >
      <EventArtwork
        event={event}
        loadEagerly={loadImageEagerly}
        sizes="(min-width: 768px) 520px, 100vw"
      />
      <div className="absolute inset-0 bg-[radial-gradient(130%_100%_at_16%_10%,rgba(255,255,255,0.34),transparent_56%),radial-gradient(120%_120%_at_92%_88%,rgba(0,0,0,0.22),transparent_55%)]" />
      <button
        type="button"
        aria-label={`View details for ${event.title}`}
        onClick={() => onOpen(event.id)}
        className="absolute inset-0 z-[1] rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:rounded-[22px]"
      />

      <div className="absolute left-4 right-4 top-4 z-10 flex items-start justify-between gap-3 md:left-3 md:right-3 md:top-3">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-[11px] py-[5px] text-xs font-bold ${
              isFree
                ? "bg-teal text-white"
                : "bg-white/95 text-ink backdrop-blur-md"
            }`}
          >
            {formatEventPrice(event)}
          </span>
          <span className="rounded-full bg-black/30 px-2.5 py-[5px] text-[11px] font-semibold text-white backdrop-blur-md">
            {event.category}
          </span>
        </div>

        <div className="flex shrink-0 gap-2.5 md:gap-2">
          <button
            type="button"
            aria-label={
              isSaved
                ? `Remove ${event.title} from saved events`
                : `Save ${event.title}`
            }
            aria-pressed={isSaved}
            onClick={() => onToggleSave(event.id)}
            className={`flex size-10 items-center justify-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.16)] backdrop-blur-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:size-9 ${
              isSaved ? "bg-accent text-white" : "bg-white/95 text-ink"
            }`}
          >
            <BookmarkIcon filled={isSaved} />
          </button>
          <button
            type="button"
            aria-label={`Share ${event.title}`}
            onClick={() => onShare(event)}
            className="flex size-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-[0_2px_8px_rgba(0,0,0,0.16)] backdrop-blur-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:size-9"
          >
            <ShareIcon />
          </button>

          <div ref={calendarMenuRef} className="relative">
            <button
              ref={calendarButtonRef}
              type="button"
              aria-label={`Add ${event.title} to calendar`}
              aria-expanded={isCalendarOpen}
              aria-controls={calendarMenuId}
              onClick={() => setIsCalendarOpen((current) => !current)}
              className="flex size-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-[0_2px_8px_rgba(0,0,0,0.16)] backdrop-blur-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:size-9"
            >
              <CalendarIcon />
            </button>

            {isCalendarOpen ? (
              <div
                id={calendarMenuId}
                role="menu"
                aria-label={`Calendar options for ${event.title}`}
                className="calendar-menu-enter absolute right-0 top-12 z-20 w-56 overflow-hidden rounded-[14px] border border-border bg-white p-1.5 text-ink shadow-[0_12px_34px_rgba(34,30,24,0.24)] md:top-11"
              >
                <a
                  role="menuitem"
                  href={getGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsCalendarOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] px-2.5 py-2 text-sm font-semibold transition-colors hover:bg-disabled focus-visible:bg-disabled focus-visible:outline-none"
                >
                  <GoogleCalendarIcon />
                  Google Calendar
                </a>
                <button
                  type="button"
                  role="menuitem"
                  onClick={downloadCalendarFile}
                  className="flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-left text-sm font-semibold transition-colors hover:bg-disabled focus-visible:bg-disabled focus-visible:outline-none"
                >
                  <DownloadIcon />
                  Download .ics file
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/75 via-black/25 to-transparent px-5 pb-[18px] pt-24 md:px-4 md:pb-4 md:pt-16">
        <p className="text-[13px] font-semibold text-white/90 md:text-xs">
          {formatEventDate(event)} · {formatEventTime(event)}
        </p>
        <h2 className="mt-1 text-[22px] font-bold leading-[1.08] tracking-[-0.025em] text-balance md:text-[19px]">
          {event.title}
        </h2>
        <p className="mt-2 flex items-start gap-2 text-[14px] font-medium leading-tight text-white/90 md:mt-1.5 md:text-[13px]">
          <PinIcon />
          <span>{formatEventVenue(event)}</span>
        </p>
      </div>
    </article>
  );
}
