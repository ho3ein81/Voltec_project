import * as React from "react";
import { cn } from "@/app/components/lib/utils";

type BadgeVariant =
  | "default"
  | "brand"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "dark";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

const badgeVariants: Record<BadgeVariant, string> = {
  default:
    "bg-[var(--surface-soft)] text-[var(--text-secondary)] border border-[var(--border)]",
  brand:
    "bg-[var(--brand-soft)] text-[var(--text-primary)] border border-transparent",
  success:
    "bg-green-50 text-[var(--success)] border border-green-200",
  warning:
    "bg-amber-50 text-[var(--warning)] border border-amber-200",
  error:
    "bg-red-50 text-[var(--error)] border border-red-200",
  info:
    "bg-blue-50 text-[var(--info)] border border-blue-200",
  dark: "bg-[var(--surface-dark)] text-[var(--text-on-dark)] border border-transparent",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}
