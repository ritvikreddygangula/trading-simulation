import { MarketDataError } from "@/lib/market/alpaca";
import { marketRoute } from "@/lib/market/route";
import { getQuotes, normalizeSymbol } from "@/lib/market/service";

/** GET /api/market/quotes?symbols=AAPL,MSFT */
export const GET = marketRoute(async (params) => {
  const symbols = (params.get("symbols") ?? "").split(",").filter(Boolean).map(normalizeSymbol);
  if (symbols.length > 50) throw new MarketDataError("Ask for 50 symbols or fewer.", 400);
  return getQuotes(symbols);
});
