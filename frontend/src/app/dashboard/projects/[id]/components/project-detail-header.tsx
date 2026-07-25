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

export default function ProjectDetailHeader({ title, code, status }: HeaderProps) {
  // هماهنگ‌سازی رنگ و برچسب نشانگر وضعیت پروژه
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
          label: "در حال انجام",
          className:
            "border-[var(--info)]/20 bg-[var(--info)]/10 text-[var(--info)]",
        };

      case "suspension":
      case "تعلیق":
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dir-rtl text-right" style={{ direction: "rtl" }}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/projects" 
            className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-50 rounded-xl"
            title="بازگشت به لیست پروژه‌ها"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {/* استفاده از span ساده جهت جلوگیری از تداخل استایل‌های Badge کامپوننت */}
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
        </div>
        <p className="text-sm text-gray-500 mr-8">کد پروژه: {code}</p>
      </div>

      <div className="flex items-center gap-2 mr-auto sm:mr-0">
        <Button className="rounded-2xl gap-2 text-gray-600 border-gray-200">
          <Settings className="h-4 w-4" />
          <span>تنظیمات پروژه</span>
        </Button>
      </div>
    </div>
  );
}
