"use client";

import React, { useEffect, useState } from "react";
import { Loader2, FileText, Calendar, Wallet, Hash, Info } from "lucide-react";
import api from "@/app/components/lib/api";

interface ProgressStatement {
  id: number;
  financial_phase_id: number;
  phase_planned_start_date: string | null;
  phase_payment_due_date: string | null;
  phase_amount: number | string;
  phase_description: string | null;
  phase_amount_received: number | string;
  contract_version: number;
  contract_status: string;
  contract_amount: number | string;
  project_code: string;
  project_title: string;
  condition: string;
  created_at: string;
}

interface ProjectStatusPanelProps {
  joinId: number | string;
  projectId: number | string;
}

type HealthCondition =
  | "not_started"
  | "completed"
  | "critical"
  | "warning"
  | "normal"
  | "good"
  | "excellent";

/**
 * تبدیل اعداد فارسی به لاتین برای حفظ یکپارچگی عددی سیستم
 */
const toLatinDigits = (value: string) => {
  return value.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
};

/**
 * فرمت پول با جداکننده هزارگان
 */
const formatCurrency = (value: number | string | null | undefined) => {
  return Number(value || 0).toLocaleString("en-US");
};

/**
 * تبدیل تاریخ میلادی ISO به شمسی با ارقام لاتین
 */
const formatDateToJalali = (value: string | null | undefined) => {
  if (!value) return "-";

  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return "-";

    const jalali = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

    return toLatinDigits(jalali);
  } catch {
    return "-";
  }
};

/**
 * تاریخ امروز بدون ساعت، برای تطابق دقیق‌تر با منطق date-based بک‌اند
 */
const getTodayDateOnly = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

/**
 * تبدیل string تاریخ به Date بدون زمان
 */
