"use client";

import { useCallback, useState } from "react";
import { PriceChart } from "@/components/chart/price-chart";
import { ChangeLabel } from "@/components/market/change-label";
import { PriceDisplay } from "@/components/market/price-display";
import { direction, formatChartTime } from "@/lib/format";
import { useBars, useMarketClock, useQuote } from "@/lib/market/hooks";
import type { Asset, PricePoint, Range } from "@/lib/market/types";
import { KeyStats } from "./key-stats";
import { MarketStatus } from "./market-status";
import { RangeTabs } from "./range-tabs";

const PERIOD: Record<Range, string> = {
  "1D": "Today",
  "1W": "Past week",
  "1M": "Past month",
  "3M": "Past 3 months",
  "1Y": "Past year",
  "5Y": "Past 5 years",
};

export function StockView({ asset }: { asset: Asset }) {
  const [range, setRange] = useState<Range>("1D");
  const [hovered, setHovered] = useState<PricePoint | null>(null);
  const onHover = useCallback((p: PricePoint | null) => setHovered(p), []);

  const { data: quote, error: quoteError } = useQuote(asset.symbol);
  const { data: bars, error: barsError, isLoading: barsLoading } = useBars(asset.symbol, range);
  const { data: clock } = useMarketClock();

  // Range change runs from the range's baseline to the latest trade.
  const baseline = range === "1D" ? (quote?.prevClose ?? bars?.baseline) : bars?.baseline;
  const latest = quote?.price ?? bars?.points.at(-1)?.price;
  const shown = hovered?.price ?? latest;
  const change = shown != null && baseline != null ? shown - baseline : 0; // only shown when both exist
  const rangeDirection = direction(latest != null && baseline != null ? latest - baseline : 0);

  return (
    <article>
      <header>
        <p className="text-sm text-muted">{asset.name}</p>
        <h1 className="sr-only">
          {asset.name} ({asset.symbol})
        </h1>
        {shown != null ? (
          <PriceDisplay value={shown} size="lg" className="mt-2" />
        ) : (
          <div aria-hidden className="mt-3 h-16 w-56 animate-pulse rounded-lg bg-surface" />
        )}
        {shown != null && baseline != null ? (
          <ChangeLabel
            change={change}
            changePct={change / baseline}
            period={hovered ? formatChartTime(hovered.time, range) : PERIOD[range]}
            className="mt-3"
          />
        ) : (
          <div aria-hidden className="mt-4 h-4 w-40 animate-pulse rounded bg-surface" />
        )}
        {quoteError && <p className="mt-2 text-sm text-loss">{quoteError.message}</p>}
      </header>

      <div className="mt-6">
        {bars && baseline != null ? (
          <PriceChart
            points={bars.points}
            range={range}
            baseline={baseline}
            direction={rangeDirection}
            livePrice={quote?.price}
            liveOpen={clock?.isOpen}
            onHover={onHover}
          />
        ) : (
          <div className="flex h-72 items-center sm:h-80">
            {barsError ? (
              <p className="text-sm text-loss">{barsError.message}</p>
            ) : (
              barsLoading && <div aria-hidden className="h-px w-full animate-pulse bg-line" />
            )}
          </div>
        )}
      </div>

      <RangeTabs value={range} onChange={setRange} direction={rangeDirection} />
      <div className="mt-3">
        <MarketStatus />
      </div>

      <KeyStats quote={quote} asset={asset} />
    </article>
  );
}
