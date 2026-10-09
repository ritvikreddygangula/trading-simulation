import { formatCompact, formatUsd } from "@/lib/format";
import type { Asset, Quote } from "@/lib/market/types";

export function KeyStats({ quote, asset }: { quote?: Quote; asset: Asset }) {
  const stats: Array<[string, string]> = [
    ["Open", quote?.open != null ? formatUsd(quote.open) : "—"],
    ["Today's high", quote?.high != null ? formatUsd(quote.high) : "—"],
    ["Today's low", quote?.low != null ? formatUsd(quote.low) : "—"],
    ["Previous close", quote ? formatUsd(quote.prevClose) : "—"],
    ["Volume", quote?.volume != null ? formatCompact(quote.volume) : "—"],
    ["Exchange", asset.exchange],
  ];

  return (
    <section aria-labelledby="stats-heading" className="mt-12">
      <h2 id="stats-heading" className="border-b border-line pb-3 text-xl font-medium">
        Key statistics
      </h2>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-5 pt-5 sm:grid-cols-3">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-6 text-xs text-faint">
        Prices from the IEX exchange feed via Alpaca. Volume reflects IEX trades only. Charts by{" "}
        <a href="https://www.tradingview.com/" className="underline hover:text-muted">
          TradingView
        </a>
        .
      </p>
    </section>
  );
}
