"use client";

import { useMarketClock } from "@/lib/market/hooks";

const NY = "America/New_York";
const dayTime = new Intl.DateTimeFormat("en-US", {
  timeZone: NY,
  weekday: "long",
  hour: "numeric",
  minute: "2-digit",
});
const time = new Intl.DateTimeFormat("en-US", { timeZone: NY, hour: "numeric", minute: "2-digit" });

export function MarketStatus() {
  const { data: clock } = useMarketClock();
  if (!clock) return null;

  return (
    <p className="flex items-center gap-2 text-xs text-muted">
      <span
        aria-hidden
        className={clock.isOpen ? "size-1.5 rounded-full bg-gain" : "size-1.5 rounded-full bg-faint"}
      />
      {clock.isOpen
        ? `Market open until ${time.format(new Date(clock.nextClose))} ET`
        : `Market closed. Opens ${dayTime.format(new Date(clock.nextOpen))} ET`}
    </p>
  );
}
