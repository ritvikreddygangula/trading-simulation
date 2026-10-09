"use client";

import Link from "next/link";
import { Sparkline } from "@/components/market/sparkline";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { direction, formatShares, formatSignedPct, formatUsd } from "@/lib/format";
import { useQuotes } from "@/lib/market/hooks";

interface Row {
  symbol: string;
  /** Shown under the ticker, e.g. "1.5 shares". */
  detail?: string;
}

function StockList({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  const { data: quotes } = useQuotes(rows.map((r) => r.symbol));

  return (
    <Panel>
      <h2 className="border-b border-line px-5 py-4 text-lg font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-5 py-4 text-sm leading-relaxed text-muted">{empty}</p>
      ) : (
        <ul>
          {rows.map(({ symbol, detail }) => {
            const quote = quotes?.[symbol];
            const dir = quote ? direction(quote.change) : "flat";
            return (
              <li key={symbol}>
                <Link
                  href={`/stocks/${symbol}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-raised"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{symbol}</span>
                    {detail && <span className="block truncate text-xs text-muted">{detail}</span>}
                  </span>
                  <Sparkline symbol={symbol} direction={dir} />
                  <span className="w-20 shrink-0 text-right text-sm tabular-nums">
                    <span className="block">{quote ? formatUsd(quote.price) : "—"}</span>
                    <span
                      className={cn(
                        "block text-xs",
                        dir === "up" && "text-gain",
                        dir === "down" && "text-loss",
                        dir === "flat" && "text-muted",
                      )}
                    >
                      {quote ? formatSignedPct(quote.changePct) : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function HoldingsList({ holdings }: { holdings: Array<{ symbol: string; quantity: number }> }) {
  return (
    <StockList
      title="Stocks"
      empty="Stocks you buy show up here."
      rows={holdings.map((h) => ({
        symbol: h.symbol,
        detail: `${formatShares(h.quantity)} ${h.quantity === 1 ? "share" : "shares"}`,
      }))}
    />
  );
}

export function WatchlistList({ symbols }: { symbols: string[] }) {
  return (
    <StockList
      title="Watchlist"
      empty="Search for a stock and add it here to follow its price."
      rows={symbols.map((symbol) => ({ symbol }))}
    />
  );
}
