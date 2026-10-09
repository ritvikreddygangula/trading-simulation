import { ChangeLabel } from "@/components/market/change-label";
import { PriceDisplay } from "@/components/market/price-display";
import { Columns } from "@/components/shell/columns";
import { Panel } from "@/components/ui/panel";
import { formatUsd } from "@/lib/format";

export default function HomePage() {
  return (
    <Columns
      main={
        <section aria-labelledby="portfolio-heading">
          <h1 id="portfolio-heading" className="text-sm text-muted">
            Portfolio value
          </h1>
          <PriceDisplay value={0} size="lg" className="mt-2" />
          <ChangeLabel change={0} changePct={0} period="Today" className="mt-3" />

          <div className="mt-8 flex h-64 flex-col justify-center border-b border-line">
            <svg viewBox="0 0 600 2" preserveAspectRatio="none" className="h-px w-full" aria-hidden>
              <line x1="0" y1="1" x2="600" y2="1" stroke="var(--faint)" strokeDasharray="4 6" />
            </svg>
            <p className="mt-4 text-sm text-muted">
              Your portfolio chart starts with your first trade.
            </p>
          </div>

          <div className="flex items-center justify-between border-b border-line py-5">
            <span className="text-base">Buying power</span>
            <span className="text-base tabular-nums">{formatUsd(0)}</span>
          </div>
        </section>
      }
      rail={
        <Panel className="p-5">
          <h2 className="text-lg font-medium">Watchlist</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Search for a stock and add it here to follow its price.
          </p>
        </Panel>
      }
    />
  );
}
