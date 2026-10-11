"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/format";
import { useQuote } from "@/lib/market/hooks";

/**
 * Phones stack the order panel below the chart and stats, so this bar keeps
 * a way to trade in reach. It hides once the panel itself is on screen.
 */
export function MobileTradeBar({ symbol, targetId }: { symbol: string; targetId: string }) {
  const { data: quote } = useQuote(symbol);
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => setPanelVisible(entry.isIntersecting), {
      threshold: 0.2,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      aria-hidden={panelVisible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/90 px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-3 backdrop-blur transition-transform duration-200 lg:hidden",
        panelVisible && "translate-y-full",
      )}
    >
      <div className="mx-auto flex max-w-[680px] items-center justify-between gap-4">
        <p className="text-sm">
          <span className="font-medium">{symbol}</span>
          {quote && <span className="ml-2 tabular-nums text-muted">{formatUsd(quote.price)}</span>}
        </p>
        <a
          href={`#${targetId}`}
          tabIndex={panelVisible ? -1 : undefined}
          className="inline-flex h-10 items-center rounded-full bg-brass px-6 text-sm font-medium text-brass-ink transition-colors hover:bg-brass-hover"
        >
          Trade
        </a>
      </div>
    </div>
  );
}
