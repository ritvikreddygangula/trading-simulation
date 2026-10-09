"use server";

import { revalidatePath } from "next/cache";
import { normalizeSymbol } from "@/lib/market/service";
import { createClient } from "@/lib/supabase/server";

async function userClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Sign in to use your watchlist.");
  return { supabase, userId };
}

export async function setWatched(rawSymbol: string, watched: boolean) {
  const symbol = normalizeSymbol(rawSymbol);
  const { supabase, userId } = await userClient();

  const { error } = watched
    ? await supabase.from("watchlist").upsert({ user_id: userId, symbol }, { ignoreDuplicates: true })
    : await supabase.from("watchlist").delete().eq("user_id", userId).eq("symbol", symbol);

  if (error) throw new Error(`Couldn't update your watchlist: ${error.message}`);
  revalidatePath("/");
}
