import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Columns } from "@/components/shell/columns";
import { StockView } from "@/components/stock/stock-view";
import { MarketDataError } from "@/lib/market/alpaca";
import { getAsset, normalizeSymbol } from "@/lib/market/service";

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

  let asset;
  try {
    asset = await getAsset(normalizeSymbol(decodeURIComponent(raw)));
  } catch (err) {
    if (err instanceof MarketDataError && (err.status === 400 || err.status === 404)) notFound();
    throw err;
  }

  return <Columns main={<StockView asset={asset} />} rail={null} />;
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