const parseDateOnly = (value: string | null | undefined) => {
  if (!value) return null;

  const date = new Date(value);
  if (isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * اختلاف روز target نسبت به base
 */
const getDiffInDays = (target: Date, base: Date) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((target.getTime() - base.getTime()) / msPerDay);
};

/**
 * منطق دقیق Health Status مطابق بک‌اند
 */
const determineHealthCondition = (
  statement: ProgressStatement
): HealthCondition => {
  const today = getTodayDateOnly();
  const plannedStartDate = parseDateOnly(statement.phase_planned_start_date);
  const paymentDueDate = parseDateOnly(statement.phase_payment_due_date);

  const amount = Number(statement.phase_amount) || 0;
  const amountReceived = Number(statement.phase_amount_received) || 0;

  if (plannedStartDate && plannedStartDate > today) {
    return "not_started";
  }

  if (amount === amountReceived) {
    return "completed";
  }

  if (paymentDueDate && today > paymentDueDate && amount > amountReceived) {
    return "critical";
  }

  if (paymentDueDate && amount > amountReceived) {
    const daysToDue = getDiffInDays(paymentDueDate, today);

    if (daysToDue <= 5) {
      return "warning";
    }

    if (daysToDue <= 10) {
      return "normal";
    }

    if (daysToDue <= 15) {
      return "good";
    }
  }

  return "excellent";
};

const HEALTH_CONDITION_META: Record<
  HealthCondition,
  {
    label: string;
    color: string;
    softColor: string;
    borderColor: string;
  }
> = {
  not_started: {
    label: "شروع نشده",
    color: "var(--status-not-started)",
    softColor: "var(--status-not-started-soft)",
    borderColor: "var(--status-not-started-border)",
  },
  completed: {
    label: "کامل شده",
    color: "var(--status-completed)",
    softColor: "var(--status-completed-soft)",
    borderColor: "var(--status-completed-border)",
  },
  critical: {
    label: "بحرانی",
    color: "var(--status-critical)",
    softColor: "var(--status-critical-soft)",
    borderColor: "var(--status-critical-border)",
  },
  warning: {
    label: "هشدار",
    color: "var(--status-warning)",
    softColor: "var(--status-warning-soft)",
    borderColor: "var(--status-warning-border)",
  },
  normal: {
    label: "نرمال",
    color: "var(--status-normal)",
    softColor: "var(--status-normal-soft)",
    borderColor: "var(--status-normal-border)",
  },
  good: {
    label: "خوب",
    color: "var(--status-good)",
    softColor: "var(--status-good-soft)",
    borderColor: "var(--status-good-border)",
  },
  excellent: {
    label: "عالی",
    color: "var(--status-excellent)",
    softColor: "var(--status-excellent-soft)",
    borderColor: "var(--status-excellent-border)",
  },
};

export default function ProjectStatusPanel({
  joinId,
  projectId,
}: ProjectStatusPanelProps) {
  const [statements, setStatements] = useState<ProgressStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatements = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const response = await api.get(`/statement/list/${joinId}/${projectId}/`);

      const normalizedData = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.results)
        ? response.data.results
        : Array.isArray(response.data?.data)
        ? response.data.data
        : [];

      setStatements(normalizedData);
    } catch (err: any) {
      console.error(err);

      setErrorMsg(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          "دریافت صورت‌وضعیت‌ها از سرور با خطا مواجه شد."
      );

      setStatements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (joinId && projectId) {
      fetchStatements();
    }
  }, [joinId, projectId]);

  if (loading) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-[var(--border)] bg-[var(--surface)]">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-[var(--brand)]" />
        <p className="text-sm text-[var(--text-secondary)]">
          در حال دریافت لیست صورت‌وضعیت‌ها...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 text-right" style={{ direction: "rtl" }}>
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            صورت‌وضعیت‌های صادر شده
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            مدیریت و مشاهده فازهای مالی تایید شده
          </p>
        </div>

        <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand-hover)]">
          {statements.length}
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-[var(--error)] bg-red-50 p-4 text-sm text-[var(--error)]">
          <Info className="h-4 w-4" />
          {errorMsg}
        </div>
      )}

      {statements.length === 0 ? (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)]">
          <FileText className="mb-4 h-12 w-12 text-[var(--text-muted)] opacity-20" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            هنوز صورت‌وضعیتی برای این پروژه صادر نشده است.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {statements.map((statement) => {
            const phaseAmount = Number(statement.phase_amount) || 0;
            const received = Number(statement.phase_amount_received) || 0;
            const paid = received >= phaseAmount;

            const healthCondition = determineHealthCondition(statement);
            const healthMeta = HEALTH_CONDITION_META[healthCondition];

            return (
              <div
                key={statement.id}
                className="group relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:shadow-md"
              >
                <div
                  className="absolute right-0 top-0 h-full w-1.5"
                  style={{ backgroundColor: healthMeta.color }}
                />

                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5">
                        <Hash className="h-3.5 w-3.5 text-[var(--brand-hover)]" />
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                          فاز {statement.contract_version}
                        </span>
                      </div>

                      <span 
                        className="rounded-lg border px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          color: healthMeta.color,
                          backgroundColor: healthMeta.softColor,
                          borderColor: healthMeta.borderColor,
                        }}
                      >
                      وضعیت سلامت : {healthMeta.label}
                      </span>
                    </div>

                    <div
                      className={`rounded-full border px-4 py-1.5 text-[11px] font-bold ${
                        paid
                          ? "border-green-200 bg-emerald-50 text-[var(--success)]"
                          : "border-amber-200 bg-amber-50 text-[var(--warning)]"
                      }`}
                    >
                      {paid ? "تسویه شده" : "در جریان"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-2xl bg-[var(--surface-soft)] p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <Wallet className="h-3 w-3" />
                        مبلغ فاز
                      </span>
                      <span className="block text-sm font-bold text-[var(--text-primary)]">
                        {formatCurrency(statement.phase_amount)}{" "}
                        <span className="text-[10px] font-normal text-[var(--text-muted)]">
                          ریال
                        </span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <Calendar className="h-3 w-3" />
                        تاریخ شروع
                      </span>
                      <span className="block text-sm font-bold text-[var(--text-primary)]">
                        {formatDateToJalali(statement.phase_planned_start_date)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <Calendar className="h-3 w-3" />
                        موعد پرداخت
                      </span>
                      <span className="block text-sm font-bold text-[var(--error)]">
                        {formatDateToJalali(statement.phase_payment_due_date)}
                      </span>
                    </div>

                    <div className="space-y-1 border-r border-[var(--border)] pr-4 max-sm:border-r-0 max-sm:pr-0">
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <Info className="h-3 w-3" />
                        کد پروژه
                      </span>
                      <span className="block text-sm font-mono font-medium text-[var(--brand-hover)]">
                        {statement.project_code}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
