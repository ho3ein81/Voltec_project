"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Clock3,
  FileQuestion,
  FileText,
  Plus,
  Receipt,
  ShieldCheck,
  Trash2,
  Edit3,
  CheckCircle2,
  Lock,
  Landmark,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import api from "@/app/components/lib/api";
import { useCompany } from "@/app/components/company/company-provider";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

import "react-multi-date-picker/styles/layouts/mobile.css";

// =========================
// Types
// =========================
type ContractStatus =
  | "valid"
  | "inactive"
  | "active"
  | "draft"
  | "ended"
  | "pending"
  | "expired"
  | "معتبر"
  | "غیرفعال"
  | string;

type ContractFinancialPhase = {
  id?: number;
  name?: string;
  planned_start_date?: string;
  planned_end_date?: string;
  payment_due_date?: string;
  amount?: number | string;
  amount_received?: number | string;
  is_finally?: boolean;
  is_locked?: boolean;
  statement_issued?: boolean;
  is_issued?: boolean;
  statement_id?: number | null;
  is_insurance?: boolean;
  is_tax?: boolean;
};

type ActiveContract = {
  id: number;
  start_date?: string;
  end_date?: string;
  duration_days?: number;
  amount?: number;
  status?: ContractStatus;
  is_insurance?: boolean;
  insurance_amount?: number;
  is_tax?: boolean;
  tax_amount?: number;
};

type PhaseFormState = {
  name: string;
  planned_start_date: string;
  planned_end_date: string;
  payment_due_date: string;
  amount: string;
  is_finally: boolean;
  is_insurance: boolean;
  is_tax: boolean;
};

type Props = {
  projectId: string;
  onAddContract?: () => void;
};

// =========================
// Constants
// =========================
const initialPhaseForm: PhaseFormState = {
  name: "",
  planned_start_date: "",
  planned_end_date: "",
  payment_due_date: "",
  amount: "",
  is_finally: false,
  is_insurance: false,
  is_tax: false,
};

const dateInputClass =
  "h-12 w-full rounded-2xl border border-[var(--border)] px-4 outline-none bg-white font-sans text-sm cursor-pointer";

const statusConfig: Record<string, { label: string; className: string }> = {
  valid: {
    label: "معتبر",
    className:
      "border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]",
  },
  معتبر: {
    label: "معتبر",
    className:
      "border-[var(--success)]/20 bg-[var(--success)]/10 text-[var(--success)]",
  },
  inactive: {
    label: "غیرفعال",
    className:
      "border-[var(--error)]/20 bg-[var(--error)]/10 text-[var(--error)]",
  },
  غیرفعال: {
    label: "غیرفعال",
    className:
      "border-[var(--error)]/20 bg-[var(--error)]/10 text-[var(--error)]",
  },
};

// =========================
// Helpers
// =========================
function toPersianDateObject(value?: string): DateObject | undefined {
  if (!value) return undefined;

  return new DateObject({
    date: value,
    format: "YYYY-MM-DD",
    calendar: gregorian,
    locale: gregorian_en,
  }).convert(persian, persian_fa);
}

function toGregorianIso(value: DateObject | DateObject[] | null): string {
  if (!value || Array.isArray(value)) return "";
  return value.convert(gregorian, gregorian_en).format("YYYY-MM-DD");
}

function toNumber(value?: number | string | null): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const cleaned = String(value)
    .replace(/[^\d.-]/g, "")
    .trim();
  const parsed = parseFloat(cleaned);

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAmount(amount?: number | string | null) {
  return `${toNumber(amount).toLocaleString("fa-IR")} تومان`;
}

const LOCAL_LOCKED_PHASES_KEY = "voltec_locked_phases";

function getLocalLockedPhases(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOCAL_LOCKED_PHASES_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.map((id: any) => Number(id)).filter((id) => !isNaN(id))
      : [];
  } catch {
    return [];
  }
}

