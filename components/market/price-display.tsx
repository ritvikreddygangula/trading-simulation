"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { formatUsd } from "@/lib/format";

interface PriceDisplayProps {
  value: number;
  size?: "md" | "lg";
  className?: string;
}

/**
 * Large serif price. When the value changes, only the digits that changed
 * roll in, tinted by the direction of the move.
 */
export function PriceDisplay({ value, size = "md", className }: PriceDisplayProps) {
  const [previous, setPrevious] = useState(value);
  const [tick, setTick] = useState<{ dir: "up" | "down"; from: string } | null>(null);
  if (value !== previous) {
    setTick({ dir: value > previous ? "up" : "down", from: formatUsd(previous) });
    setPrevious(value);
  }

  const chars = formatUsd(value).split("");

  return (
    <p
      aria-live="polite"
      className={cn(
        "font-display tracking-tight",
        size === "lg" ? "text-price-lg" : "text-price",
        className,
      )}
    >
      <span className="sr-only">{formatUsd(value)}</span>
      <span aria-hidden className="inline-flex overflow-hidden">
        {chars.map((char, i) => {
          const changed = tick && tick.from[i] !== char && /\d/.test(char);
          return (
            <span
              // Remounting a changed digit replays its roll-in animation.
              key={changed ? `${i}-${char}-${value}` : `${i}-${char}`}
              className={cn(
                "inline-block",
                changed && (tick.dir === "up" ? "animate-tick-up" : "animate-tick-down"),
              )}
            >
              {char}
            </span>
          );
        })}
      </span>
    </p>
  );
}
