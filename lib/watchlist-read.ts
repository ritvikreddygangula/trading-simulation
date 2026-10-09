import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function isWatched(symbol: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("watchlist").select("symbol").eq("symbol", symbol).maybeSingle();
  return Boolean(data);
}
