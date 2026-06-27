export function WeekendQuestsLogo({
  weekendLabel = "20–21 June",
}: {
  weekendLabel?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <svg
        aria-hidden="true"
        className="h-10 w-8 shrink-0 md:h-11 md:w-9"
        viewBox="0 0 32 40"
        fill="none"
      >
        <path
          d="M0 16C0 7.16 7.16 0 16 0s16 7.16 16 16-7.16 16-16 16c-4.8 0-9.08-2.12-12-5.46L0 32V16Z"
          fill="var(--color-accent)"
        />
        <text
          x="16"
          y="21"
          textAnchor="middle"
          fill="#fff"
          fontFamily="Satoshi, sans-serif"
          fontWeight="900"
          fontSize="17"
        >
          W
        </text>
        <circle
          cx="16"
          cy="37"
          r="3"
          fill="var(--color-accent)"
          opacity=".4"
        />
      </svg>

      <div className="min-w-0">
        <div className="whitespace-nowrap text-[24px] font-black leading-none tracking-[-0.035em] md:text-[28px]">
          Weekend Quests
        </div>
        <p className="mt-1 text-[13px] font-medium leading-none text-muted md:text-sm">
          London · {weekendLabel}
        </p>
      </div>
    </div>
  );
}
