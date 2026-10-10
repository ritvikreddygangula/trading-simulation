import type { Range } from "./types";

/** SWR cache keys, shared by client hooks and server pages that pre-fill the cache. */
export const quotesKey = (symbols: string[]) => `/api/market/quotes?symbols=${[...symbols].sort().join(",")}`;
export const barsKey = (symbol: string, range: Range) => `/api/market/bars?symbol=${symbol}&range=${range}`;
