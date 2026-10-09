import { Suspense } from "react";
import { PortfolioView } from "@/components/portfolio/portfolio-view";
import { HoldingsList, WatchlistList } from "@/components/portfolio/stock-list";
import { Columns } from "@/components/shell/columns";
import { requireProfile } from "@/lib/auth";
import { loadHoldings } from "@/lib/portfolio/data";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const profile = await requireProfile();
  const { holdings, watchlist } = await loadHoldings(profile.id);

  return (
    <Columns
      main={<PortfolioView cash={profile.cash_balance} holdings={holdings} />}
      rail={
        <div className="flex flex-col gap-4">
          <HoldingsList holdings={holdings} />
          <WatchlistList symbols={watchlist} />
        </div>
      }
    />
  );
}

function HomeSkeleton() {
  return (
    <Columns
      main={
        <div aria-hidden className="animate-pulse">
          <div className="h-4 w-28 rounded bg-surface" />
          <div className="mt-3 h-16 w-56 rounded-lg bg-surface" />
          <div className="mt-4 h-4 w-40 rounded bg-surface" />
          <div className="mt-6 h-72 sm:h-80" />
        </div>
      }
      rail={<div aria-hidden className="h-48 animate-pulse rounded-2xl bg-surface" />}
    />
  );
}
