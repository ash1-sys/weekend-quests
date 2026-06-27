import {
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/lib/events";
import type { WeekendKey } from "@/lib/weekend";

export type PriceFilter = "all" | "free" | "paid";

type FilterBarProps = {
  price: PriceFilter;
  categories: readonly EventCategory[];
  weekend: WeekendKey;
  onPriceChange: (price: PriceFilter) => void;
  onCategoryToggle: (category: EventCategory) => void;
  onWeekendChange: (weekend: WeekendKey) => void;
};

const PRICE_OPTIONS: ReadonlyArray<{
  value: PriceFilter;
  label: string;
}> = [
  { value: "free", label: "Free" },
  { value: "paid", label: "Paid" },
  { value: "all", label: "All" },
];

const WEEKEND_OPTIONS: ReadonlyArray<{
  value: WeekendKey;
  label: string;
}> = [
  { value: "this", label: "This weekend" },
  { value: "next", label: "Next weekend" },
];

export function FilterBar({
  price,
  categories,
  weekend,
  onPriceChange,
  onCategoryToggle,
  onWeekendChange,
}: FilterBarProps) {
  return (
    <div className="-mx-5 overflow-hidden md:mx-0 md:overflow-visible">
      <div className="no-scrollbar flex items-center gap-2.5 overflow-x-auto px-5 pb-1 md:px-0 lg:overflow-visible">
        <div
          className="flex shrink-0 rounded-full bg-disabled p-[3px]"
          aria-label="Price"
          role="group"
        >
          {PRICE_OPTIONS.map((option) => {
            const active = price === option.value;

            return (
              <button
                type="button"
                key={option.value}
                aria-pressed={active}
                onClick={() => onPriceChange(option.value)}
                className={`rounded-full px-[15px] py-[7px] text-[13px] font-semibold transition-colors ${
                  active
                    ? "bg-white text-ink shadow-[0_1px_4px_rgba(34,30,24,0.12)]"
                    : "text-muted hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        <span aria-hidden="true" className="h-[22px] w-px shrink-0 bg-[#e0deda]" />

        {EVENT_CATEGORIES.map((category) => {
          const active = categories.includes(category);

          return (
            <button
              type="button"
              key={category}
              aria-pressed={active}
              onClick={() => onCategoryToggle(category)}
              className={`shrink-0 rounded-full border px-[14px] py-2 text-[13px] font-semibold transition-colors ${
                active
                  ? "border-ink bg-ink text-white"
                  : "border-border bg-white text-[#585a5d] hover:border-ink hover:text-ink"
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>

      <div
        className="no-scrollbar mt-2 flex gap-2.5 overflow-x-auto px-5 pb-1 md:mt-3 md:overflow-visible md:px-0"
        aria-label="Weekend"
        role="group"
      >
        {WEEKEND_OPTIONS.map((option) => {
          const active = weekend === option.value;

          return (
            <button
              type="button"
              key={option.value}
              aria-pressed={active}
              onClick={() => onWeekendChange(option.value)}
              className={`shrink-0 rounded-full border px-[15px] py-2 text-[13px] font-semibold transition-colors ${
                active
                  ? "border-accent bg-accent-tint text-accent-deep"
                  : "border-border bg-white text-[#585a5d] hover:border-ink hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
