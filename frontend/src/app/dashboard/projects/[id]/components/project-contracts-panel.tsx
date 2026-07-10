"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FileText, Plus, ShieldCheck, Clock3, Users, AlertCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

type ContractItem = {
  id: number | string;
  title: string;
  number?: string;
  status?: "active" | "draft" | "ended" | "pending" | string;
  type?: string;
  contractor?: string;
  amount?: number;
  startDate?: string;
  endDate?: string;
};

type Props = {
  projectId: string;
  contracts?: ContractItem[];
  onAddContract?: () => void;
};

const statusConfig: Record<string, { label: string; className: string }> = {
  active: {
    label: "فعال",
    className: "bg-[var(--brand-soft)] text-[var(--surface-dark)] border-[var(--brand)]",
  },
  draft: {
    label: "پیش‌نویس",
    className: "bg-[var(--surface-soft)] text-[var(--text-secondary)] border-[var(--border)]",
  },
  pending: {
    label: "در انتظار",
    className: "bg-[rgba(37,99,235,0.08)] text-[var(--info)] border-[rgba(37,99,235,0.18)]",
  },
  ended: {
    label: "پایان یافته",
    className: "bg-[rgba(220,38,38,0.08)] text-[var(--error)] border-[rgba(220,38,38,0.18)]",
  },
};

function formatAmount(amount?: number) {
  if (typeof amount !== "number") return "—";
  return `${amount.toLocaleString("fa-IR")} ریال`;
}

function formatDate(date?: string) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("fa-IR");
  } catch {
    return date;
  }
}

export default function ProjectContractsPanel({
  projectId,
  contracts = [],
  onAddContract,
}: Props) {
  const router = useRouter();

  const handleAddContract = () => {
    if (onAddContract) {
      onAddContract();
      return;
    }

    router.push(`/dashboard/projects/${projectId}/contracts/create`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[var(--brand-soft)] p-3 text-[var(--surface-dark)]">
            <FileText className="h-6 w-6" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              قراردادهای پروژه
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              مدیریت قراردادهای مرتبط با این پروژه، وضعیت‌ها، مبلغ و بازه زمانی
            </p>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Project ID: {projectId}
            </p>
          </div>
        </div>

        <Button
          onClick={handleAddContract}
          className="rounded-2xl bg-[var(--brand)] px-5 py-2.5 text-[var(--surface-dark)] hover:bg-[var(--brand-hover)]"
        >
          <Plus className="ml-2 h-4 w-4" />
          افزودن قرارداد
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[rgba(245,183,0,0.12)] p-3 text-[var(--brand-hover)]">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">تعداد قرارداد</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                {contracts.length.toLocaleString("fa-IR")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[rgba(22,163,74,0.12)] p-3 text-[var(--success)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">قراردادهای فعال</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                {contracts.filter((c) => c.status === "active").length.toLocaleString("fa-IR")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[rgba(37,99,235,0.12)] p-3 text-[var(--info)]">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)]">در انتظار بررسی</p>
              <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">
                {contracts.filter((c) => c.status === "pending").length.toLocaleString("fa-IR")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center shadow-sm">
          <div className="rounded-full bg-[var(--brand-soft)] p-4 text-[var(--surface-dark)]">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h3 className="mt-5 text-lg font-bold text-[var(--text-primary)]">
            هنوز قراردادی ثبت نشده است
          </h3>
          <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
            می‌توانید اولین قرارداد این پروژه را ثبت کنید تا جزئیات، مبلغ، وضعیت و بازه زمانی آن در همین بخش نمایش داده شود.
          </p>

          <Button
            onClick={handleAddContract}
            className="mt-6 rounded-2xl bg-[var(--brand)] px-5 py-2.5 text-[var(--surface-dark)] hover:bg-[var(--brand-hover)]"
          >
            <Plus className="ml-2 h-4 w-4" />
            ثبت اولین قرارداد
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {contracts.map((contract) => {
            const status = contract.status || "draft";
            const statusMeta = statusConfig[status] || statusConfig.draft;

            return (
              <div
                key={contract.id}
                className="group rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-[var(--text-primary)]">
                      {contract.title}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      {contract.number ? `شماره قرارداد: ${contract.number}` : "شماره قرارداد ثبت نشده"}
                    </p>
                  </div>

                  <Badge
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}
                  >
                    {statusMeta.label}
                  </Badge>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
                    <p className="text-xs text-[var(--text-muted)]">نوع قرارداد</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {contract.type || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
                    <p className="text-xs text-[var(--text-muted)]">طرف قرارداد</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {contract.contractor || "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
                    <p className="text-xs text-[var(--text-muted)]">مبلغ</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {formatAmount(contract.amount)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[var(--surface-soft)] p-4">
                    <p className="text-xs text-[var(--text-muted)]">بازه زمانی</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                      {formatDate(contract.startDate)} تا {formatDate(contract.endDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <Users className="h-4 w-4" />
                    <span>قرارداد مرتبط با پروژه</span>
                  </div>

                  <button className="text-sm font-medium text-[var(--brand-hover)] transition-colors hover:text-[var(--brand)]">
                    مشاهده جزئیات
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
