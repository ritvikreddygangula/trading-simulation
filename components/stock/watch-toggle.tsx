"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setWatched } from "@/lib/watchlist";

export function WatchToggle({ symbol, initial }: { symbol: string; initial: boolean }) {
  const [watched, setWatchedState] = useState(initial);
  const [optimistic, setOptimistic] = useOptimistic(watched);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !optimistic;
    setError(null);
    startTransition(async () => {
      setOptimistic(next);
      try {
        await setWatched(symbol, next);
        setWatchedState(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Couldn't update your watchlist.");
      }
    });
  }

  return (
    <div>
      <Button
        variant="secondary"
        className="w-full"
        onClick={toggle}
        aria-pressed={optimistic}
        disabled={pending}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          {optimistic ? (
            <path d="M3 7.5 L6 10 L11 4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M7 2 V12 M2 7 H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
        {optimistic ? "On your watchlist" : "Add to watchlist"}
      </Button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-loss">
          {error}
        </p>
      )}
    </div>
  );
}
