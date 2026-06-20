import * as React from "react";
import { cn } from "@/app/components/lib/utils";

type ButtonVariant = "primary" | "secondary" | "dark" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand)] text-[var(--surface-dark)] hover:bg-[var(--brand-hover)] border border-transparent",
  secondary:
    "bg-white text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--surface-soft)]",
  dark: "bg-[var(--surface-dark)] text-[var(--text-on-dark)] border border-transparent hover:opacity-90",
  ghost:
    "bg-transparent text-[var(--text-primary)] border border-transparent hover:bg-[var(--surface-soft)]",
  danger:
    "bg-[var(--error)] text-white border border-transparent hover:opacity-90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm rounded-xl",
  md: "h-11 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-base rounded-2xl",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40",
        "disabled:pointer-events-none disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  );
}
