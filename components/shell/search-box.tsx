"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { direction, formatSignedPct, formatUsd } from "@/lib/format";
import { useQuotes, useTickerSearch } from "@/lib/market/hooks";

/** Ticker search with a keyboard-navigable results list. */
export function SearchBox() {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const { data: results = [], isLoading, error } = useTickerSearch(query);
  const { data: quotes } = useQuotes(open ? results.map((r) => r.symbol) : []);

  const showList = open && query.trim().length > 0;

  function go(symbol: string) {
    setOpen(false);
    setQuery("");
    router.push(`/stocks/${symbol}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[active];
      if (pick) go(pick.symbol);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div role="search" className="relative w-full max-w-sm">
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
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search stocks
      </label>
      <input
        id={`${listId}-input`}
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        placeholder="Search stocks"
        autoComplete="off"
        spellCheck={false}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className="h-10 w-full rounded-full border border-line bg-surface pl-9 pr-4 text-sm text-text placeholder:text-faint transition-colors focus:border-brass focus:outline-none"
      />

      {showList && (
        <div className="absolute left-0 right-0 top-12 z-40 overflow-hidden rounded-xl border border-line bg-surface-raised shadow-2xl shadow-black/40">
          {error ? (
            <p className="px-4 py-3 text-sm text-loss">{error.message}</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">
              {isLoading ? "Searching…" : `No stocks match "${query.trim()}".`}
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Stocks" className="py-1.5">
              {results.map((asset, i) => {
                const quote = quotes?.[asset.symbol];
                const dir = quote ? direction(quote.change) : "flat";
                return (
                  <li
                    key={asset.symbol}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    // Keep focus in the input so blur doesn't close the list first.
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(asset.symbol)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-4 py-2.5",
                      i === active && "bg-surface",
                    )}
                  >
                    <span className="w-16 shrink-0 text-sm font-medium">{asset.symbol}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-muted">{asset.name}</span>
                    {quote && (
                      <span className="shrink-0 text-right text-xs tabular-nums">
                        <span className="block text-text">{formatUsd(quote.price)}</span>
                        <span
                          className={cn(
                            dir === "up" && "text-gain",
                            dir === "down" && "text-loss",
                            dir === "flat" && "text-muted",
                          )}
                        >
                          {formatSignedPct(quote.changePct)}
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
