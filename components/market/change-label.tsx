import { cn } from "@/lib/cn";
import { direction, formatSignedPct, formatSignedUsd } from "@/lib/format";

interface ChangeLabelProps {
  change: number;
  changePct: number;
  period?: string;
  className?: string;
}

/** "+$2.41 (+1.32%) Today" colored by direction. */
export function ChangeLabel({ change, changePct, period, className }: ChangeLabelProps) {
  const dir = direction(change);
  return (
    <p className={cn("text-sm font-medium", className)}>
      <span
        className={cn(
          dir === "up" && "text-gain",
          dir === "down" && "text-loss",
          dir === "flat" && "text-muted",
        )}
      >
        {formatSignedUsd(change)} ({formatSignedPct(changePct)})
      </span>
      {period && <span className="ml-1.5 text-muted">{period}</span>}
    </p>
  );
}
