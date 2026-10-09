import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface Position {
  symbol: string;
  quantity: number;
  avgCost: number;
}

/** The signed-in user's holding in one stock (RLS limits reads to their own rows). */
export async function getPosition(symbol: string): Promise<Position | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("positions")
    .select("symbol, quantity, avg_cost")
    .eq("symbol", symbol)
    .maybeSingle();
  if (!data) return null;
  return { symbol: data.symbol, quantity: Number(data.quantity), avgCost: Number(data.avg_cost) };
}
