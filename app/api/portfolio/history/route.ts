import { NextResponse, type NextRequest } from "next/server";
import { MarketDataError } from "@/lib/market/alpaca";
import { RANGES, type Range } from "@/lib/market/types";
import { loadPortfolioHistory } from "@/lib/portfolio/data";
import { createClient } from "@/lib/supabase/server";

/** GET /api/portfolio/history?range=1D */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sign in to see your portfolio." }, { status: 401 });

  const range = (request.nextUrl.searchParams.get("range") ?? "1D") as Range;
  if (!RANGES.includes(range)) {
    return NextResponse.json({ error: `Range must be one of ${RANGES.join(", ")}.` }, { status: 400 });
  }

  try {
    const history = await loadPortfolioHistory(userId, range);
    return NextResponse.json(history, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    if (err instanceof MarketDataError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[portfolio]", err);
    return NextResponse.json({ error: "Your portfolio history is unavailable right now." }, { status: 502 });
  }
}
