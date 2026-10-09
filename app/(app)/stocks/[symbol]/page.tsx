import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Columns } from "@/components/shell/columns";
import { StockView } from "@/components/stock/stock-view";
import { WatchToggle } from "@/components/stock/watch-toggle";
import { OrderPanel } from "@/components/trade/order-panel";
import { PositionSummary } from "@/components/trade/position-summary";
import { Panel } from "@/components/ui/panel";
import { requireProfile } from "@/lib/auth";
import { MarketDataError } from "@/lib/market/alpaca";
import { getAsset, normalizeSymbol } from "@/lib/market/service";
import { getPosition } from "@/lib/trading/position";
import { isWatched } from "@/lib/watchlist-read";

export async function generateMetadata({ params }: PageProps<"/stocks/[symbol]">): Promise<Metadata> {
  const { symbol } = await params;
  return { title: symbol.toUpperCase() };
}

export default function StockPage({ params }: PageProps<"/stocks/[symbol]">) {
  return (
    <Suspense fallback={<StockSkeleton />}>
      <Stock params={params} />
    </Suspense>
  );
}

async function Stock({ params }: Pick<PageProps<"/stocks/[symbol]">, "params">) {
  await connection();
  const { symbol: raw } = await params;

  let symbol;
  let asset;
  try {
    symbol = normalizeSymbol(decodeURIComponent(raw));
    asset = await getAsset(symbol);
  } catch (err) {
    if (err instanceof MarketDataError && (err.status === 400 || err.status === 404)) notFound();
    throw err;
  }
  const [watched, position, profile] = await Promise.all([
    isWatched(symbol),
    getPosition(symbol),
    requireProfile(),
  ]);

  return (
    <Columns
      main={
        <StockView asset={asset}>
          {position && (
            <PositionSummary symbol={symbol} quantity={position.quantity} avgCost={position.avgCost} />
          )}
        </StockView>
      }
      rail={
        <div className="flex flex-col gap-4">
          <Panel>
            <OrderPanel
              key={symbol}
              symbol={symbol}
              fractionable={asset.fractionable}
              cash={profile.cash_balance}
              held={position?.quantity ?? 0}
            />
          </Panel>
          <WatchToggle key={asset.symbol} symbol={asset.symbol} initial={watched} />
        </div>
      }
    />
  );
}

function StockSkeleton() {
  return (
    <Columns
      main={
        <div aria-hidden className="animate-pulse">
          <div className="h-4 w-32 rounded bg-surface" />
          <div className="mt-3 h-16 w-56 rounded-lg bg-surface" />
          <div className="mt-4 h-4 w-40 rounded bg-surface" />
          <div className="mt-6 h-72 sm:h-80" />
        </div>
      }
      rail={null}
    />
  );
}
