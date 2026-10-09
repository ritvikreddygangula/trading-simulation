import { revalidatePath } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executeTrade, parseTradeRequest, TradeError } from "@/lib/trading/execute";

/** POST /api/trade  { symbol, side: "buy"|"sell", mode: "dollars"|"shares", amount } */
export async function POST(request: NextRequest) {
  // JSON-only: browsers can't send this cross-site without a CORS preflight.
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Send the order as JSON." }, { status: 415 });
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sign in to trade." }, { status: 401 });

  try {
    const order = parseTradeRequest(await request.json().catch(() => null));
    const result = await executeTrade(userId, order);
    revalidatePath("/", "layout");
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof TradeError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("[trade]", err);
    return NextResponse.json({ error: "The order didn't go through. Try again." }, { status: 500 });
  }
}
