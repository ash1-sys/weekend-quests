type ToastProps = {
  message: string | null;
};

export function Toast({ message }: ToastProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-[70] flex justify-center md:bottom-6"
    >
      {message ? (
        <div className="toast-enter rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(34,30,24,0.3)]">
          {message}
        </div>
      ) : null}
    </div>
  );
}
