import { marketRoute } from "@/lib/market/route";
import { getClock } from "@/lib/market/service";

/** GET /api/market/clock */
export const GET = marketRoute(() => getClock());
