import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Columns } from "@/components/shell/columns";
import { StockView } from "@/components/stock/stock-view";
import { WatchToggle } from "@/components/stock/watch-toggle";
import { Panel } from "@/components/ui/panel";
import { MarketDataError } from "@/lib/market/alpaca";
import { getAsset, normalizeSymbol } from "@/lib/market/service";
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
  const watched = await isWatched(symbol);

  return (
    <Columns
      main={<StockView asset={asset} />}
      rail={
        <Panel className="p-5">
          <h2 className="text-lg font-medium">{asset.symbol}</h2>
          <p className="mt-1 text-sm text-muted">
            {asset.fractionable ? "Fractional shares available" : "Whole shares only"}
          </p>
          <div className="mt-5">
            <WatchToggle key={asset.symbol} symbol={asset.symbol} initial={watched} />
          </div>
        </Panel>
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
