import { marketRoute } from "@/lib/market/route";
import { searchAssets } from "@/lib/market/service";

/** GET /api/market/search?q=apple */
export const GET = marketRoute(async (params) => searchAssets((params.get("q") ?? "").slice(0, 40)));
