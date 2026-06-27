type EmptyEventStateProps = {
  onClear: () => void;
};

export function EmptyEventState({ onClear }: EmptyEventStateProps) {
  return (
    <div className="px-6 py-16 text-center md:col-span-2 md:py-20">
      <div aria-hidden="true" className="text-4xl">
        🗺️
      </div>
      <h2 className="mt-3 text-[19px] font-bold tracking-[-0.02em]">
        Nothing matches just yet
      </h2>
      <p className="mx-auto mt-1.5 max-w-[300px] text-sm leading-6 text-muted">
        Try clearing a filter or peeking at the other weekend — London never
        really runs out.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        Clear filters
      </button>
    </div>
  );
}
