import "server-only";
import {
  dataApi,
  MarketDataError,
  tradingApi,
  type RawAsset,
  type RawBar,
  type RawClock,
  type RawSnapshot,
} from "./alpaca";
import { cached } from "./cache";
import type { Asset, Bars, MarketClock, PricePoint, Quote, Range } from "./types";

const SYMBOL_RE = /^[A-Z][A-Z.]{0,9}$/;
const LISTED_EXCHANGES = new Set(["NYSE", "NASDAQ", "ARCA", "AMEX", "BATS"]);

// Alpaca's asset list has no volume or market cap, so well-known names get a
// ranking boost to keep "NV" → NVDA instead of an obscure three-letter ticker.
const POPULAR = new Set(
  (
    "AAPL MSFT NVDA AMZN GOOGL GOOG META TSLA AVGO BRK.B JPM V MA UNH XOM LLY JNJ WMT PG HD " +
    "COST NFLX AMD INTC ORCL CRM ADBE PEP KO DIS BAC WFC CSCO QCOM TXN IBM PYPL UBER ABNB " +
    "SHOP SQ PLTR COIN SNOW HOOD RIVN LCID F GM NKE SBUX MCD BA CAT GE SPY QQQ VOO VTI IWM DIA ARKK"
  ).split(" "),
);

/** "Apple Inc. Common Stock" → "Apple Inc." */
function cleanName(name: string) {
  return name
    .replace(/\s+(Class [A-Z] )?(Common Stock|Capital Stock|Ordinary Shares|American Depositary Shares).*$/i, "")
    .trim();
}

export function normalizeSymbol(input: string | null | undefined) {
  const symbol = (input ?? "").trim().toUpperCase();
  if (!SYMBOL_RE.test(symbol)) throw new MarketDataError(`"${input}" isn't a valid ticker.`, 400);
  return symbol;
}

const nyClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
});

/** Minutes since midnight in New York. */
function nyMinutes(iso: string) {
  const parts = nyClock.formatToParts(new Date(iso));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get("hour") * 60 + get("minute");
}

const SESSION_OPEN = 9 * 60 + 30;
const SESSION_CLOSE = 16 * 60;

/** Calendar date (YYYY-MM-DD) in New York, where US sessions are defined. */
function nyDate(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(iso));
}

// Quotes -------------------------------------------------------------------

function toQuote(symbol: string, snap: RawSnapshot): Quote | null {
  const price = snap.latestTrade?.p ?? snap.dailyBar?.c;
  const prevClose = snap.prevDailyBar?.c;
  if (price == null || prevClose == null) return null;
  const change = price - prevClose;
  return {
    symbol,
    price,
    prevClose,
    change,
    changePct: prevClose ? change / prevClose : 0,
    open: snap.dailyBar?.o ?? null,
    high: snap.dailyBar?.h ?? null,
    low: snap.dailyBar?.l ?? null,
    volume: snap.dailyBar?.v ?? null,
    updatedAt: snap.latestTrade?.t ?? snap.dailyBar?.t ?? new Date().toISOString(),
  };
}

/** Latest quotes keyed by symbol. Unknown symbols are left out. */
export async function getQuotes(symbols: string[]): Promise<Record<string, Quote>> {
  const unique = [...new Set(symbols)].sort();
  if (unique.length === 0) return {};

  return cached(`quotes:${unique.join(",")}`, 3_000, async () => {
    const raw = await dataApi<Record<string, RawSnapshot>>("/v2/stocks/snapshots", {
      symbols: unique.join(","),
    });
    const quotes: Record<string, Quote> = {};
    for (const symbol of unique) {
      const quote = raw[symbol] && toQuote(symbol, raw[symbol]);
      if (quote) quotes[symbol] = quote;
    }
    return quotes;
  });
}

/** Skips the shared cache. Used to price orders. */
export async function getFreshQuote(symbol: string) {
  const raw = await dataApi<Record<string, RawSnapshot>>("/v2/stocks/snapshots", { symbols: symbol });
  const quote = raw[symbol] && toQuote(symbol, raw[symbol]);
  if (!quote) throw new MarketDataError(`No price data for ${symbol}.`, 404);
  return quote;
}

export async function getQuote(symbol: string) {
  const quote = (await getQuotes([symbol]))[symbol];
  if (!quote) throw new MarketDataError(`No price data for ${symbol}.`, 404);
  return quote;
}

// Bars ---------------------------------------------------------------------

const DAY = 86_400_000;

const RANGE_CONFIG: Record<Range, { timeframe: string; lookbackMs: number; ttlMs: number }> = {
  "1D": { timeframe: "5Min", lookbackMs: 6 * DAY, ttlMs: 30_000 },
  "1W": { timeframe: "15Min", lookbackMs: 7 * DAY, ttlMs: 60_000 },
  "1M": { timeframe: "1Hour", lookbackMs: 31 * DAY, ttlMs: 5 * 60_000 },
  "3M": { timeframe: "1Day", lookbackMs: 92 * DAY, ttlMs: 30 * 60_000 },
  "1Y": { timeframe: "1Day", lookbackMs: 366 * DAY, ttlMs: 30 * 60_000 },
  "5Y": { timeframe: "1Week", lookbackMs: 5 * 366 * DAY, ttlMs: 60 * 60_000 },
};

