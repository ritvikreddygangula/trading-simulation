import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-11 rounded-lg border border-line bg-surface px-3 text-text placeholder:text-faint",
          "transition-colors focus:border-brass focus:outline-none",
          error && "border-loss",
          className,
        )}
        {...props}
      />
      {error && <p className="text-sm text-loss">{error}</p>}
    </div>
  );
}
