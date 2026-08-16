import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2,
  FileText,
  Calendar,
  Wallet,
  Hash,
  Info,
  AlignRight,
  Briefcase,
  BadgeCheck,
  X,
  Plus,
  ListChecks,
  Send,
  CircleDollarSign,
  CheckCircle2,
  HelpCircle,
  Trash2,
} from "lucide-react";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import api from "@/app/components/lib/api";

interface ProgressStatement {
  id: number;
  financial_phase_id: number;
  phase_planned_start_date: string | null;
  phase_payment_due_date: string | null;
  phase_amount: number | string;
  phase_description: string | null;
  phase_is_finally?: boolean;
  phase_amount_received: number | string;
  contract_version: number;
  contract_status: string;
  contract_amount: number | string;
  project_code: string;
  project_title: string;
  condition: string;
  created_at: string;
}

interface Payment {
  id: number;
  step?: number | string;
  amount: number | string;
  paid_at: string | null;
  note: string | null;
  created_at: string | null;
  is_registered?: boolean;
}

interface ProjectStatusPanelProps {
  joinId: number | string;
  projectId: number | string;
  projectStatus?: string;
}

type HealthCondition =
  | "not_started"
  | "completed"
  | "critical"
  | "warning"
  | "normal"
  | "good"
  | "excellent";

const toLatinDigits = (value: string) => {
  return value.replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString());
};

