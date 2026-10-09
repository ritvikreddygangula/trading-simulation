import type { PricePoint } from "@/lib/market/types";

/** Something that changed cash and/or shares. Times are unix seconds. */
export interface LedgerEvent {
  time: number;
  cashDelta: number;
  symbol?: string;
  qtyDelta?: number;
}

export interface HistoryInput {
  /** Ascending unix seconds to value the portfolio at. */
  timeline: number[];
  cashNow: number;
  holdingsNow: Record<string, number>;
  events: LedgerEvent[];
  /** Ascending price history per symbol. */
  prices: Record<string, PricePoint[]>;
}

export interface HistoryResult {
  points: PricePoint[];
  /** Cash and holdings as of the first timeline point. */
  start: { cash: number; holdings: Record<string, number> };
}

const DUST = 1e-9;

/** Last price at or before `time`; before history starts, the first known price. */
function priceAt(series: PricePoint[], time: number) {
  let lo = 0;
  let hi = series.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid].time <= time) {
      found = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return series[found === -1 ? 0 : found]?.price ?? 0;
}

/**
 * Rebuilds portfolio value over time by starting from today's cash and
 * holdings and undoing each event, newest first. Working backwards means
 * balances changed outside the ledger (like a manual SQL top-up) are still
 * counted correctly from the point they appear onwards.
 */
export function buildHistory({ timeline, cashNow, holdingsNow, events, prices }: HistoryInput): HistoryResult {
  const newestFirst = [...events].sort((a, b) => b.time - a.time);
  let cash = cashNow;
  const holdings: Record<string, number> = { ...holdingsNow };
  let next = 0;

  const points: PricePoint[] = new Array(timeline.length);
  for (let i = timeline.length - 1; i >= 0; i--) {
    const t = timeline[i];
    while (next < newestFirst.length && newestFirst[next].time > t) {
      const e = newestFirst[next++];
      cash -= e.cashDelta;
      if (e.symbol && e.qtyDelta) holdings[e.symbol] = (holdings[e.symbol] ?? 0) - e.qtyDelta;
    }

    let value = cash;
    for (const [symbol, qty] of Object.entries(holdings)) {
      if (Math.abs(qty) < DUST) continue;
      const series = prices[symbol];
      if (series?.length) value += qty * priceAt(series, t);
    }
    points[i] = { time: t, price: Math.round(value * 100) / 100 };
  }

  for (const symbol of Object.keys(holdings)) {
    if (Math.abs(holdings[symbol]) < DUST) holdings[symbol] = 0;
  }
  return { points, start: { cash: Math.round(cash * 100) / 100, holdings } };
}
