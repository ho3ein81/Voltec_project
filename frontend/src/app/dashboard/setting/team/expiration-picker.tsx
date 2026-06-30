"use client";

type ExpirationPickerProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function ExpirationPicker({
  value,
  onChange,
}: ExpirationPickerProps) {
  return (
    <input
      id="invite-expiration"
      type="datetime-local"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
    />
  );
}
