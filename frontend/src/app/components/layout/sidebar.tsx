"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "../ui/badge";

const menu = [
  { name: "داشبورد", href: "/dashboard" },
  { name: "شرکت‌های من", href: "/dashboard/companies" },
  { name: "پروژه‌ها", href: "/dashboard/projects" },
  { name: "قراردادها", href: "/dashboard/contracts" },
  { name: "صورت وضعیت‌ها", href: "/dashboard/invoices" },
  { name: "مالی", href: "/dashboard/finance" },
  { name: "مطالبات", href: "/dashboard/claims" },
  { name: "اسناد فنی", href: "/dashboard/documents" },
  { name: "گزارش‌ها", href: "/dashboard/reports" },
  { name: "تنظیمات", href: "/dashboard/settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] lg:flex">
      
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-6">
        <span className="text-lg font-black tracking-tight text-[var(--text-primary)]">
          VOLTEC
        </span>
        <Badge variant="brand">v1</Badge>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {menu.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--border)] p-4 text-xs text-[var(--text-muted)]">
        VOLTEC Platform
        <br />
        Engineering Management System
      </div>
    </aside>
  );
}