const normalizeId = (value: number | string) => {
  const latin = toLatinDigits(String(value ?? "")).trim();
  const n = Number(latin);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const formatCurrency = (value: number | string | null | undefined) => {
  return Number(value || 0).toLocaleString("en-US");
};

const numberToPersianWords = (num: number): string => {
  if (num === 0) return "صفر";
  
  const units = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const teens = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  const tens = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  const hundreds = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  const thousands = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

  const parseChunk = (n: number): string => {
    let chunkWords: string[] = [];
    const h = Math.floor(n / 100);
    const t = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (h > 0) chunkWords.push(hundreds[h]);
    
    if (t === 1) {
      chunkWords.push(teens[u]);
    } else {
      if (t > 1) chunkWords.push(tens[t]);
      if (u > 0) chunkWords.push(units[u]);
    }

    return chunkWords.join(" و ");
  };

  let words: string[] = [];
  let chunkCount = 0;
  let tempNum = num;

  while (tempNum > 0) {
    const chunk = tempNum % 1000;
    if (chunk > 0) {
      const chunkStr = parseChunk(chunk);
      const suffix = thousands[chunkCount] ? " " + thousands[chunkCount] : "";
      words.unshift(chunkStr + suffix);
    }
    tempNum = Math.floor(tempNum / 1000);
    chunkCount++;
  }

  return words.join(" و ");
};

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

const getTodayDateOnly = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const parseDateOnly = (value: string | null | undefined) => {
  if (!value) return null;

  const date = new Date(value);
  if (isNaN(date.getTime())) return null;

  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

const getDiffInDays = (target: Date, base: Date) => {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((target.getTime() - base.getTime()) / msPerDay);
};

const normalizeProjectStatus = (status?: string | null) => {
  if (!status) return "نامشخص";

  const normalized = status.trim();

  if (normalized === "در حال انجام" || normalized.toLowerCase() === "active") {
    return "در حال انجام";
  }

  if (normalized === "معلق" || normalized.toLowerCase() === "suspended") {
    return "معلق";
  }

  if (normalized === "تکمیل شده" || normalized.toLowerCase() === "completed") {
    return "تکمیل شده";
  }

  return normalized;
};

const getProjectStatusClasses = (status?: string | null) => {
  const normalized = normalizeProjectStatus(status);

  if (normalized === "در حال انجام") {
   return "border-(--brand)/30 bg-(--brand)/10 text-(--brand)";
  }

  if (normalized === "معلق") {
    return "border-(--warning)/30 bg-(--warning)/10 text-(--warning)";
  }

  if (
  normalized === "تکمیل شده" ||
  normalized === "تکمیل‌شده" ||
  normalized.toLowerCase() === "completed"
) {
  return "border-(--info)/30 bg-(--info)/10 text-(--info)";
}


  return "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]";
};

const determineHealthCondition = (
  statement: ProgressStatement
): HealthCondition => {
  const today = getTodayDateOnly();
  const plannedStartDate = parseDateOnly(statement.phase_planned_start_date);
  const paymentDueDate = parseDateOnly(statement.phase_payment_due_date);

  const amount = Number(statement.phase_amount) || 0;
  const amountReceived = Number(statement.phase_amount_received) || 0;

  if (plannedStartDate && plannedStartDate > today) return "not_started";
  if (amount === amountReceived) return "completed";
  if (paymentDueDate && today > paymentDueDate && amount > amountReceived) {
    return "critical";
  }

  if (paymentDueDate && amount > amountReceived) {
    const daysToDue = getDiffInDays(paymentDueDate, today);

    if (daysToDue <= 5) return "warning";
    if (daysToDue <= 10) return "normal";
    if (daysToDue <= 15) return "good";
  }

  return "excellent";
};

const mapBackendConditionToHealth = (
  condition?: string | null
): HealthCondition | null => {
  if (!condition) return null;
  const c = condition.trim();

  if (c === "شروع نشده") return "not_started";
  if (c === "کامل شده" || c === "تکمیل شده") return "completed";
  if (c === "بحرانی") return "critical";
  if (c === "هشدار") return "warning";
  if (c === "نرمال") return "normal";
  if (c === "خوب") return "good";
  if (c === "عالی") return "excellent";

  return null;
};

const HEALTH_CONDITION_META: Record<
  HealthCondition,
  { label: string; color: string; softColor: string; borderColor: string }
> = {
  not_started: {
    label: "شروع نشده",
    color: "var(--status-not-started)",
    softColor: "var(--status-not-started-soft)",
    borderColor: "var(--status-not-started-border)",
  },
  completed: {
    label: "تکمیل شده",
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
  projectStatus,
}: ProjectStatusPanelProps) {
  const [statements, setStatements] = useState<ProgressStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── payment state ──
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  const [selectedStatement, setSelectedStatement] =
    useState<ProgressStatement | null>(null);
  const [isPaymentListOpen, setIsPaymentListOpen] = useState(false);
  const [isCreatePaymentOpen, setIsCreatePaymentOpen] = useState(false);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentPaidAt, setPaymentPaidAt] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [createPaymentLoading, setCreatePaymentLoading] = useState(false);
  const [registeringPaymentId, setRegisteringPaymentId] = useState<number | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<number | null>(null);

  const normalizedJoinId = useMemo(() => normalizeId(joinId), [joinId]);
  const normalizedProjectId = useMemo(() => normalizeId(projectId), [projectId]);

  const selectedStatementRemainingAmount = useMemo(() => {
    if (!selectedStatement) return 0;
    const total = Number(selectedStatement.phase_amount) || 0;
    const received = Number(selectedStatement.phase_amount_received) || 0;
    return Math.max(0, total - received);
  }, [selectedStatement]);

  const numericPaymentAmount = useMemo(() => {
    const rawVal = paymentAmount.replace(/,/g, "");
    const parsed = Number(rawVal);
    return Number.isNaN(parsed) || parsed <= 0 ? 0 : parsed;
  }, [paymentAmount]);

  const paymentAmountInWords = useMemo(() => {
    if (numericPaymentAmount === 0) return "";
    return `${numberToPersianWords(numericPaymentAmount)} تومان`;
  }, [numericPaymentAmount]);

  const fetchStatements = useCallback(async () => {
    if (!normalizedJoinId || !normalizedProjectId) {
      setErrorMsg("شناسه‌های ارسالی معتبر نیستند (joinId / projectId).");
      setStatements([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      const response = await api.get(
        `/statement/list/${normalizedJoinId}/${normalizedProjectId}/`
      );

      const normalizedData: ProgressStatement[] = Array.isArray(response.data)
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
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "دریافت صورت‌وضعیت‌ها از سرور با خطا مواجه شد."
      );
      setStatements([]);
    } finally {
      setLoading(false);
    }
  }, [normalizedJoinId, normalizedProjectId]);

  const fetchPayments = useCallback(async (statementId: number) => {
    if (!normalizedJoinId || !statementId) return;

    setPaymentsLoading(true);
    setPaymentsError(null);

    try {
      const response = await api.get(
        `/financial/payment/${normalizedJoinId}/${statementId}/`
      );

      const payload = response.data;
      const rawPayments =
        Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.payments)
          ? payload.payments
          : [];

      const normalizedData: Payment[] = rawPayments.map((item: any, index: number) => ({
        id: item?.id ?? index + 1,
        step: item?.step ?? item?.payment_step ?? index + 1,
        amount: item?.amount ?? item?.payment_amount ?? 0,
        paid_at: item?.paid_at ?? item?.payment_date ?? item?.created_at ?? null,
        note: item?.note ?? item?.description ?? null,
        created_at: item?.created_at ?? item?.createdAt ?? item?.paid_at ?? null,
        is_registered: item?.is_registered ?? !!item?.created_at,
      }));

      setPayments(normalizedData);
    } catch (err: any) {
      console.error(err);
      setPaymentsError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "دریافت لیست پرداختی‌ها با خطا مواجه شد."
      );
      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [normalizedJoinId]);

  const openPaymentList = async (statement: ProgressStatement) => {
    setSelectedStatement(statement);
    setIsPaymentListOpen(true);
    setIsCreatePaymentOpen(false);
    setPayments([]);
    setPaymentsError(null);
    await fetchPayments(Number(statement.id));
  };

  const openCreatePayment = (statement: ProgressStatement) => {
    setSelectedStatement(statement);
    setPaymentAmount("");
    setPaymentPaidAt("");
    setPaymentNote("");
    setPaymentsError(null);
    setIsCreatePaymentOpen(true);
    setIsPaymentListOpen(false);
  };

  const handleCreatePayment = async () => {
    if (!selectedStatement || !normalizedJoinId) return;

    if (numericPaymentAmount <= 0) {
      setPaymentsError("لطفاً مبلغ پرداختی معتبر وارد کنید.");
      return;
    }

    // بررسی اجباری بودن تاریخ و توضیحات
    if (!paymentPaidAt) {
      setPaymentsError("وارد کردن تاریخ پرداخت الزامی است.");
      return;
    }

    if (!paymentNote.trim()) {
      setPaymentsError("وارد کردن توضیحات/یادداشت پرداخت الزامی است.");
      return;
    }

    if (numericPaymentAmount > selectedStatementRemainingAmount) {
      setPaymentsError("مبلغ وارد شده از مبلغ کسری فاز بیشتر می باشد");
      return;
    }

    setCreatePaymentLoading(true);
    setPaymentsError(null);

    try {
      const paidAt = paymentPaidAt ? `${paymentPaidAt}T00:00:00` : undefined;

      await api.post(
        `/financial/payment/${normalizedJoinId}/${selectedStatement.id}/`,
        {
          amount: numericPaymentAmount,
          paid_at: paidAt,
          note: paymentNote.trim(),
        }
      );

      setIsCreatePaymentOpen(false);
      await fetchStatements();
    } catch (err: any) {
      console.error(err);
      const rawError = err?.response?.data?.detail || err?.response?.data?.error || "";
      if (
        rawError.includes("amount") || 
        rawError.includes("مبلغ وارد شده از مبلغ کسری فاز بیشتر می باشد")
      ) {
        setPaymentsError("مبلغ وارد شده از مبلغ کسری فاز بیشتر می باشد");
      } else {
        setPaymentsError(rawError || "ایجاد پرداخت با خطا مواجه شد.");
      }
    } finally {
      setCreatePaymentLoading(false);
    }
  };

  const handleRegisterPayment = async (paymentId: number) => {
    if (!selectedStatement || !normalizedJoinId) return;

    setRegisteringPaymentId(paymentId);
    setPaymentsError(null);

    try {
      await api.post(
        `/financial/payment/register/${normalizedJoinId}/${selectedStatement.id}/${paymentId}/`
      );
      await fetchPayments(Number(selectedStatement.id));
      await fetchStatements();
    } catch (err: any) {
      console.error(err);
      setPaymentsError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "ثبت پرداخت در سیستم با خطا مواجه شد."
      );
    } finally {
      setRegisteringPaymentId(null);
    }
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!selectedStatement || !normalizedJoinId) return;
    if (!confirm("آیا از حذف این مرحله پرداخت اطمینان دارید؟")) return;

    setDeletingPaymentId(paymentId);
    setPaymentsError(null);

    try {
      await api.delete(
        `/financial/payment/${normalizedJoinId}/${selectedStatement.id}/${paymentId}/`
      );
      await fetchPayments(Number(selectedStatement.id));
      await fetchStatements();
    } catch (err: any) {
      console.error(err);
      setPaymentsError(
        err?.response?.data?.detail ||
          err?.response?.data?.error ||
          "حذف پرداخت با خطا مواجه شد."
      );
    } finally {
      setDeletingPaymentId(null);
    }
  };

  useEffect(() => {
    if (normalizedJoinId && normalizedProjectId) {
      fetchStatements();
    } else {
      setLoading(false);
      setStatements([]);
    }
  }, [normalizedJoinId, normalizedProjectId, fetchStatements]);

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
      <div className="flex flex-wrap items-start justify-between gap-3 px-2">
        <div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">
            صورت‌وضعیت‌های صادر شده
          </h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            مدیریت و مشاهده فازهای مالی تایید شده
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${getProjectStatusClasses(projectStatus)}`}
          >
            وضعیت پروژه: {normalizeProjectStatus(projectStatus)}
          </span>

          <div className="flex h-8 min-w-8 items-center justify-center rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] px-2 text-sm font-bold text-[var(--brand-hover)]">
            {statements.length}
          </div>
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

            const healthCondition =
              mapBackendConditionToHealth(statement.condition) ??
              determineHealthCondition(statement);

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

                      {!!statement.phase_is_finally && (
                        <span className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                          <BadgeCheck className="h-3 w-3" />
                          فاز نهایی
                        </span>
                      )}

                      <span
                        className="rounded-lg border px-2.5 py-1 text-[11px] font-bold"
                        style={{
                          color: healthMeta.color,
                          backgroundColor: healthMeta.softColor,
                          borderColor: healthMeta.borderColor,
                        }}
                      >
                        وضعیت سلامت: {healthMeta.label}
                      </span>
                    </div>

                    <div
                      className={`rounded-full border px-4 py-1.5 text-[11px] font-bold ${
                        paid
                          ? "border-green-200 bg-emerald-50 text-[var(--success)]"
                          : "border-amber-200 bg-amber-50 text-[var(--warning)]"
                      }`}
                    >
                      {paid ? "تسویه شده" : "تسویه نشده"}
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
                          تومان
                        </span>
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <Wallet className="h-3 w-3" />
                        مبلغ دریافتی
                      </span>
                      <span className="block text-sm font-bold text-[var(--text-primary)]">
                        {formatCurrency(statement.phase_amount_received)}{" "}
                        <span className="text-[10px] font-normal text-[var(--text-muted)]">
                          تومان
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

                    <div className="col-span-2 space-y-1 sm:col-span-2 lg:col-span-2">
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <AlignRight className="h-3 w-3" />
                        توضیحات فاز
                      </span>
                      <span className="block text-sm font-bold text-[var(--text-primary)]">
                        {statement.phase_description?.trim() || "-"}
                      </span>
                    </div>

                    <div className="col-span-2 space-y-1 sm:col-span-2 lg:col-span-1">
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <Briefcase className="h-3 w-3" />
                        عنوان پروژه
                      </span>
                      <span className="block text-sm font-bold text-[var(--text-primary)]">
                        {statement.project_title || "-"}
                      </span>
                    </div>

                    <div className="col-span-2 space-y-1 border-r border-[var(--border)] pr-4 sm:col-span-2 sm:border-r-0 sm:pr-0 lg:col-span-1 lg:border-r lg:pr-4">
                      <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                        <Info className="h-3 w-3" />
                        کد پروژه
                      </span>
                      <span className="block text-sm font-mono font-medium text-[var(--brand-hover)]">
                        {statement.project_code}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                    <div className="text-xs text-[var(--text-muted)]">
                      مبلغ کل قرارداد:{" "}
                      <span className="font-bold text-[var(--text-primary)]">
                        {formatCurrency(statement.contract_amount)}
                      </span>{" "}
                      <span className="text-[10px] text-[var(--text-muted)]">
                        تومان
                      </span>
                    </div>

                    <div className="text-xs text-[var(--text-muted)]">
                      تاریخ صدور:{" "}
                      <span className="font-bold text-[var(--text-primary)]">
                        {formatDateToJalali(statement.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
                    <button
                      type="button"
                      onClick={() => openCreatePayment(statement)}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] px-3 py-2 text-xs font-bold text-[var(--brand-hover)] transition-colors hover:bg-[var(--brand)] hover:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      ایجاد پرداخت
                    </button>

                    <button
                      type="button"
                      onClick={() => openPaymentList(statement)}
                      className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand-hover)]"
                    >
                      <ListChecks className="h-3.5 w-3.5" />
                      لیست پرداختی‌ها
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── مودال لیست پرداختی‌ها ── */}
      {isPaymentListOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
            style={{ direction: "rtl" }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-[var(--brand-hover)]" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  لیست پرداختی‌ها
                </h4>
                {selectedStatement && (
                  <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-secondary)]">
                    فاز {selectedStatement.contract_version}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentListOpen(false)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-5">
              {paymentsLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="mb-3 h-6 w-6 animate-spin text-[var(--brand)]" />
                  <p className="text-xs text-[var(--text-secondary)]">
                    در حال دریافت پرداختی‌ها...
                  </p>
                </div>
              ) : paymentsError ? (
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--error)] bg-red-50 p-4 text-sm text-[var(--error)]">
                  <Info className="h-4 w-4" />
                  {paymentsError}
                </div>
              ) : payments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <Wallet className="mb-3 h-10 w-10 text-[var(--text-muted)] opacity-20" />
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    هنوز پرداختی برای این صورت‌وضعیت ثبت نشده است.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment, index) => (
                    <div
                      key={payment.id ?? index}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CircleDollarSign className="h-4 w-4 text-[var(--brand-hover)]" />
                          <span className="text-sm font-bold text-[var(--text-primary)]">
                            {formatCurrency(payment.amount)}{" "}
                            <span className="text-[10px] font-normal text-[var(--text-muted)]">
                              تومان
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            گام {payment.step ?? index + 1}
                          </span>
                          
                          {payment.is_registered ? (
                            <span className="flex items-center gap-1 rounded-lg border border-green-200 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
                              <CheckCircle2 className="h-3 w-3" />
                              ثبت شده
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleRegisterPayment(payment.id)}
                                disabled={registeringPaymentId === payment.id}
                                className="flex items-center gap-1 rounded-lg border border-[var(--brand)] bg-[var(--brand)] px-2.5 py-0.5 text-[11px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                              >
                                {registeringPaymentId === payment.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Send className="h-3 w-3" />
                                )}
                                ثبت در سیستم
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeletePayment(payment.id)}
                                disabled={deletingPaymentId === payment.id}
                                className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-1 text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                                title="حذف این گام"
                              >
                                {deletingPaymentId === payment.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[var(--text-muted)]">
                        <span>
                          تاریخ پرداخت:{" "}
                          <span className="font-bold text-[var(--text-primary)]">
                            {formatDateToJalali(payment.paid_at)}
                          </span>
                        </span>

                        <span>
                          تاریخ ثبت:{" "}
                          <span className="font-bold text-[var(--text-primary)]">
                            {formatDateToJalali(payment.created_at)}
                          </span>
                        </span>
                      </div>

                      {payment.note?.trim() && (
                        <p className="mt-2 text-xs text-[var(--text-secondary)]">
                          <span className="font-bold text-[var(--text-muted)]">
                            یادداشت:{" "}
                          </span>
                          {payment.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[var(--border)] px-5 py-3">
              <button
                type="button"
                onClick={() =>
                  selectedStatement && openCreatePayment(selectedStatement)
                }
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] px-3 py-2 text-xs font-bold text-[var(--brand-hover)] transition-colors hover:bg-[var(--brand)] hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                ایجاد پرداخت جدید
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── مودال ایجاد پرداخت ── */}
      {isCreatePaymentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
            style={{ direction: "rtl" }}
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-[var(--brand-hover)]" />
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  ایجاد پرداخت
                </h4>
                {selectedStatement && (
                  <span className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--text-secondary)]">
                    فاز {selectedStatement.contract_version}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePaymentOpen(false)}
                className="rounded-lg p-1.5 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-3.5 text-xs text-[var(--text-secondary)]">
                <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-hover)]" />
                <div className="space-y-1">
                  <p className="font-bold text-[var(--text-primary)]">راهنمای ثبت پرداخت</p>
                  <p className="leading-relaxed">
                    وارد کردن تاریخ پرداخت و یادداشت الزامی است. پس از ایجاد پیش‌نویس، دکمه <span className="font-bold text-[var(--brand-hover)]">ثبت در سیستم</span> را کلیک کنید.
                  </p>
                </div>
              </div>

              {paymentsError && (
                <div className="flex items-center gap-2 rounded-2xl border border-[var(--error)] bg-red-50 p-3 text-xs text-[var(--error)]">
                  <Info className="h-4 w-4" />
                  {paymentsError}
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-[var(--text-muted)]">
                    مبلغ پرداختی (تومان) *
                  </label>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    باقیمانده فاز: <span className="font-bold text-[var(--text-primary)]">{formatCurrency(selectedStatementRemainingAmount)}</span> تومان
                  </span>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    paymentAmount
                      ? Number(paymentAmount.replace(/,/g, "")).toLocaleString("en-US")
                      : ""
                  }
                  onChange={(e) => {
                    const cleanValue = toLatinDigits(e.target.value).replace(/[^0-9]/g, "");
                    setPaymentAmount(cleanValue);
                  }}
                  placeholder="مثلاً 5,000,000"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] font-mono text-left"
                />
                
                {paymentAmountInWords && (
                  <div className="rounded-xl bg-[var(--brand-soft)] p-2.5 text-xs text-[var(--brand-hover)] font-bold transition-all">
                    {paymentAmountInWords}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-muted)]">
                  تاریخ پرداخت *
                </label>

                <div className="relative">
                  <DatePicker
                    calendar={persian}
                    locale={persian_fa}
                    format="YYYY/MM/DD"
                    calendarPosition="bottom-right"
                    containerClassName="w-full"
                    portal
                    portalTarget={document.body}
                    value={
                      paymentPaidAt
                        ? new DateObject({
                            date: paymentPaidAt,
                            calendar: gregorian,
                          }).convert(persian)
                        : undefined
                    }
                    onChange={(date) => {
                      if (!date) {
                        setPaymentPaidAt("");
                        return;
                      }
                      const isoDate = date.convert(gregorian).format("YYYY-MM-DD");
                      setPaymentPaidAt(isoDate);
                    }}
                    inputClass="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] py-2 pl-3 pr-10 text-sm text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--brand)]"
                  />

                  <Calendar
                    size={16}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-muted)]">
                  یادداشت / توضیحات *
                </label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  rows={3}
                  placeholder="توضیحات اجباری پرداخت..."
                  className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--brand)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
              <button
                type="button"
                onClick={() => setIsCreatePaymentOpen(false)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleCreatePayment}
                disabled={createPaymentLoading || !paymentPaidAt || !paymentNote.trim() || numericPaymentAmount <= 0}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--brand)] bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createPaymentLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                ثبت پرداخت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
