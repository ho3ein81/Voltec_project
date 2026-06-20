import * as React from "react";
import { cn } from "@/app/components/lib/utils";

interface SectionTitleProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function SectionTitle({
  title,
  description,
  action,
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-[var(--text-secondary)]">{description}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
