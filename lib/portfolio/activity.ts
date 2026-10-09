import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Activity =
  | {
      kind: "order";
      id: string;
      time: string;
      side: "buy" | "sell";
      symbol: string;
      quantity: number;
      price: number;
      notional: number;
    }
  | { kind: "deposit"; id: string; time: string; amount: number; note: string | null };

/** Orders and admin deposits for one user, newest first. */
export async function loadActivity(userId: string, limit = 200): Promise<Activity[]> {
  const supabase = await createClient();
  const [orders, deposits] = await Promise.all([
    supabase
      .from("orders")
      .select("id, side, symbol, quantity, price, notional, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("funding_events")
      .select("id, amount, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: Activity[] = [
    ...(orders.data ?? []).map((o) => ({
      kind: "order" as const,
      id: `o${o.id}`,
      time: o.created_at as string,
      side: o.side as "buy" | "sell",
      symbol: o.symbol as string,
      quantity: Number(o.quantity),
      price: Number(o.price),
      notional: Number(o.notional),
    })),
    ...(deposits.data ?? []).map((d) => ({
      kind: "deposit" as const,
      id: `d${d.id}`,
      time: d.created_at as string,
      amount: Number(d.amount),
      note: d.note as string | null,
    })),
  ];
  return items.sort((a, b) => b.time.localeCompare(a.time)).slice(0, limit);
}
