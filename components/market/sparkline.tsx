"use client";

import { useBars } from "@/lib/market/hooks";
import type { Direction } from "@/lib/format";

/** Tiny 1D line for list rows. */
export function Sparkline({ symbol, direction }: { symbol: string; direction: Direction }) {
  const { data } = useBars(symbol, "1D");
  const points = data?.points ?? [];
  const width = 64;
  const height = 24;

  if (points.length < 2) return <svg width={width} height={height} aria-hidden />;

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices, data!.baseline);
  const max = Math.max(...prices, data!.baseline);
  const span = max - min || 1;
  // The day spans 78 five-minute bars; a partial day only fills part of the width.
  const step = width / Math.max(77, points.length - 1);
  const y = (v: number) => height - 2 - ((v - min) / span) * (height - 4);
  const d = prices.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${y(v).toFixed(1)}`).join("");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <line x1="0" x2={width} y1={y(data!.baseline)} y2={y(data!.baseline)} stroke="var(--line)" strokeDasharray="2 3" />
      <path d={d} fill="none" stroke={direction === "down" ? "var(--loss)" : "var(--gain)"} strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
