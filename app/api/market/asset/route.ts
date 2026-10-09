import { marketRoute } from "@/lib/market/route";
import { getAsset, normalizeSymbol } from "@/lib/market/service";

/** GET /api/market/asset?symbol=AAPL */
export const GET = marketRoute(async (params) => getAsset(normalizeSymbol(params.get("symbol"))));
