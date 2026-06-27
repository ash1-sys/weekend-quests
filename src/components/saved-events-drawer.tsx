"use client";

import { useEffect, useRef } from "react";
import { EventArtwork } from "@/components/event-artwork";
import {
  formatEventDate,
  formatEventPrice,
  formatEventTime,
} from "@/lib/event-formatters";
import type { Event } from "@/lib/events";

type SavedEventsDrawerProps = {
  events: readonly Event[];
  isOpen: boolean;
  onClose: () => void;
  onOpen: (eventId: string) => void;
  onRemove: (eventId: string) => void;
};

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function FilledBookmarkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    >
      <path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function SavedEventsDrawer({
  events,
  isOpen,
  onClose,
  onOpen,
  onRemove,
}: SavedEventsDrawerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ];

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (
      isOpen &&
      dialogRef.current &&
      !dialogRef.current.contains(document.activeElement)
    ) {
      closeButtonRef.current?.focus();
    }
  }, [events.length, isOpen]);

  if (!isOpen) {
    return null;
  }

  const savedNoun = events.length === 1 ? "quest" : "quests";

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close saved events"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-ink/40 backdrop-blur-[1px]"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-drawer-title"
        className="drawer-enter absolute inset-y-0 right-0 w-[min(380px,86vw)] overflow-y-auto bg-paper shadow-[-12px_0_40px_rgba(34,30,24,0.22)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-paper/95 px-[18px] pb-[14px] pt-[18px] backdrop-blur-md">
          <div>
            <h2
              id="saved-drawer-title"
              className="text-[19px] font-extrabold tracking-[-0.02em]"
            >
              Saved
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              {events.length} {savedNoun}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close saved events"
            className="flex size-[34px] items-center justify-center rounded-full border border-border bg-white transition-colors hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex flex-col gap-2.5 px-4 pb-8 pt-3.5">
          {events.length === 0 ? (
            <div className="px-5 py-12 text-center text-muted">
              <div aria-hidden="true" className="text-[34px]">
                🔖
              </div>
              <h3 className="mt-2 text-base font-bold tracking-[-0.01em] text-ink">
                Nothing saved yet
              </h3>
              <p className="mt-1 text-[13px] leading-5">
                Tap the bookmark on any quest to keep it here for the weekend.
              </p>
            </div>
          ) : (
            events.map((event) => (
              <article
                key={event.id}
                className="relative flex gap-3 rounded-[14px] border border-border bg-white p-2.5 transition-colors hover:border-[#dad8d4]"
              >
                <button
                  type="button"
                  aria-label={`View details for ${event.title}`}
                  onClick={() => onOpen(event.id)}
                  className="absolute inset-0 z-[1] rounded-[14px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none relative size-[62px] shrink-0 overflow-hidden rounded-[10px]"
                >
                  <EventArtwork event={event} sizes="62px" />
                </div>

                <div className="pointer-events-none min-w-0 flex-1 self-center">
                  <h3 className="truncate text-sm font-bold leading-tight tracking-[-0.01em]">
                    {event.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted">
                    {formatEventDate(event)} · {formatEventTime(event)}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {event.location.area} · {formatEventPrice(event)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemove(event.id)}
                  aria-label={`Remove ${event.title} from saved events`}
                  className="relative z-10 flex size-[30px] shrink-0 items-center justify-center self-start text-accent transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  <FilledBookmarkIcon />
                </button>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
