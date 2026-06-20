import * as React from "react";
import { cn } from "@/app/components/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="w-full space-y-2">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}

        <input
          id={inputId}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-xl border bg-white px-4 text-sm text-[var(--text-primary)] outline-none transition-all",
            "placeholder:text-[var(--text-muted)]",
            "border-[var(--border)]",
            "focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10",
            error && "border-[var(--error)] focus:border-[var(--error)] focus:ring-[var(--error)]/10",
            "disabled:cursor-not-allowed disabled:opacity-60",
            className
          )}
          {...props}
        />

        {error ? (
          <p className="text-sm text-[var(--error)]">{error}</p>
        ) : hint ? (
          <p className="text-sm text-[var(--text-muted)]">{hint}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
