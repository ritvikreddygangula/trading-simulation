"use client";

/** Ticker search. Results are wired up once market data lands. */
export function SearchBox() {
  return (
    <form role="search" className="relative w-full max-w-sm" onSubmit={(e) => e.preventDefault()}>
      <svg
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        aria-hidden
      >
        <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M11 11 L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <label htmlFor="ticker-search" className="sr-only">
        Search stocks
      </label>
      <input
        id="ticker-search"
        type="search"
        placeholder="Search stocks"
        autoComplete="off"
        className="h-10 w-full rounded-full border border-line bg-surface pl-9 pr-4 text-sm text-text placeholder:text-faint transition-colors focus:border-brass focus:outline-none"
      />
    </form>
  );
}
