"use client";

import { cn } from "@/lib/cn";
import { direction, formatShares, formatSignedPct, formatSignedUsd, formatUsd } from "@/lib/format";
import { useQuote } from "@/lib/market/hooks";

interface PositionSummaryProps {
  symbol: string;
  quantity: number;
  avgCost: number;
}

export function PositionSummary({ symbol, quantity, avgCost }: PositionSummaryProps) {
  const { data: quote } = useQuote(symbol);
  const price = quote?.price;
  const marketValue = price != null ? quantity * price : null;
  const cost = quantity * avgCost;
  const totalReturn = marketValue != null ? marketValue - cost : null;
  const todayReturn = quote ? quantity * quote.change : null;

  return (
    <section aria-labelledby="position-heading" className="mt-12">
      <h2 id="position-heading" className="border-b border-line pb-3 text-xl font-medium">
        Your position
      </h2>
      <div className="grid gap-8 pt-5 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted">Market value</p>
          <p className="mt-1 font-display text-3xl">{marketValue != null ? formatUsd(marketValue) : "—"}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <Stat label="Today's return" value={todayReturn} base={todayReturn != null && quote ? quantity * quote.prevClose : null} />
            <Stat label="Total return" value={totalReturn} base={cost} />
          </dl>
        </div>
        <div>
          <p className="text-sm text-muted">Shares</p>
          <p className="mt-1 font-display text-3xl">{formatShares(quantity)}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Average cost</dt>
              <dd className="tabular-nums">{formatUsd(avgCost)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Total cost</dt>
              <dd className="tabular-nums">{formatUsd(cost)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value, base }: { label: string; value: number | null; base: number | null }) {
  const dir = value != null ? direction(value) : "flat";
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd
        className={cn(
          "tabular-nums",
          dir === "up" && "text-gain",
          dir === "down" && "text-loss",
        )}
      >
        {value != null && base
          ? `${formatSignedUsd(value)} (${formatSignedPct(value / base)})`
          : "—"}
      </dd>
    </div>
  );
}