function saveLocalLockedPhase(id: number | string) {
  if (typeof window === "undefined") return;
  try {
    const numericId = Number(id);
    if (isNaN(numericId) || numericId === 0) return;

    const current = getLocalLockedPhases();
    if (!current.includes(numericId)) {
      localStorage.setItem(
        LOCAL_LOCKED_PHASES_KEY,
        JSON.stringify([...current, numericId]),
      );
    }
  } catch (err) {
    console.error("Error saving locked phase to localStorage", err);
  }
}

function isPhaseLocked(phase?: ContractFinancialPhase | null): boolean {
  if (!phase || !phase.id) return false;

  const backendLocked = !!(
    phase.is_locked === true ||
    phase.statement_issued === true ||
    phase.is_issued === true ||
    (phase.statement_id !== undefined &&
      phase.statement_id !== null &&
      Number(phase.statement_id) !== 0)
  );

  if (backendLocked) return true;

  const localLockedIds = getLocalLockedPhases();
  return localLockedIds.includes(Number(phase.id));
}

function InfoCard({
  label,
  value,
  icon,
  className = "",
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/55 p-4 transition-all hover:bg-[var(--surface-soft)] ${className}`}
    >
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
        <span className="text-[var(--brand)]">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm font-bold text-[var(--text-primary)]">
        {value ?? "—"}
      </div>
    </div>
  );
}

function formatDate(date?: string) {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("fa-IR");
  } catch {
    return date;
  }
}

function numToWords(num: number): string {
  if (num === 0) return "صفر";

  const units = ["", "هزار", "میلیون", "میلیارد", "تیلیارد"];
  const words: string[] = [];
  let unitIdx = 0;

  let tempNum = num;

  while (tempNum > 0) {
    const chunk = tempNum % 1000;
    if (chunk > 0) {
      words.unshift(`${chunk.toLocaleString("fa-IR")} ${units[unitIdx]}`);
    }
    tempNum = Math.floor(tempNum / 1000);
    unitIdx++;
  }

  return words.join(" و ").trim();
}

function extractApiError(err: any): string {
  const data = err?.response?.data;
  if (!data) return err?.message ?? "خطای سیستمی رخ داد";
  if (typeof data === "string") return data;
  return data?.detail || "خطا در پردازش درخواست.";
}

function isLatinNumber(value: string) {
  return /^[0-9]+(\.[0-9]+)?$/.test(value.trim());
}

function compareDate(a?: string, b?: string) {
  if (!a || !b) return 0;
  return a.localeCompare(b);
}

export default function ProjectContractsPanel({ projectId }: Props) {
  const router = useRouter();
  const { activeCompany } = useCompany();
  const joinId = activeCompany?.id;

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ActiveContract | null>(null);
  const [projectBudget, setProjectBudget] = useState<number>(0);
  const [phases, setPhases] = useState<ContractFinancialPhase[]>([]);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] =
    useState<ContractFinancialPhase | null>(null);
  const [phaseForm, setPhaseForm] = useState<PhaseFormState>(initialPhaseForm);
  const [phaseFormError, setPhaseFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchProjectBudget = async () => {
    if (!joinId || !projectId || projectId === "undefined") return;
    try {
      const res = await api.get(`/projects/${joinId}/${projectId}/`);
      setProjectBudget(toNumber(res?.data?.budget));
    } catch (err) {
      console.error("Error fetching project budget:", err);
      setProjectBudget(0);
    }
  };

  const createDefaultFinallyPhase = async (
    joinId: number,
    currentContract: ActiveContract,
  ) => {
    try {
      const payload = {
        name: "فاز تسویه نهایی (سیستمی)",
        planned_start_date: currentContract.start_date,
        planned_end_date: currentContract.end_date,
        payment_due_date: currentContract.end_date,
        amount: 0,
        is_finally: true,
        is_insurance: false,
        is_tax: false,
      };

      await api.post(`/financial/${joinId}/${currentContract.id}/`, payload);
    } catch (err) {
      console.error("Error creating default finally phase:", err);
    }
  };

  const mapPhaseData = (p: any): ContractFinancialPhase => {
    return {
      ...p,
      is_insurance: p.is_insurance === true || String(p.is_insurance) === "true",
      is_tax: p.is_tax === true || String(p.is_tax) === "true",
      is_finally: p.is_finally === true || String(p.is_finally) === "true",
    };
  };

  const fetchActiveContract = async () => {
    if (!joinId || !projectId || projectId === "undefined") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get(`/contracts/${joinId}/${projectId}/watch/`);
      const data = res?.data ?? {};

      const currentContract = data.contract ?? null;
      setContract(currentContract);

      const rawPhases: any[] =
        data.phases ||
        data.pahses ||
        data.contract_financial_phases ||
        data.financial_phases ||
        [];

      const localLockedIds = getLocalLockedPhases();

      const enrichedPhases = rawPhases.map((p) => {
        const mapped = mapPhaseData(p);
        if (mapped.id && localLockedIds.includes(Number(mapped.id))) {
          return {
            ...mapped,
            is_locked: true,
            statement_issued: true,
            is_issued: true,
          };
        }
        return mapped;
      });

      if (currentContract && enrichedPhases.length === 0) {
        await createDefaultFinallyPhase(joinId, currentContract);
        const reloadRes = await api.get(
          `/contracts/${joinId}/${projectId}/watch/`,
        );
        const reloadData = reloadRes?.data ?? {};
        const reloadRaw: any[] =
          reloadData.phases ||
          reloadData.pahses ||
          reloadData.contract_financial_phases ||
          reloadData.financial_phases ||
          [];

        setPhases(
          reloadRaw.map((p) => {
            const mapped = mapPhaseData(p);
            return mapped.id && localLockedIds.includes(Number(mapped.id))
              ? {
                  ...mapped,
                  is_locked: true,
                  statement_issued: true,
                  is_issued: true,
                }
              : mapped;
          }),
        );
      } else {
        setPhases(enrichedPhases);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveContract();
    fetchProjectBudget();
  }, [joinId, projectId]);

  const hasExistingFinallyPhase = useMemo(() => {
    return phases.some((p) => p.is_finally === true);
  }, [phases]);

  const calculateFinalPhaseAmount = (
    total: number,
    phaseList: ContractFinancialPhase[],
    editId?: number,
  ) => {
    const finallyPhase = phaseList.find((p) => p.is_finally === true);

    if (finallyPhase && isPhaseLocked(finallyPhase)) {
      return toNumber(finallyPhase.amount);
    }

    const used = phaseList.reduce((sum, phase) => {
      if (phase.id !== undefined && phase.id === editId) return sum;
      if (phase.is_finally) return sum;
      return sum + toNumber(phase.amount);
    }, 0);

    return Math.max(0, total - used);
  };

  const totalAllocatedAmount = useMemo(() => {
    return phases.reduce((sum, phase) => {
      const isLocked = isPhaseLocked(phase);
      const val = phase.is_finally
        ? isLocked
          ? toNumber(phase.amount)
          : calculateFinalPhaseAmount(projectBudget, phases, phase.id)
        : toNumber(phase.amount);
      return sum + val;
    }, 0);
  }, [phases, projectBudget]);

  const remainingAmount = useMemo(
    () => Math.max(0, projectBudget - totalAllocatedAmount),
    [projectBudget, totalAllocatedAmount],
  );

  const remainingAllowedAmount = useMemo(() => {
    const nonFinallyOtherPhasesSum = phases.reduce((sum, p) => {
      if (p.is_finally) return sum;
      if (selectedPhase?.id !== undefined && p.id === selectedPhase.id)
        return sum;
      return sum + toNumber(p.amount);
    }, 0);

    const finallyPhase = phases.find((p) => p.is_finally === true);
    const lockedFinallyAmount =
      finallyPhase && isPhaseLocked(finallyPhase)
        ? toNumber(finallyPhase.amount)
        : 0;

    return Math.max(
      0,
      projectBudget - lockedFinallyAmount - nonFinallyOtherPhasesSum,
    );
  }, [projectBudget, phases, selectedPhase]);

  const statusMeta =
    statusConfig[contract?.status || "valid"] || statusConfig.valid;

  const isAddPhaseDisabled = useMemo(() => {
    return totalAllocatedAmount >= projectBudget && projectBudget > 0;
  }, [totalAllocatedAmount, projectBudget]);

  const validatePhaseForm = () => {
    if (!phaseForm.name.trim()) return "عنوان فاز را وارد کنید.";
    if (!phaseForm.planned_start_date) return "تاریخ شروع فاز را وارد کنید.";
    if (!phaseForm.planned_end_date) return "تاریخ پایان فاز را وارد کنید.";
    if (!phaseForm.payment_due_date) return "سررسید پرداخت را وارد کنید.";

    if (!contract?.start_date || !contract?.end_date) {
      return "تاریخ شروع و پایان قرارداد نامعتبر است.";
    }

    if (compareDate(phaseForm.planned_start_date, contract.start_date) < 0) {
      return "تاریخ شروع فاز نمی‌تواند قبل از تاریخ شروع قرارداد باشد.";
    }
    if (compareDate(phaseForm.planned_start_date, contract.end_date) > 0) {
      return "تاریخ شروع فاز نمی‌تواند بعد از تاریخ پایان قرارداد باشد.";
    }
    if (
      compareDate(phaseForm.planned_end_date, phaseForm.planned_start_date) < 0
    ) {
      return "تاریخ پایان فاز نمی‌تواند قبل از تاریخ شروع فاز باشد.";
    }
    if (compareDate(phaseForm.planned_end_date, contract.end_date) > 0) {
      return "تاریخ پایان فاز نمی‌تواند بعد از تاریخ پایان قرارداد باشد.";
    }
    if (
      compareDate(phaseForm.payment_due_date, phaseForm.planned_end_date) < 0
    ) {
      return "سررسید پرداخت نمی‌تواند قبل از تاریخ پایان فاز باشد.";
    }
    if (compareDate(phaseForm.payment_due_date, contract.end_date) > 0) {
      return "سررسید پرداخت نمی‌تواند بعد از تاریخ پایان قرارداد باشد.";
    }

    if (!phaseForm.is_finally) {
      if (!phaseForm.amount.trim()) return "مبلغ فاز را وارد کنید.";
      if (!isLatinNumber(phaseForm.amount))
        return "مبلغ فاز باید فقط با اعداد لاتین وارد شود.";
      const numericAmount = toNumber(phaseForm.amount);
      if (numericAmount <= 0) return "مبلغ فاز باید بزرگ‌تر از صفر باشد.";
      if (numericAmount > remainingAllowedAmount) {
        return "مبلغ این فاز نمی‌تواند از مانده قابل تخصیص بودجه پروژه بیشتر باشد.";
      }
    }

    return null;
  };

  const handleCreateOrUpdate = async () => {
    setPhaseFormError(null);

    if (selectedPhase && isPhaseLocked(selectedPhase)) {
      setPhaseFormError("این فاز قفل شده است و امکان ویرایش آن وجود ندارد.");
      return;
    }

    const validationError = validatePhaseForm();
    if (validationError) {
      setPhaseFormError(validationError);
      return;
    }

    if (!joinId || !contract?.id) return;
    setIsSaving(true);

    try {
      const amount = phaseForm.is_finally
        ? calculateFinalPhaseAmount(projectBudget, phases, selectedPhase?.id)
        : toNumber(phaseForm.amount);

      const payload = { ...phaseForm, amount };

      if (selectedPhase?.id) {
        await api.patch(
          `/financial/${joinId}/${contract.id}/${selectedPhase.id}/phase/`,
          payload,
        );
      } else {
        await api.post(`/financial/${joinId}/${contract.id}/`, payload);
      }

      setIsPhaseModalOpen(false);
      setSelectedPhase(null);
      setPhaseForm(initialPhaseForm);
      await fetchActiveContract();
    } catch (err: any) {
      setPhaseFormError(extractApiError(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const phaseToDelete = phases.find((p) => p.id === id);
    if (phaseToDelete && isPhaseLocked(phaseToDelete)) {
      alert("این فاز قفل شده است و امکان حذف آن وجود ندارد.");
      return;
    }

    if (!window.confirm("آیا از حذف این فاز اطمینان دارید؟")) return;
    setIsDeleting(true);
    try {
      await api.delete(`/financial/${joinId}/${contract?.id}/${id}/phase/`);
      await fetchActiveContract();
    } catch (err: any) {
      alert(extractApiError(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleIssueStatement = async () => {
    if (!selectedPhase?.id) return;

    if (isPhaseLocked(selectedPhase)) {
      alert("این فاز قبلا صادر و قفل شده است.");
      return;
    }

    setIsIssuing(true);
    try {
      await api.post(`/statement/issuance/${joinId}/${selectedPhase.id}/`);

      saveLocalLockedPhase(selectedPhase.id);

      setPhases((prev) =>
        prev.map((phase) =>
          phase.id === selectedPhase.id
            ? {
                ...phase,
                is_locked: true,
                statement_issued: true,
                is_issued: true,
              }
            : phase,
        ),
      );

      setIsIssueModalOpen(false);
      setSelectedPhase(null);

      await fetchActiveContract();
    } catch (err: any) {
      alert(extractApiError(err));
    } finally {
      setIsIssuing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center animate-pulse text-[var(--text-secondary)]">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-hover)]">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-[var(--text-primary)]">
              قرارداد فعال پروژه
            </h2>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              مدیریت فازهای مالی
            </p>
          </div>
        </div>

        {(contract || projectBudget > 0) && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2 text-xs font-bold font-sans">
            مانده قابل تخصیص: {formatAmount(remainingAmount)}
          </div>
        )}
      </div>

      {!contract ? (
        <div className="rounded-[2.5rem] border border-dashed border-[var(--border)] bg-[var(--surface-soft)] py-20 text-center">
          <FileQuestion className="mx-auto h-12 w-12 text-[var(--text-muted)] opacity-20" />
          <h3 className="mt-4 text-xl font-black">قراردادی یافت نشد</h3>
          <Button
            onClick={() =>
              router.push(`/dashboard/projects/${projectId}/contracts/create`)
            }
            className="mt-6"
          >
            ثبت قرارداد جدید
          </Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <InfoCard
              label="بودجه پروژه"
              value={formatAmount(projectBudget)}
              icon={<Receipt className="h-5 w-5" />}
            />
            <InfoCard
              label="وضعیت"
              value={statusMeta.label}
              icon={<ShieldCheck className="h-5 w-5" />}
              className={statusMeta.className}
            />
            <InfoCard
              label="مدت زمان"
              value={`${contract.duration_days?.toLocaleString("fa-IR")} روز`}
              icon={<Clock3 className="h-5 w-5" />}
            />
            <InfoCard
              label="مبلغ بیمه"
              value={
                contract?.is_insurance
                  ? formatAmount(contract?.insurance_amount)
                  : "—"
              }
              icon={<ShieldCheck className="h-5 w-5" />}
            />
            <InfoCard
              label="مبلغ مالیات"
              value={
                contract?.is_tax
                  ? formatAmount(contract?.tax_amount)
                  : "—"
              }
              icon={<Landmark className="h-5 w-5" />}
            />
          </div>

          <div className="rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-base font-black">فازهای مالی</h3>
              <Button
                disabled={isAddPhaseDisabled}
                onClick={() => {
                  setPhaseForm({
                    ...initialPhaseForm,
                    planned_start_date: contract?.start_date || "",
                    planned_end_date: contract?.end_date || "",
                    payment_due_date: contract?.end_date || "",
                  });
                  setSelectedPhase(null);
                  setPhaseFormError(null);
                  setIsPhaseModalOpen(true);
                }}
                className="h-10 rounded-xl px-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="ml-2 h-4 w-4" />
                افزودن فاز
              </Button>
            </div>

            <div className="space-y-4">
              {phases.map((phase, idx) => {
                const isLocked = isPhaseLocked(phase);

                const calculatedAmount = phase.is_finally
                  ? isLocked
                    ? toNumber(phase.amount)
                    : calculateFinalPhaseAmount(projectBudget, phases, phase.id)
                  : toNumber(phase.amount);

                return (
                  <div
                    key={phase.id ?? idx}
                    className={`group rounded-3xl border p-6 transition-all ${
                      isLocked
                        ? "border-[var(--border)] bg-[var(--surface-soft)]/40 opacity-90 select-none"
                        : "border-[var(--border)] hover:border-[var(--brand)] bg-[var(--surface)]"
                    }`}
                  >
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-xs font-black opacity-30">
                          {(idx + 1).toLocaleString("fa-IR")}
                        </span>
                        <h4
                          className={`font-bold text-sm ${isLocked ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"}`}
                        >
                          {phase.name || `فاز ${idx + 1}`}
                        </h4>

                        {phase.is_finally && (
                          <span className="inline-flex items-center rounded-full bg-[var(--success)]/10 px-2.5 py-1 text-[10px] font-black text-[var(--success)] border border-[var(--success)]/10">
                            تسویه نهایی
                          </span>
                        )}

                        {phase.is_insurance && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            مشمول بیمه
                          </span>
                        )}

                        {phase.is_tax && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-500/20 px-2.5 py-1 text-[10px] font-bold text-blue-700 shadow-sm">
                            <Landmark className="h-3.5 w-3.5 text-blue-600" />
                            مشمول مالیات
                          </span>
                        )}
                      </div>
                      {isLocked && (
                        <div className="flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-500">
                          <Lock className="h-3.5 w-3.5 text-neutral-400" />
                          <span>قفل شده</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                      <InfoCard
                        label="مبلغ"
                        value={formatAmount(calculatedAmount)}
                      />
                      <InfoCard
                        label="سررسید"
                        value={formatDate(phase.payment_due_date)}
                      />
                      <InfoCard
                        label="دریافتی"
                        value={formatAmount(phase.amount_received)}
                      />
                      <div className="col-span-2 flex items-center justify-end gap-2 pt-4 lg:col-span-1 lg:pt-0">
                        {!isLocked ? (
                          <>
                            <Button
                              size="icon"
                              className="h-9 w-9 rounded-lg"
                              onClick={() => {
                                setSelectedPhase(phase);
                                setPhaseForm({
                                  name: phase.name || "",
                                  planned_start_date:
                                    phase.planned_start_date || "",
                                  planned_end_date:
                                    phase.planned_end_date || "",
                                  payment_due_date:
                                    phase.payment_due_date || "",
                                  amount: String(phase.amount || ""),
                                  is_finally: !!phase.is_finally,
                                  is_insurance: !!phase.is_insurance,
                                  is_tax: !!phase.is_tax,
                                });
                                setPhaseFormError(null);
                                setIsPhaseModalOpen(true);
                              }}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            {!phase.is_finally && (
                              <Button
                                size="icon"
                                className="h-9 w-9 rounded-lg border-red-100 text-red-500 hover:bg-red-50"
                                onClick={() => handleDelete(phase.id!)}
                                disabled={isDeleting}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              className="h-9 rounded-lg px-4 text-xs"
                              onClick={() => {
                                if (isPhaseLocked(phase)) return;
                                setSelectedPhase(phase);
                                setIsIssueModalOpen(true);
                              }}
                            >
                              صدور صورت‌وضعیت
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 rounded-xl border border-[var(--success)]/10 bg-[var(--success)]/5 px-3 py-2 text-[10px] font-black text-[var(--success)]">
                            <CheckCircle2 className="h-4 w-4" />
                            صورت‌وضعیت صادر شد
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {isPhaseModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[2.5rem] bg-white p-8 shadow-2xl">
            <h3 className="mb-6 text-xl font-black">
              {selectedPhase ? "ویرایش فاز" : "افزودن فاز جدید"}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <label className="px-1 text-xs font-bold">عنوان فاز</label>
                <input
                  value={phaseForm.name}
                  onChange={(e) =>
                    setPhaseForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="h-12 w-full rounded-2xl border px-4 outline-none ring-[var(--brand)] focus:ring-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="px-1 text-xs font-bold">تاریخ شروع</label>
                  {mounted && (
                    <DatePicker
                      portal
                      portalTarget={document.body}
                      zIndex={9999}
                      onOpen={() => {
                        document.body.style.overflow = "hidden";
                      }}
                      onClose={() => {
                        document.body.style.overflow = "auto";
                      }}
                      value={toPersianDateObject(phaseForm.planned_start_date)}
                      onChange={(date) =>
                        setPhaseForm((prev) => ({
                          ...prev,
                          planned_start_date: toGregorianIso(
                            date as DateObject,
                          ),
                        }))
                      }
                      calendar={persian}
                      locale={persian_fa}
                      format="YYYY/MM/DD"
                      inputClass={dateInputClass}
                      containerClassName="w-full"
                      minDate={toPersianDateObject(contract?.start_date)}
                      maxDate={toPersianDateObject(
                        phaseForm.planned_end_date || contract?.end_date,
                      )}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="px-1 text-xs font-bold">تاریخ پایان</label>
                  {mounted && (
                    <DatePicker
                      portal
                      portalTarget={document.body}
                      zIndex={9999}
                      onOpen={() => {
                        document.body.style.overflow = "hidden";
                      }}
                      onClose={() => {
                        document.body.style.overflow = "auto";
                      }}
                      value={toPersianDateObject(phaseForm.planned_end_date)}
                      onChange={(date) =>
                        setPhaseForm((prev) => ({
                          ...prev,
                          planned_end_date: toGregorianIso(date as DateObject),
                        }))
                      }
                      calendar={persian}
                      locale={persian_fa}
                      format="YYYY/MM/DD"
                      inputClass={dateInputClass}
                      containerClassName="w-full"
                      minDate={toPersianDateObject(
                        phaseForm.planned_start_date || contract?.start_date,
                      )}
                      maxDate={toPersianDateObject(contract?.end_date)}
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="px-1 text-xs font-bold">سررسید پرداخت</label>
                {mounted && (
                  <DatePicker
                    portal
                    portalTarget={document.body}
                    zIndex={9999}
                    onOpen={() => {
                      document.body.style.overflow = "hidden";
                    }}
                    onClose={() => {
                      document.body.style.overflow = "auto";
                    }}
                    value={toPersianDateObject(phaseForm.payment_due_date)}
                    onChange={(date) =>
                      setPhaseForm((prev) => ({
                        ...prev,
                        payment_due_date: toGregorianIso(date as DateObject),
                      }))
                    }
                    calendar={persian}
                    locale={persian_fa}
                    format="YYYY/MM/DD"
                    inputClass={dateInputClass}
                    containerClassName="w-full"
                    minDate={toPersianDateObject(
                      phaseForm.planned_end_date ||
                        phaseForm.planned_start_date ||
                        contract?.start_date,
                    )}
                    maxDate={toPersianDateObject(contract?.end_date)}
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="px-1 text-xs font-bold text-[var(--text-secondary)]">
                  مبلغ فاز (تومان)
                </label>

                <div className="relative">
                  <input
                    disabled={phaseForm.is_finally}
                    inputMode="numeric"
                    placeholder="مثلاً: 250000000"
                    value={
                      phaseForm.is_finally
                        ? String(
                            calculateFinalPhaseAmount(
                              projectBudget,
                              phases,
                              selectedPhase?.id,
                            ),
                          )
                        : phaseForm.amount
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/[۰-۹]/.test(value)) {
                        setPhaseFormError(
                          "مبلغ فاز باید فقط با اعداد لاتین وارد شود.",
                        );
                        return;
                      }
                      if (!/^\d*$/.test(value)) return;
                      setPhaseFormError(null);
                      setPhaseForm((prev) => ({ ...prev, amount: value }));
                    }}
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/50 px-4 font-sans text-lg font-black outline-none transition-all focus:border-[var(--brand)] focus:bg-white disabled:bg-[var(--border)]/20"
                  />
                </div>

                {(phaseForm.amount || phaseForm.is_finally) && (
                  <div className="mt-2 flex items-start gap-2 rounded-xl bg-[var(--brand-soft)]/30 p-3 text-[var(--brand-hover)]">
                    <div className="mt-0.5">
                      <Receipt className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold uppercase opacity-60">
                        مبلغ به حروف:
                      </span>
                      <span className="text-xs font-black leading-relaxed">
                        {numToWords(
                          phaseForm.is_finally
                            ? calculateFinalPhaseAmount(
                                projectBudget,
                                phases,
                                selectedPhase?.id,
                              )
                            : toNumber(phaseForm.amount),
                        )}{" "}
                        تومان
                      </span>
                    </div>
                  </div>
                )}

                {!phaseForm.is_finally && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-soft)] px-3 py-1.5 text-[10px] font-black text-[var(--brand-hover)] border border-[var(--brand)]/10">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
                    <span>حداکثر مبلغ مجاز:</span>
                    <span className="font-sans font-bold">
                      {formatAmount(remainingAllowedAmount)}
                    </span>
                  </div>
                )}
              </div>

              <div
                className={`flex items-center gap-3 rounded-2xl p-4 transition-all ${
                  hasExistingFinallyPhase && !selectedPhase?.is_finally
                    ? "bg-gray-100 opacity-60 cursor-not-allowed select-none"
                    : "bg-[var(--surface-soft)] cursor-pointer"
                }`}
                onClick={() => {
                  if (hasExistingFinallyPhase && !selectedPhase?.is_finally) {
                    return;
                  }
                  setPhaseForm((prev) => ({
                    ...prev,
                    is_finally: !prev.is_finally,
                  }));
                }}
              >
                <input
                  type="checkbox"
                  checked={phaseForm.is_finally}
                  disabled={
                    hasExistingFinallyPhase && !selectedPhase?.is_finally
                  }
                  readOnly
                  className="h-5 w-5 rounded-md border-gray-300 text-[var(--brand)] disabled:opacity-50"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-bold">
                    این فاز، فاز نهایی (تسویه) است
                  </span>
                  {hasExistingFinallyPhase && !selectedPhase?.is_finally && (
                    <span className="text-[10px] text-gray-500 font-semibold mt-1">
                      (فاز تسویه نهایی قبلاً ایجاد شده است و فقط یک مورد مجاز است)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {phaseFormError && (
              <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">
                {phaseFormError}
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <Button
                className="h-12 flex-1 rounded-2xl"
                onClick={() => {
                  setIsPhaseModalOpen(false);
                  setSelectedPhase(null);
                  setPhaseFormError(null);
                }}
              >
                انصراف
              </Button>
              <Button
                className="h-12 flex-[2] rounded-2xl"
                onClick={handleCreateOrUpdate}
                disabled={isSaving}
              >
                {isSaving ? "در حال ذخیره..." : "تایید و ثبت"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isIssueModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2.5rem] bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black">صدور صورت‌وضعیت</h3>
            <p className="mt-3 text-sm text-gray-500">
              با صدور صورت‌وضعیت، این فاز مالی قفل شده و دیگر امکان ویرایش
              نخواهد داشت.
            </p>
            <div className="mt-8 flex gap-3">
              <Button
                className="h-12 flex-1 rounded-2xl"
                onClick={() => setIsIssueModalOpen(false)}
              >
                انصراف
              </Button>
              <Button
                className="h-12 flex-[2] rounded-2xl bg-orange-500 text-white hover:bg-orange-600"
                onClick={handleIssueStatement}
                disabled={isIssuing}
              >
                {isIssuing ? "در حال صدور..." : "تایید و قفل فاز"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
