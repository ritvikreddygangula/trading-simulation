import { MarketDataError } from "@/lib/market/alpaca";
import { marketRoute } from "@/lib/market/route";
import { getBars, normalizeSymbol } from "@/lib/market/service";
import { RANGES, type Range } from "@/lib/market/types";

/** GET /api/market/bars?symbol=AAPL&range=1D */
export const GET = marketRoute(async (params) => {
  const symbol = normalizeSymbol(params.get("symbol"));
  const range = (params.get("range") ?? "1D") as Range;
  if (!RANGES.includes(range)) throw new MarketDataError(`Range must be one of ${RANGES.join(", ")}.`, 400);
  return getBars(symbol, range);
});
