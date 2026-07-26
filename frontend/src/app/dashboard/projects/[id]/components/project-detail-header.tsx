"use client";

import React from "react";
import { Button } from "@/app/components/ui/button";
import { ArrowRight, Settings } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  title: string;
  code: string;
  status: string;
}

export default function ProjectDetailHeader({
  title,
  code,
  status,
}: HeaderProps) {
  const getStatusMeta = (statusText: string) => {
    const normalized = (statusText || "").toLowerCase().trim();

    switch (normalized) {
      case "completed":
      case "تکمیل شده":
      case "تکمیل‌شده":
        return {
          label: "تکمیل شده",
          className:
            "border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]",
        };

      case "inprogress":
      case "active":
      case "در حال اجرا":
      case "درحال انجام":
      case "در حال انجام":
        return {
          label: "فعال",
          className:
            "border-[var(--info)]/20 bg-[var(--info)]/10 text-[var(--info)]",
        };

      case "suspension":
      case "تعلیق":
      case "معلق":
        return {
          label: "تعلیق",
          className:
            "border-[var(--warning)]/20 bg-[var(--warning)]/10 text-[var(--warning)]",
        };

      default:
        return {
          label: statusText || "نامشخص",
          className:
            "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]",
        };
    }
  };

  const statusMeta = getStatusMeta(status);

  return (
    <div
      className="rounded-3xl border border-gray-100 bg-white p-3 shadow-sm text-right sm:p-4 lg:p-6"
      style={{ direction: "rtl" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/projects"
            className="shrink-0 rounded-xl p-1 text-gray-400 transition hover:bg-gray-50 hover:text-gray-600"
            title="بازگشت به لیست پروژه‌ها"
          >
            <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <h1 className="truncate text-base font-bold text-gray-900 sm:text-lg lg:text-2xl">
                {title}
              </h1>

              <span
                className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:text-xs ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
            </div>

            <p className="mt-1 truncate text-[11px] text-gray-500 sm:text-xs lg:text-sm">
              کد پروژه: {code}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          <Button className="flex h-9 items-center justify-center gap-1.5 rounded-2xl border border-gray-200 px-3 text-xs text-gray-600 sm:h-10 sm:gap-2 sm:px-4 sm:text-sm">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">تنظیمات پروژه</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
