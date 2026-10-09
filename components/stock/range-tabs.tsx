"use client";

import { cn } from "@/lib/cn";
import type { Direction } from "@/lib/format";
import { RANGES, type Range } from "@/lib/market/types";

interface RangeTabsProps {
  value: Range;
  onChange: (range: Range) => void;
  direction: Direction;
}

export function RangeTabs({ value, onChange, direction }: RangeTabsProps) {
  return (
    <div role="tablist" aria-label="Chart range" className="flex gap-1 border-b border-line pb-3">
      {RANGES.map((range) => {
        const selected = range === value;
        return (
          <button
            key={range}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(range)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              selected
                ? direction === "down"
                  ? "bg-loss/15 text-loss"
                  : "bg-gain/15 text-gain"
                : "text-muted hover:text-text",
            )}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}
