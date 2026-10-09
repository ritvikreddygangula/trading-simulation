import "server-only";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { getQuotes } from "@/lib/market/service";
import { createClient } from "@/lib/supabase/server";

/** Non-admins get a plain 404, so the page doesn't reveal it exists. */
export async function requireAdmin() {
  const profile = await requireProfile();
  if (profile.role !== "admin") notFound();
  return profile;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  cash: number;
  holdingsValue: number;
  positions: number;
  joined: string;
}

export interface FundingEntry {
  id: number;
  userName: string;
  adminName: string;
  amount: number;
  note: string | null;
  time: string;
}

async function quotesFor(symbols: string[]) {
  const prices: Record<string, number> = {};
  for (let i = 0; i < symbols.length; i += 50) {
    const quotes = await getQuotes(symbols.slice(i, i + 50)).catch(() => ({}));
    for (const [symbol, q] of Object.entries(quotes)) prices[symbol] = q.price;
  }
  return prices;
}

/** Every user with cash and live holdings value. Relies on the admin RLS policies. */
export async function loadAdminOverview() {
  await requireAdmin();
  const supabase = await createClient();

  const [profiles, positions, funding] = await Promise.all([
    supabase.from("profiles").select("id, email, display_name, role, cash_balance, created_at").order("created_at"),
    supabase.from("positions").select("user_id, symbol, quantity"),
    supabase
      .from("funding_events")
      .select("id, user_id, admin_id, amount, note, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  if (profiles.error) throw new Error(`Couldn't load users: ${profiles.error.message}`);

  const rows = positions.data ?? [];
  const prices = await quotesFor([...new Set(rows.map((p) => p.symbol as string))]);

  const value = new Map<string, number>();
  const count = new Map<string, number>();
  for (const p of rows) {
    value.set(p.user_id, (value.get(p.user_id) ?? 0) + Number(p.quantity) * (prices[p.symbol] ?? 0));
    count.set(p.user_id, (count.get(p.user_id) ?? 0) + 1);
  }

  const users: AdminUser[] = profiles.data.map((p) => ({
    id: p.id,
    email: p.email,
    name: p.display_name || p.email,
    role: p.role,
    cash: Number(p.cash_balance),
    holdingsValue: value.get(p.id) ?? 0,
    positions: count.get(p.id) ?? 0,
    joined: p.created_at,
  }));

  const nameOf = new Map(users.map((u) => [u.id, u.name]));
  const ledger: FundingEntry[] = (funding.data ?? []).map((f) => ({
    id: f.id,
    userName: nameOf.get(f.user_id) ?? "Deleted user",
    adminName: f.admin_id ? (nameOf.get(f.admin_id) ?? "Deleted admin") : "Unknown",
    amount: Number(f.amount),
    note: f.note,
    time: f.created_at,
  }));

  return { users, ledger };
}
