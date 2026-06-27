import Image from "next/image";
import { getEventCardGradient } from "@/lib/event-card-theme";
import type { Event } from "@/lib/events";

type EventArtworkProps = {
  event: Event;
  loadEagerly?: boolean;
  sizes: string;
};

export function EventArtwork({
  event,
  loadEagerly = false,
  sizes,
}: EventArtworkProps) {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      style={{ backgroundImage: getEventCardGradient(event) }}
    >
      {event.imageUrl ? (
        <Image
          src={event.imageUrl}
          alt=""
          fill
          loading={loadEagerly ? "eager" : "lazy"}
          sizes={sizes}
          className="object-cover"
        />
      ) : null}
    </div>
  );
}
