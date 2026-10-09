import "server-only";

const DATA_URL = "https://data.alpaca.markets";
const TRADING_URL = "https://paper-api.alpaca.markets";

// Free plan allows 200 requests/minute. Stay under it with headroom.
const LIMIT_PER_MINUTE = 180;
const recent: number[] = [];

export class MarketDataError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function takeToken() {
  const now = Date.now();
  while (recent.length && now - recent[0] > 60_000) recent.shift();
  if (recent.length >= LIMIT_PER_MINUTE) {
    throw new MarketDataError("Market data is busy. Try again in a few seconds.", 429);
  }
  recent.push(now);
}

async function request<T>(base: string, path: string, params: Record<string, string> = {}) {
  const keyId = process.env.ALPACA_KEY_ID;
  const secret = process.env.ALPACA_SECRET_KEY;
  if (!keyId || !secret) {
    throw new MarketDataError("Alpaca keys are missing. Add them to .env.", 500);
  }

  takeToken();
  const url = new URL(path, base);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, {
    headers: { "APCA-API-KEY-ID": keyId, "APCA-API-SECRET-KEY": secret },
    cache: "no-store",
  });

  if (!res.ok) {
    const status = res.status === 429 ? 429 : 502;
    throw new MarketDataError(`Alpaca returned ${res.status} for ${url.pathname}`, status);
  }
  return (await res.json()) as T;
}

export function dataApi<T>(path: string, params?: Record<string, string>) {
  return request<T>(DATA_URL, path, { feed: "iex", ...params });
}

export function tradingApi<T>(path: string, params?: Record<string, string>) {
  return request<T>(TRADING_URL, path, params);
}

// Raw Alpaca shapes (only the fields we use).

export interface RawBar {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface RawSnapshot {
  latestTrade?: { p: number; t: string };
  dailyBar?: RawBar;
  prevDailyBar?: RawBar;
  minuteBar?: RawBar;
}

export interface RawAsset {
  symbol: string;
  name: string;
  exchange: string;
  status: string;
  tradable: boolean;
  fractionable: boolean;
}

export interface RawClock {
  is_open: boolean;
  next_open: string;
  next_close: string;
  timestamp: string;
}
