"use server";

import { revalidatePath } from "next/cache";
import { formatUsd } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "./data";

export interface AddFundsState {
  ok?: boolean;
  error?: string;
  message?: string;
}

const DB_ERRORS: Record<string, string> = {
  NOT_ADMIN: "Only admins can add funds.",
  INVALID_AMOUNT: "Enter an amount greater than zero.",
  AMOUNT_TOO_LARGE: "Add $1,000,000 or less at a time.",
  USER_NOT_FOUND: "That user no longer exists.",
};

export async function addFunds(_: AddFundsState, formData: FormData): Promise<AddFundsState> {
  // The SQL function checks the role too; this keeps non-admins from reaching it at all.
  await requireAdmin();

  const userId = String(formData.get("userId") ?? "");
  const amount = Math.round(Number(formData.get("amount")) * 100) / 100;
  const note = String(formData.get("note") ?? "").trim().slice(0, 140);

  if (!userId) return { error: "Choose a user." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount greater than zero." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_add_funds", {
    p_user_id: userId,
    p_amount: amount,
    p_note: note || null,
  });

  if (error) {
    const known = Object.keys(DB_ERRORS).find((code) => error.message.includes(code));
    if (known) return { error: DB_ERRORS[known] };
    if (error.message.includes("admin_add_funds")) {
      return { error: "Funding isn't set up yet. Run supabase/migrations/0003_admin_add_funds.sql." };
    }
    return { error: `Funds weren't added: ${error.message}` };
  }

  revalidatePath("/admin");
  revalidatePath("/", "layout");
  return { ok: true, message: `Added ${formatUsd(amount)}. New balance ${formatUsd(Number(data.cash_balance))}.` };
}
