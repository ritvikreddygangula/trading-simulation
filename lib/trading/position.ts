import "server-only";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export interface Position {
  symbol: string;
  quantity: number;
  avgCost: number;
}

/**
 * The signed-in user's holding in one stock. Filters by user explicitly:
 * RLS lets admins read every user's rows.
 */
export async function getPosition(symbol: string): Promise<Position | null> {
  const [supabase, profile] = await Promise.all([createClient(), requireProfile()]);
  const { data } = await supabase
    .from("positions")
    .select("symbol, quantity, avg_cost")
    .eq("user_id", profile.id)
    .eq("symbol", symbol)
    .maybeSingle();
  if (!data) return null;
  return { symbol: data.symbol, quantity: Number(data.quantity), avgCost: Number(data.avg_cost) };
}
