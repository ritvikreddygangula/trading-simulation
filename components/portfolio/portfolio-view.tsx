"use client";

import { useCallback, useState } from "react";
import { PriceChart } from "@/components/chart/price-chart";
import { ChangeLabel } from "@/components/market/change-label";
import { PriceDisplay } from "@/components/market/price-display";
import { MarketStatus } from "@/components/stock/market-status";
import { RangeTabs } from "@/components/stock/range-tabs";
import { direction, formatChartTime, formatUsd } from "@/lib/format";
import { useMarketClock, usePortfolioHistory, useQuotes } from "@/lib/market/hooks";
import type { PricePoint, Range } from "@/lib/market/types";
import type { Holding } from "@/lib/portfolio/data";

const PERIOD: Record<Range, string> = {
  "1D": "Today",
  "1W": "Past week",
  "1M": "Past month",
  "3M": "Past 3 months",
  "1Y": "Past year",
  "5Y": "Past 5 years",
};

export function PortfolioView({ cash, holdings }: { cash: number; holdings: Holding[] }) {
  const [range, setRange] = useState<Range>("1D");
  const [hovered, setHovered] = useState<PricePoint | null>(null);
  const onHover = useCallback((p: PricePoint | null) => setHovered(p), []);

  const { data: quotes } = useQuotes(holdings.map((h) => h.symbol));
  const { data: history, error } = usePortfolioHistory(range);
  const { data: clock } = useMarketClock();

  // Live value: cash plus every holding at its latest trade.
  const priced = holdings.every((h) => quotes?.[h.symbol]);
  const live = priced
    ? cash + holdings.reduce((sum, h) => sum + h.quantity * quotes![h.symbol].price, 0)
    : undefined;

  const baseline = history?.baseline;
  const shown = hovered?.price ?? live;
  const change = shown != null && baseline != null ? shown - baseline : null;
  const rangeDirection = direction(live != null && baseline != null ? live - baseline : 0);
  const isEmpty = cash === 0 && holdings.length === 0;

  return (
    <section aria-labelledby="portfolio-heading">
      <h1 id="portfolio-heading" className="text-sm text-muted">
        Portfolio value
      </h1>
      {shown != null ? (
        <PriceDisplay value={shown} size="lg" className="mt-2" />
      ) : (
        <div aria-hidden className="mt-3 h-16 w-56 animate-pulse rounded-lg bg-surface" />
      )}
      {change != null && baseline ? (
        <ChangeLabel
          change={change}
          changePct={change / baseline}
          period={hovered ? formatChartTime(hovered.time, range) : PERIOD[range]}
          className="mt-3"
        />
      ) : (
        <div aria-hidden className="mt-4 h-4 w-40" />
      )}

      <div className="mt-6">
        {isEmpty ? (
          <div className="flex h-72 flex-col justify-center sm:h-80">
            <svg viewBox="0 0 600 2" preserveAspectRatio="none" className="h-px w-full" aria-hidden>
              <line x1="0" y1="1" x2="600" y2="1" stroke="var(--faint)" strokeDasharray="4 6" />
            </svg>
            <p className="mt-4 text-sm text-muted">
              Your account is empty. Once an admin adds funds, buy a stock to start your chart.
            </p>
          </div>
        ) : history && baseline != null ? (
          <PriceChart
            points={history.points}
            range={range}
            baseline={baseline}
            direction={rangeDirection}
            livePrice={live}
            liveOpen={clock?.isOpen}
            onHover={onHover}
          />
        ) : (
          <div className="flex h-72 items-center sm:h-80">
            {error ? (
              <p className="text-sm text-loss">{error.message}</p>
            ) : (
              <div aria-hidden className="h-px w-full animate-pulse bg-line" />
            )}
          </div>
        )}
      </div>

      <RangeTabs value={range} onChange={setRange} direction={rangeDirection} />
      <div className="mt-3">
        <MarketStatus />
      </div>

      <div className="mt-8 flex items-center justify-between border-y border-line py-5">
        <span>Buying power</span>
        <span className="tabular-nums">{formatUsd(cash)}</span>
      </div>
    </section>
  );
}
