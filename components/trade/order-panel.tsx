"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { formatShares, formatUsd } from "@/lib/format";
import { useQuote } from "@/lib/market/hooks";
import { planOrder, type OrderMode, type OrderSide } from "@/lib/trading/order";

interface OrderPanelProps {
  symbol: string;
  fractionable: boolean;
  cash: number;
  held: number;
}

interface Fill {
  side: OrderSide;
  quantity: number;
  price: number;
  notional: number;
}

type Step = "edit" | "review" | "done";

/** Keeps the input to a plain decimal with at most `places` decimals. */
function sanitize(value: string, places: number) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length === 0 || places === 0) return whole;
  return `${whole}.${rest.join("").slice(0, places)}`;
}

export function OrderPanel({ symbol, fractionable, cash, held }: OrderPanelProps) {
  const router = useRouter();
  const inputId = useId();
  const { data: quote } = useQuote(symbol);

  const [side, setSide] = useState<OrderSide>("buy");
  const [mode, setMode] = useState<OrderMode>(fractionable ? "dollars" : "shares");
  const [text, setText] = useState("");
  const [step, setStep] = useState<Step>("edit");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fill, setFill] = useState<Fill | null>(null);

  const amount = Number(text);
  const price = quote?.price ?? 0;
  const plan = text ? planOrder({ side, mode, amount }, { symbol, price, cash, held, fractionable }) : null;
  const verb = side === "buy" ? "Buy" : "Sell";

  function reset(nextSide = side) {
    setSide(nextSide);
    setText("");
    setError(null);
    setStep("edit");
  }

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, side, mode, amount }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "The order didn't go through. Try again.");
        setStep("edit");
        return;
      }
      setFill({ side, quantity: body.quantity, price: body.price, notional: body.notional });
      setStep("done");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setStep("edit");
    } finally {
      setPending(false);
    }
  }

  if (step === "done" && fill) {
    return (
      <div role="status" className="p-5">
        <div className="flex size-10 items-center justify-center rounded-full bg-gain/15 text-gain">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path d="M4 9.5 L7.5 13 L14 5.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-4 font-display text-2xl">
          {fill.side === "buy" ? "Bought" : "Sold"} {formatShares(fill.quantity)}{" "}
          {fill.quantity === 1 ? "share" : "shares"} of {symbol}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {formatUsd(fill.notional)} at {formatUsd(fill.price)} per share.
        </p>
        <Button className="mt-6 w-full" onClick={() => reset()}>
          Done
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div role="tablist" aria-label="Order side" className="flex border-b border-line">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={side === s}
            disabled={s === "sell" && held <= 0}
            onClick={() => reset(s)}
            className={cn(
              "flex-1 py-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:text-faint",
              side === s ? "border-b-2 border-brass text-text" : "text-muted hover:text-text",
            )}
          >
            {s === "buy" ? "Buy" : "Sell"} {symbol}
          </button>
        ))}
      </div>

      {step === "review" && plan?.ok ? (
        <div className="p-5">
          <h2 className="text-lg font-medium">Review your order</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Order">
              {verb} {mode === "dollars" ? `${formatUsd(amount)} of ${symbol}` : `${formatShares(amount)} ${symbol}`}
            </Row>
            <Row label="Estimated shares">{formatShares(plan.quantity)}</Row>
            <Row label="Market price">{formatUsd(price)}</Row>
            <Row label={side === "buy" ? "Estimated cost" : "Estimated credit"}>{formatUsd(plan.notional)}</Row>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            Market orders fill at the latest price when you submit, so the final amount can differ
            slightly from this estimate.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Button size="lg" onClick={submit} disabled={pending}>
              {pending ? "Submitting…" : `Submit ${side} order`}
            </Button>
            <Button variant="ghost" onClick={() => setStep("edit")} disabled={pending}>
              Edit order
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (plan?.ok) setStep("review");
          }}
        >
          <dl className="space-y-4 text-sm">
            <Row label="Order type">Market order</Row>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">{verb} in</dt>
              <dd>
                <div role="radiogroup" aria-label={`${verb} in`} className="flex rounded-full border border-line p-0.5">
                  {(["dollars", "shares"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="radio"
                      aria-checked={mode === m}
                      disabled={m === "dollars" && !fractionable}
                      onClick={() => {
                        setMode(m);
                        setText("");
                        setError(null);
                      }}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors disabled:cursor-not-allowed disabled:text-faint",
                        mode === m ? "bg-surface-raised text-text" : "text-muted hover:text-text",
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-center justify-between gap-4 border-y border-line py-4">
            <label htmlFor={inputId} className="text-sm">
              {mode === "dollars" ? "Amount" : "Shares"}
            </label>
            <div className="flex items-baseline font-display text-2xl">
              {mode === "dollars" && <span className={text ? "text-text" : "text-faint"}>$</span>}
              <input
                id={inputId}
                inputMode="decimal"
                autoComplete="off"
                placeholder={mode === "dollars" ? "0.00" : "0"}
                value={text}
                onChange={(e) => {
                  setText(sanitize(e.target.value, mode === "dollars" ? 2 : fractionable ? 8 : 0));
                  setError(null);
                }}
                className="w-36 bg-transparent text-right tabular-nums placeholder:text-faint focus:outline-none"
              />
            </div>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Market price">{quote ? formatUsd(price) : "—"}</Row>
            <Row label={mode === "dollars" ? "Estimated shares" : side === "buy" ? "Estimated cost" : "Estimated credit"}>
              {plan?.ok ? (mode === "dollars" ? formatShares(plan.quantity) : formatUsd(plan.notional)) : "—"}
            </Row>
          </dl>

          {(error || (plan && !plan.ok)) && (
            <p role="alert" className="mt-4 text-sm text-loss">
              {error ?? (plan && !plan.ok ? plan.error : null)}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={!plan?.ok || !quote}>
            Review order
          </Button>

          <p className="mt-4 text-center text-xs text-muted">
            {side === "buy" ? (
              cash > 0 ? (
                `${formatUsd(cash)} buying power available`
              ) : (
                "You have no buying power yet. An admin adds funds to your account."
              )
            ) : (
              <>
                {formatShares(held)} {held === 1 ? "share" : "shares"} available.{" "}
                <button
                  type="button"
                  className="text-brass hover:text-brass-hover"
                  onClick={() => {
                    setMode("shares");
                    setText(held.toFixed(8).replace(/\.?0+$/, ""));
                    setError(null);
                  }}
                >
                  Sell all
                </button>
              </>
            )}
          </p>
        </form>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right tabular-nums">{children}</dd>
    </div>
  );
}
