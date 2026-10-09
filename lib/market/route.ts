import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MarketDataError } from "./alpaca";

/**
 * Wraps a market-data route: signed-in users only, JSON out, and errors
 * mapped to a status plus a message the UI can show as-is.
 */
export function marketRoute<T>(handler: (params: URLSearchParams) => Promise<T>) {
  return async function GET(request: NextRequest) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (!data?.claims) {
      return NextResponse.json({ error: "Sign in to see market data." }, { status: 401 });
    }

    try {
      const body = await handler(request.nextUrl.searchParams);
      return NextResponse.json(body, { headers: { "Cache-Control": "private, no-store" } });
    } catch (err) {
      if (err instanceof MarketDataError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      console.error("[market]", err);
      return NextResponse.json({ error: "Market data is unavailable right now." }, { status: 502 });
    }
  };
}
