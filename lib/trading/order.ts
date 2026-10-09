import { formatShares, formatUsd } from "@/lib/format";

export type OrderSide = "buy" | "sell";
export type OrderMode = "dollars" | "shares";

export interface OrderInput {
  side: OrderSide;
  mode: OrderMode;
  /** Dollars or shares, depending on mode. */
  amount: number;
}

export interface OrderContext {
  symbol: string;
  price: number;
  cash: number;
  held: number;
  fractionable: boolean;
}

export type OrderPlan =
  | { ok: true; quantity: number; notional: number }
  | { ok: false; error: string };

const SCALE = 1e8; // positions store 8 decimal places
const MIN_DOLLAR_ORDER = 1;

/** Rounds down to 8 places, tolerating float noise like 0.29999999999. */
function floorQty(value: number) {
  return Math.floor(Math.round(value * SCALE * 1e4) / 1e4) / SCALE;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

/**
 * Turns "buy $50 of AAPL" or "sell 2 shares" into an exact quantity and
 * notional, or a message saying why the order can't go through.
 * The browser uses this for estimates; the server reruns it as the source of truth.
 */
export function planOrder({ side, mode, amount }: OrderInput, ctx: OrderContext): OrderPlan {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter an amount greater than zero." };
  }
  if (!Number.isFinite(ctx.price) || ctx.price <= 0) {
    return { ok: false, error: `There's no current price for ${ctx.symbol}.` };
  }

  let quantity: number;
  if (mode === "dollars") {
    if (!ctx.fractionable) {
      return { ok: false, error: `${ctx.symbol} trades in whole shares only. Switch to shares.` };
    }
    if (amount < MIN_DOLLAR_ORDER) {
      return { ok: false, error: "Dollar orders need to be at least $1.00." };
    }
    quantity = floorQty(amount / ctx.price);
  } else {
    if (!ctx.fractionable && !Number.isInteger(amount)) {
      return { ok: false, error: `${ctx.symbol} trades in whole shares only.` };
    }
    quantity = floorQty(amount);
  }

  if (side === "sell") {
    if (ctx.held <= 0) return { ok: false, error: `You don't own any ${ctx.symbol}.` };
    // A dollar sell for (nearly) the whole position sells all of it, so no dust is left.
    if (quantity > ctx.held && quantity - ctx.held < 1e-6) quantity = ctx.held;
    if (mode === "dollars" && round2(ctx.held * ctx.price) <= amount) quantity = ctx.held;
    if (quantity > ctx.held) {
      return { ok: false, error: `You only have ${formatShares(ctx.held)} shares to sell.` };
    }
  }

  if (quantity <= 0) {
    return { ok: false, error: "That amount is too small to trade any shares." };
  }

  const notional = round2(quantity * ctx.price);
  if (notional < 0.01) {
    return { ok: false, error: "That amount is too small to trade any shares." };
  }
  if (side === "buy" && notional > ctx.cash) {
    return { ok: false, error: `That's more than your buying power of ${formatUsd(ctx.cash)}.` };
  }

  return { ok: true, quantity, notional };
}
