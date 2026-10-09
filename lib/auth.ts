import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

/**
 * The signed-in user's profile, or null when signed out. Cached for one request.
 *
 * Throws (instead of returning null) when a signed-in user has no profile row,
 * so the page shows an error rather than bouncing between / and /login.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  // Session checks compare token expiry with the clock, so they must run at
  // request time, never during prerendering or prefetching.
  await connection();

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(`Couldn't load your profile: ${error.message}`);
  if (!data) {
    throw new Error(
      "Your account has no profile yet. Run supabase/migrations/0001_init.sql, then the profile backfill in the README.",
    );
  }
  return { ...data, cash_balance: Number(data.cash_balance) } as Profile;
});

export async function requireProfile() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}
