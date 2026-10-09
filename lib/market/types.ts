export interface Quote {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  /** Ratio, e.g. 0.0123 for +1.23%. */
  changePct: number;
  open: number | null;
  high: number | null;
  low: number | null;
  volume: number | null;
  /** ISO time of the last trade. */
  updatedAt: string;
}

export const RANGES = ["1D", "1W", "1M", "3M", "1Y", "5Y"] as const;
export type Range = (typeof RANGES)[number];

export interface PricePoint {
  /** Unix seconds. */
  time: number;
  price: number;
}

export interface Bars {
  symbol: string;
  range: Range;
  points: PricePoint[];
  /** Price the range's change is measured from (previous close for 1D). */
  baseline: number;
}

export interface Asset {
  symbol: string;
  name: string;
  exchange: string;
  tradable: boolean;
  fractionable: boolean;
}

export interface MarketClock {
  isOpen: boolean;
  nextOpen: string;
  nextClose: string;
}
