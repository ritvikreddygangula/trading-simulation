"use client";

import { useActionState, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addFunds, type AddFundsState } from "@/lib/admin/actions";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/format";

const PRESETS = [1_000, 5_000, 10_000, 25_000];

export function AddFundsDialog({ userId, userName, cash }: { userId: string; userName: string; cash: number }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [amount, setAmount] = useState("");
  const [state, action, pending] = useActionState<AddFundsState, FormData>(addFunds, {});

  // Clear the amount after each successful deposit so the next one starts fresh.
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setAmount("");
  }

  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => dialog.current?.showModal()}>
        Add funds
      </Button>
      <dialog
        ref={dialog}
        aria-labelledby={`${userId}-title`}
        className="m-auto w-[min(92vw,420px)] rounded-2xl border border-line bg-surface p-0 text-text shadow-2xl shadow-black/50 backdrop:bg-ink/70 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <form action={action} className="p-6">
          <input type="hidden" name="userId" value={userId} />
          <h2 id={`${userId}-title`} className="font-display text-2xl">
            Add funds for {userName}
          </h2>
          <p className="mt-1 text-sm text-muted">Current buying power {formatUsd(cash)}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(String(preset))}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm tabular-nums transition-colors",
                  Number(amount) === preset
                    ? "border-brass text-brass"
                    : "border-line text-muted hover:text-text",
                )}
              >
                {formatUsd(preset).replace(".00", "")}
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <Input
              label="Amount in dollars"
              name="amount"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              required
            />
            <Input label="Note (optional)" name="note" maxLength={140} placeholder="Starting balance" />
          </div>

          {state.error && (
            <p role="alert" className="mt-4 text-sm text-loss">
              {state.error}
            </p>
          )}
          {state.message && (
            <p role="status" className="mt-4 text-sm text-gain">
              {state.message}
            </p>
          )}

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => dialog.current?.close()}>
              Close
            </Button>
            <Button type="submit" disabled={pending || !(Number(amount) > 0)}>
              {pending ? "Adding…" : amount && Number(amount) > 0 ? `Add ${formatUsd(Number(amount))}` : "Add funds"}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
