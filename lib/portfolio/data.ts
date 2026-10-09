import "server-only";
import { getBars } from "@/lib/market/service";
import type { Bars, PricePoint, Range } from "@/lib/market/types";
import { createClient } from "@/lib/supabase/server";
import { buildHistory, type LedgerEvent } from "./history";

export interface Holding {
  symbol: string;
  quantity: number;
  avgCost: number;
}

/** The signed-in user's holdings and watchlist (RLS scopes both to them). */
export async function loadHoldings() {
  const supabase = await createClient();
  const [positions, watchlist] = await Promise.all([
    supabase.from("positions").select("symbol, quantity, avg_cost").order("symbol"),
    supabase.from("watchlist").select("symbol").order("created_at"),
  ]);
  const holdings: Holding[] = (positions.data ?? []).map((p) => ({
    symbol: p.symbol,
    quantity: Number(p.quantity),
    avgCost: Number(p.avg_cost),
  }));
  return { holdings, watchlist: (watchlist.data ?? []).map((w) => w.symbol as string) };
}

const toUnix = (iso: string) => Math.floor(new Date(iso).getTime() / 1000);

/** Portfolio value over a chart range, shaped like a stock's Bars. */
export async function loadPortfolioHistory(userId: string, range: Range): Promise<Bars> {
  const supabase = await createClient();
  const clock = await getBars("SPY", range);
  const timeline = clock.points.map((p) => p.time);
  const since = new Date(timeline[0] * 1000).toISOString();

  const [profile, positions, orders, funding] = await Promise.all([
    supabase.from("profiles").select("cash_balance").eq("id", userId).single(),
    supabase.from("positions").select("symbol, quantity"),
    supabase.from("orders").select("symbol, side, quantity, notional, created_at").gt("created_at", since),
    supabase.from("funding_events").select("amount, created_at").eq("user_id", userId).gt("created_at", since),
  ]);

  const holdingsNow: Record<string, number> = {};
  for (const p of positions.data ?? []) holdingsNow[p.symbol] = Number(p.quantity);

  const events: LedgerEvent[] = [
    ...(orders.data ?? []).map((o) => {
      const buy = o.side === "buy";
      return {
        time: toUnix(o.created_at),
        symbol: o.symbol as string,
        qtyDelta: (buy ? 1 : -1) * Number(o.quantity),
        cashDelta: (buy ? -1 : 1) * Number(o.notional),
      };
    }),
    ...(funding.data ?? []).map((f) => ({ time: toUnix(f.created_at), cashDelta: Number(f.amount) })),
  ];

  const symbols = new Set([...Object.keys(holdingsNow), ...events.flatMap((e) => (e.symbol ? [e.symbol] : []))]);
  const series = await Promise.all(
    [...symbols].map(async (symbol) => {
      // A delisted stock with no data just drops out rather than breaking the chart.
      const bars = await getBars(symbol, range).catch(() => null);
      return [symbol, bars] as const;
    }),
  );
  const prices: Record<string, PricePoint[]> = {};
  for (const [symbol, bars] of series) if (bars) prices[symbol] = bars.points;

  const { points, start } = buildHistory({
    timeline,
    cashNow: Number(profile.data?.cash_balance ?? 0),
    holdingsNow,
    events,
    prices,
  });

  // 1D is measured from yesterday's close; longer ranges from their first point.
  let baseline = points[0]?.price ?? 0;
  if (range === "1D") {
    baseline = start.cash;
    for (const [symbol, qty] of Object.entries(start.holdings)) {
      const bars = series.find(([s]) => s === symbol)?.[1];
      if (qty && bars) baseline += qty * bars.baseline;
    }
  }

  return { symbol: "PORTFOLIO", range, points, baseline: Math.round(baseline * 100) / 100 };
}
