const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const pct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const shares = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
});

export function formatUsd(value: number) {
  return usd.format(value);
}

/** "+$1.24" / "-$1.24" */
export function formatSignedUsd(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${usd.format(Math.abs(value))}`;
}

/** Takes a ratio (0.0123 → "+1.23%"). */
export function formatSignedPct(ratio: number) {
  const sign = ratio > 0 ? "+" : ratio < 0 ? "-" : "";
  return `${sign}${pct.format(Math.abs(ratio))}`;
}

export function formatShares(value: number) {
  return shares.format(value);
}

export type Direction = "up" | "down" | "flat";

export function direction(change: number): Direction {
  if (change > 0) return "up";
  if (change < 0) return "down";
  return "flat";
}

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });

/** 2132399 → "2.13M" */
export function formatCompact(value: number) {
  return compact.format(value);
}

const NY = "America/New_York";
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: NY, hour: "numeric", minute: "2-digit" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: NY,
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: NY,
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Label for a hovered chart point, at the precision its range needs. */
export function formatChartTime(unixSeconds: number, range: string) {
  const d = new Date(unixSeconds * 1000);
  if (range === "1D") return `${timeFmt.format(d)} ET`;
  if (range === "1W" || range === "1M") return `${dateTimeFmt.format(d)} ET`;
  return dateFmt.format(d);
}
