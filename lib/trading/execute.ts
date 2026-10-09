import "server-only";
import { MarketDataError } from "@/lib/market/alpaca";
import { getAsset, getFreshQuote, normalizeSymbol } from "@/lib/market/service";
import { createAdminClient } from "@/lib/supabase/admin";
import { planOrder, type OrderMode, type OrderSide } from "./order";

export class TradeError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export interface TradeRequest {
  symbol: string;
  side: OrderSide;
  mode: OrderMode;
  amount: number;
}

export interface TradeResult {
  orderId: number;
  symbol: string;
  side: OrderSide;
  quantity: number;
  price: number;
  notional: number;
  cashBalance: number;
  positionQuantity: number;
}

const DB_ERRORS: Record<string, string> = {
  INSUFFICIENT_FUNDS: "You don't have enough buying power for this order.",
  INSUFFICIENT_SHARES: "You don't have enough shares for this order.",
  ORDER_TOO_SMALL: "That amount is too small to trade any shares.",
  INVALID_QUANTITY: "Enter an amount greater than zero.",
  PROFILE_NOT_FOUND: "Your account has no profile yet.",
};

/** Validates the request body shape. Throws TradeError with a user-facing message. */
export function parseTradeRequest(body: unknown): TradeRequest {
  const b = (body ?? {}) as Record<string, unknown>;
  if (b.side !== "buy" && b.side !== "sell") throw new TradeError("Choose buy or sell.");
  if (b.mode !== "dollars" && b.mode !== "shares") throw new TradeError("Choose dollars or shares.");
  const amount = typeof b.amount === "number" ? b.amount : Number.NaN;
  if (typeof b.symbol !== "string") throw new TradeError("Choose a stock.");
  let symbol: string;
  try {
    symbol = normalizeSymbol(b.symbol);
  } catch {
    throw new TradeError(`"${b.symbol}" isn't a valid ticker.`);
  }
  return {
    symbol,
    side: b.side,
    mode: b.mode,
    // Dollar amounts are whole cents; shares keep up to 8 places.
    amount: b.mode === "dollars" ? Math.floor(amount * 100 + 1e-6) / 100 : amount,
  };
}

const inFlight = new Set<string>();

/**
 * Prices the order on the server, re-checks it, and settles it in one locked
 * database transaction. The browser never supplies the price.
 */
export async function executeTrade(userId: string, req: TradeRequest): Promise<TradeResult> {
  // One order at a time per user, so a double click can't race itself.
  if (inFlight.has(userId)) throw new TradeError("Your last order is still processing.", 409);
  inFlight.add(userId);

  try {
    const asset = await getAsset(req.symbol);
    if (!asset.tradable) throw new TradeError(`${req.symbol} can't be traded right now.`);

    const db = createAdminClient();
    const [quote, profileRes, positionRes] = await Promise.all([
      getFreshQuote(req.symbol),
      db.from("profiles").select("cash_balance").eq("id", userId).single(),
      db.from("positions").select("quantity").eq("user_id", userId).eq("symbol", req.symbol).maybeSingle(),
    ]);
    if (profileRes.error) throw new TradeError("Couldn't load your account.", 500);

    const plan = planOrder(req, {
      symbol: req.symbol,
      price: quote.price,
      cash: Number(profileRes.data.cash_balance),
      held: Number(positionRes.data?.quantity ?? 0),
      fractionable: asset.fractionable,
    });
    if (!plan.ok) throw new TradeError(plan.error);

    const { data, error } = await db.rpc("execute_trade", {
      p_user_id: userId,
      p_symbol: req.symbol,
      p_side: req.side,
      p_quantity: plan.quantity,
      p_price: quote.price,
    });

    if (error) {
      const known = Object.keys(DB_ERRORS).find((code) => error.message.includes(code));
      if (known) throw new TradeError(DB_ERRORS[known]);
      if (error.message.includes("execute_trade")) {
        throw new TradeError("Trading isn't set up yet. Run supabase/migrations/0002_execute_trade.sql.", 500);
      }
      throw new TradeError(`The order didn't go through: ${error.message}`, 500);
    }

    return {
      orderId: data.order_id,
      symbol: req.symbol,
      side: req.side,
      quantity: Number(data.quantity),
      price: Number(data.price),
      notional: Number(data.notional),
      cashBalance: Number(data.cash_balance),
      positionQuantity: Number(data.position_quantity),
    };
  } catch (err) {
    if (err instanceof MarketDataError) throw new TradeError(err.message, err.status);
    throw err;
  } finally {
    inFlight.delete(userId);
  }
}
