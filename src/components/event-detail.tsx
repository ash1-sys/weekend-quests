"use client";

import { useEffect, useRef, useState } from "react";
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
} from "@/lib/event-formatters";
import type { Event } from "@/lib/events";

type EventDetailProps = {
  event: Event;
  isSaved: boolean;
  onBack: () => void;
  onShare: (event: Event) => void;
  onToggleSave: (eventId: string) => void;
};

function BackIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
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

function PinIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-[19px]"
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

function ExternalLinkIcon() {
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
      <path d="M15 4h5v5M20 4l-9 9" />
      <path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6" />
    </svg>
  );
}

function providerLabel(event: Event): string {
  if (event.source.provider === "ticketmaster") {
    return "View on Ticketmaster";
  }

  if (event.source.provider === "eventbrite") {
    return "View on Eventbrite";
  }

  if (event.source.provider === "skiddle") {
    return "View on Skiddle";
  }

  return "Visit event website";
}

export function EventDetail({
  event,
  isSaved,
  onBack,
  onShare,
  onToggleSave,
}: EventDetailProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const calendarMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    backButtonRef.current?.focus();
  }, [event.id]);

  useEffect(() => {
    if (!isCalendarOpen) {
      return;
    }

    function closeMenu(pointerEvent: PointerEvent) {
      if (
        pointerEvent.target instanceof Node &&
        !calendarMenuRef.current?.contains(pointerEvent.target)
      ) {
        setIsCalendarOpen(false);
      }
    }

    function handleEscape(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === "Escape") {
        setIsCalendarOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeMenu);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", closeMenu);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCalendarOpen]);

  function downloadCalendarFile() {
    const blob = new Blob([createIcsContent(event)], {
      type: "text/calendar;charset=utf-8",
    });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = createCalendarFilename(event);
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    setIsCalendarOpen(false);
  }

  const fullAddress = [
    event.location.address,
    event.location.area,
    event.location.city,
    event.location.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="min-h-screen bg-paper">
      <div
        className="relative h-[340px] md:h-[420px]"
      >
        <EventArtwork
          event={event}
          loadEagerly
          sizes="(min-width: 768px) 1120px, 100vw"
        />
        <div className="absolute inset-0 bg-[radial-gradient(130%_100%_at_16%_10%,rgba(255,255,255,0.34),transparent_56%),linear-gradient(to_top,rgba(0,0,0,0.15),transparent_55%)]" />

        <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between md:left-6 md:right-6 md:top-6">
          <button
            ref={backButtonRef}
            type="button"
            onClick={onBack}
            className="flex h-10 items-center gap-1.5 rounded-full bg-white/95 pl-3 pr-4 text-[13px] font-bold text-ink shadow-[0_2px_8px_rgba(0,0,0,0.16)] backdrop-blur-md transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <BackIcon />
            Back
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              aria-label={
                isSaved
                  ? `Remove ${event.title} from saved events`
                  : `Save ${event.title}`
              }
              aria-pressed={isSaved}
              onClick={() => onToggleSave(event.id)}
              className={`flex size-10 items-center justify-center rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.16)] backdrop-blur-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                isSaved ? "bg-accent text-white" : "bg-white/95 text-ink"
              }`}
            >
              <BookmarkIcon filled={isSaved} />
            </button>

            <button
              type="button"
              aria-label={`Share ${event.title}`}
              onClick={() => onShare(event)}
              className="flex size-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-[0_2px_8px_rgba(0,0,0,0.16)] backdrop-blur-md transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <ShareIcon />
            </button>
          </div>
        </div>

        <div className="absolute bottom-5 left-5 z-10 flex gap-2 md:bottom-6 md:left-6">
          <span
            className={`rounded-full px-3 py-1.5 text-[13px] font-bold ${
              event.price.isFree
                ? "bg-teal text-white"
                : "bg-white/95 text-ink backdrop-blur-md"
            }`}
          >
            {formatEventPrice(event)}
          </span>
          <span className="rounded-full bg-black/35 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
            {event.category}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pb-10 pt-6 md:px-8 md:pb-14 md:pt-8">
        <h1 className="text-[30px] font-extrabold leading-[1.05] tracking-[-0.03em] text-balance md:text-[42px]">
          {event.title}
        </h1>

        <div className="mt-5 rounded-[16px] border border-border bg-white p-4 md:mt-6 md:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-accent-tint text-accent">
              <CalendarIcon />
            </div>
            <div>
              <p className="text-[14.5px] font-bold">
                {formatEventDate(event)}
              </p>
              <p className="mt-0.5 text-[13px] text-muted">
                {formatEventTime(event)}
              </p>
            </div>
          </div>

          <div className="my-3.5 h-px bg-[#efeee9]" />

          <div className="flex items-center gap-3">
            <div className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#e6f0ed] text-teal">
              <PinIcon />
            </div>
            <div>
              <p className="text-[14.5px] font-bold">
                {event.location.venue}
              </p>
              <p className="mt-0.5 text-[13px] text-muted">
                {event.location.area}, London
              </p>
            </div>
          </div>
        </div>

        <section className="mt-6">
          <h2 className="text-[15px] font-bold tracking-[-0.01em]">About</h2>
          <p className="mt-2 text-[15px] leading-6 text-[#3d4042]">
            {event.description}
          </p>
        </section>

        <section className="mt-6">
          <h2 className="text-[15px] font-bold tracking-[-0.01em]">Where</h2>
          <div className="mt-2.5 rounded-[14px] border border-border bg-[linear-gradient(135deg,#eef2ec,#e7ece9)] p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-teal shadow-sm">
                <PinIcon />
              </div>
              <div>
                <p className="font-bold">{event.location.venue}</p>
                <p className="mt-1 text-sm leading-5 text-muted">
                  {fullAddress}
                </p>
              </div>
            </div>
          </div>
        </section>

        <a
          href={event.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-[14px] border border-border bg-white px-4 text-sm font-bold transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {providerLabel(event)}
          <ExternalLinkIcon />
        </a>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-border bg-paper/95 px-5 py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl gap-2.5">
          <button
            type="button"
            aria-label={`Share ${event.title}`}
            onClick={() => onShare(event)}
            className="flex size-[50px] shrink-0 items-center justify-center rounded-[14px] border border-border bg-white transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <ShareIcon />
          </button>

          <div ref={calendarMenuRef} className="relative flex-1">
            {isCalendarOpen ? (
              <div className="calendar-menu-enter absolute bottom-[58px] right-0 w-full overflow-hidden rounded-[14px] border border-border bg-white p-1.5 shadow-[0_12px_34px_rgba(34,30,24,0.24)]">
                <a
                  href={getGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsCalendarOpen(false)}
                  className="block rounded-[10px] px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-disabled"
                >
                  Google Calendar
                </a>
                <button
                  type="button"
                  onClick={downloadCalendarFile}
                  className="w-full rounded-[10px] px-3 py-2.5 text-left text-sm font-semibold transition-colors hover:bg-disabled"
                >
                  Download .ics file
                </button>
              </div>
            ) : null}

            <button
              type="button"
              aria-expanded={isCalendarOpen}
              onClick={() => setIsCalendarOpen((current) => !current)}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-[14px] bg-ink px-4 text-[15px] font-bold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <CalendarIcon />
              Add to calendar
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
