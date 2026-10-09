"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import type { Asset, Bars, MarketClock, Quote, Range } from "./types";

export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new FetchError(body.error ?? "Market data is unavailable right now.", res.status);
  return body as T;
}

const LIVE_MS = 4_000;
const CLOSED_MS = 30_000;

export function useMarketClock() {
  return useSWR<MarketClock>("/api/market/clock", fetcher, { refreshInterval: 60_000 });
}

/** Polls fast while the market is open, slowly when it's closed. Pauses in hidden tabs. */
function useLiveInterval() {
  const { data: clock } = useMarketClock();
  return clock?.isOpen ? LIVE_MS : CLOSED_MS;
}

export function useQuotes(symbols: string[]) {
  const interval = useLiveInterval();
  const key = symbols.length ? `/api/market/quotes?symbols=${[...symbols].sort().join(",")}` : null;
  return useSWR<Record<string, Quote>>(key, fetcher, {
    refreshInterval: interval,
    keepPreviousData: true,
  });
}

export function useQuote(symbol: string) {
  const { data, ...rest } = useQuotes([symbol]);
  return { data: data?.[symbol], ...rest };
}

export function useBars(symbol: string, range: Range) {
  const interval = useLiveInterval();
  return useSWR<Bars>(`/api/market/bars?symbol=${symbol}&range=${range}`, fetcher, {
    // Only the intraday chart moves fast enough to be worth re-polling.
    refreshInterval: range === "1D" ? interval * 5 : 0,
    keepPreviousData: true,
  });
}

export function useAsset(symbol: string) {
  return useSWR<Asset>(`/api/market/asset?symbol=${symbol}`, fetcher, {
    revalidateOnFocus: false,
  });
}

export function useTickerSearch(query: string, delayMs = 150) {
  const [debounced, setDebounced] = useState(query);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), delayMs);
    return () => clearTimeout(id);
  }, [query, delayMs]);

  return useSWR<Asset[]>(
    debounced ? `/api/market/search?q=${encodeURIComponent(debounced)}` : null,
    fetcher,
    { keepPreviousData: true, revalidateOnFocus: false },
  );
}

export function usePortfolioHistory(range: Range) {
  const interval = useLiveInterval();
  return useSWR<Bars>(`/api/portfolio/history?range=${range}`, fetcher, {
    refreshInterval: range === "1D" ? interval * 5 : 0,
    keepPreviousData: true,
  });
}