async function fetchBars(symbol: string, timeframe: string, start: Date) {
  const bars: RawBar[] = [];
  let pageToken: string | undefined;
  for (let page = 0; page < 5; page++) {
    const res = await dataApi<{ bars: Record<string, RawBar[]>; next_page_token: string | null }>(
      "/v2/stocks/bars",
      {
        symbols: symbol,
        timeframe,
        start: start.toISOString(),
        adjustment: "split",
        limit: "10000",
        ...(pageToken ? { page_token: pageToken } : {}),
      },
    );
    bars.push(...(res.bars[symbol] ?? []));
    if (!res.next_page_token) break;
    pageToken = res.next_page_token;
  }
  return bars;
}

const toPoint = (bar: RawBar): PricePoint => ({
  time: Math.floor(new Date(bar.t).getTime() / 1000),
  price: bar.c,
});

export async function getBars(symbol: string, range: Range): Promise<Bars> {
  const config = RANGE_CONFIG[range];

  return cached(`bars:${symbol}:${range}`, config.ttlMs, async () => {
    const start = new Date(Date.now() - config.lookbackMs);

    if (range === "1D") {
      // Show the most recent session, measured from the close before it.
      const [intraday, daily] = await Promise.all([
        fetchBars(symbol, config.timeframe, start),
        fetchBars(symbol, "1Day", new Date(Date.now() - 14 * DAY)),
      ]);
      if (intraday.length === 0) throw new MarketDataError(`No recent trades for ${symbol}.`, 404);

      // Regular hours only: IEX also reports a few pre- and after-hours prints.
      const regular = intraday.filter((b) => {
        const m = nyMinutes(b.t);
        return m >= SESSION_OPEN && m < SESSION_CLOSE;
      });
      if (regular.length === 0) throw new MarketDataError(`No recent trades for ${symbol}.`, 404);
      const session = nyDate(regular[regular.length - 1].t);
      const points = regular.filter((b) => nyDate(b.t) === session).map(toPoint);
      const prior = daily.filter((b) => nyDate(b.t) < session).at(-1);
      return { symbol, range, points, baseline: prior?.c ?? points[0].price };
    }

    const bars = await fetchBars(symbol, config.timeframe, start);
    if (bars.length === 0) throw new MarketDataError(`No price history for ${symbol}.`, 404);
    const points = bars.map(toPoint);
    return { symbol, range, points, baseline: points[0].price };
  });
}

// Assets & search -------------------------------------------------------------

async function getAssetIndex() {
  return cached("assets", 12 * 60 * 60_000, async () => {
    const raw = await tradingApi<RawAsset[]>("/v2/assets", {
      status: "active",
      asset_class: "us_equity",
    });
    const index = new Map<string, Asset>();
    for (const a of raw) {
      if (!a.tradable || !LISTED_EXCHANGES.has(a.exchange)) continue;
      index.set(a.symbol, {
        symbol: a.symbol,
        name: cleanName(a.name),
        exchange: a.exchange,
        tradable: a.tradable,
        fractionable: a.fractionable,
      });
    }
    return index;
  });
}

export async function getAsset(symbol: string) {
  const asset = (await getAssetIndex()).get(symbol);
  if (!asset) throw new MarketDataError(`${symbol} isn't a listed US stock.`, 404);
  return asset;
}

/** Ranks exact ticker, then ticker prefix, then company-name matches. */
export async function searchAssets(query: string, limit = 8): Promise<Asset[]> {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const index = await getAssetIndex();

  const scored: Array<{ asset: Asset; score: number }> = [];
  for (const asset of index.values()) {
    const name = asset.name.toUpperCase();
    let score = 0;
    if (asset.symbol === q) score = 100;
    else if (asset.symbol.startsWith(q)) score = 80 - asset.symbol.length;
    else if (name.startsWith(q)) score = 50;
    else if (name.includes(` ${q}`)) score = 30;
    else if (q.length >= 3 && name.includes(q)) score = 10;
    if (score) scored.push({ asset, score: score + (POPULAR.has(asset.symbol) ? 15 : 0) });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.asset.symbol.localeCompare(b.asset.symbol))
    .slice(0, limit)
    .map((s) => s.asset);
}

// Clock ------------------------------------------------------------------------

export async function getClock(): Promise<MarketClock> {
  return cached("clock", 30_000, async () => {
    const raw = await tradingApi<RawClock>("/v2/clock");
    return { isOpen: raw.is_open, nextOpen: raw.next_open, nextClose: raw.next_close };
  });
}
