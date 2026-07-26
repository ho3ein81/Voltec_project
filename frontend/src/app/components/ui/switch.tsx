"use client";

type SwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
};

export default function Switch({
  checked,
  onChange,
  disabled = false,
  label,
  className = "",
}: SwitchProps) {
  return (
    <label
      className={`inline-flex items-center gap-2 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${className}`}
    >
      <span className="relative inline-flex h-6 w-11 shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />

        <span
          className={`absolute inset-0 rounded-full border transition-all duration-200 ${
            checked
              ? "border-[color:var(--success)] bg-[color:var(--success)]/15"
              : "border-[color:var(--warning)] bg-[color:var(--warning)]/18"
          }`}
        />

        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full shadow-sm transition-all duration-200 ${
            checked
              ? "right-0.5 bg-[color:var(--success)]"
              : "right-[calc(100%-1.375rem)] bg-[color:var(--warning)]"
          }`}
        />
      </span>

      {label ? (
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {label}
        </span>
      ) : null}
    </label>
  );
}
