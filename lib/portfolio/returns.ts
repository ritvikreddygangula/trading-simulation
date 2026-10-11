export interface Deposit {
  time: number;
  amount: number;
}

/**
 * Gain or loss over a chart range. Deposits raise the portfolio's value but
 * aren't returns, so money added up to `at` is taken out of the change and
 * counted as part of what was invested.
 */
export function rangeReturn({
  value,
  baseline,
  deposits,
  at = Number.POSITIVE_INFINITY,
}: {
  value: number;
  baseline: number;
  deposits: Deposit[];
  at?: number;
}) {
  const deposited = deposits.reduce((sum, d) => (d.time <= at ? sum + d.amount : sum), 0);
  const invested = baseline + deposited;
  const change = Math.round((value - invested) * 100) / 100;
  return { change, pct: invested > 0 ? change / invested : 0 };
}
