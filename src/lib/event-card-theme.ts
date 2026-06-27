import type { Event, EventCategory } from "@/lib/events";

const CATEGORY_GRADIENTS: Record<EventCategory, string> = {
  Music: "linear-gradient(145deg, #6d5bd0 0%, #2a2a72 100%)",
  "Food & drink": "linear-gradient(145deg, #f2994a 0%, #a73831 100%)",
  Outdoors: "linear-gradient(145deg, #56ccf2 0%, #18538c 100%)",
  Arts: "linear-gradient(145deg, #b06ab3 0%, #4568dc 100%)",
  Sports: "linear-gradient(145deg, #f2c94c 0%, #d97722 100%)",
  Tech: "linear-gradient(145deg, #00b894 0%, #0984e3 100%)",
};

const EVENT_GRADIENTS: Record<string, string> = {
  "peckham-rooftop-supper-club":
    "linear-gradient(145deg, #c94b4b 0%, #4b134f 100%)",
  "hot-chip-dj-set":
    "linear-gradient(145deg, #ec008c 0%, #fc6767 100%)",
  "columbia-road-flower-market":
    "linear-gradient(145deg, #11998e 0%, #38ef7d 100%)",
  "print-club-open-studio":
    "linear-gradient(145deg, #f7971e 0%, #ffd200 100%)",
  "sunday-league-five-a-side":
    "linear-gradient(145deg, #2193b0 0%, #6dd5ed 100%)",
  "founders-and-funders-pitch-night":
    "linear-gradient(145deg, #834d9b 0%, #d04ed6 100%)",
};

export function getEventCardGradient(event: Event): string {
  return EVENT_GRADIENTS[event.id] ?? CATEGORY_GRADIENTS[event.category];
}
