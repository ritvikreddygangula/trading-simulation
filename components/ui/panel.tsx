import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** A quiet raised surface. Used sparingly: the order panel, dialogs, menus. */
export function Panel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl border border-line bg-surface", className)}
      {...props}
    />
  );
}
