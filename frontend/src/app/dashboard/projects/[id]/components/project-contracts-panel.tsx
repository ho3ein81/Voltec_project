"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
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
  X,
  SlidersHorizontal,
  FileCheck,
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
import { useToast } from "@/app/components/ui/use-toast";

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
  description?: string;
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

  contract_amount?: number | string;
  sum_phases_amount?: number | string;
  sum_phases_amount_received?: number | string;
  total_deficit?: number | string;
  left_over_settlement?: number | string;
  total_completed_phase?: number | string;
  remaining_phases?: number | string;

  status?: ContractStatus;
  is_insurance?: boolean;
  insurance_amount?: number;
  is_tax?: boolean;
  tax_amount?: number;
};
// کد جدید
type SettlementStatus =
  | "pending"
  | "resolved"
  | "needs_review"
  | "needs_review_again";



type FinalSettlement = {
  contract_id: number;
  insurance_status?: SettlementStatus;
  tax_status?: SettlementStatus;
  insurance_settled?: boolean;
  tax_settled?: boolean;
  is_finally_settled: boolean;
  remaining_amount?: number;
  note?: string | null;
};



type PhaseFormState = {
  name: string;
  description: string;
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
  description: "",
  planned_start_date: "",
  planned_end_date: "",
  payment_due_date: "",
  amount: "",
  is_finally: false,
  is_insurance: false,
  is_tax: false,
};

const dateInputClass =
  "h-12 w-full rounded-2xl border border-[var(--border)] px-4 outline-none bg-white font-sans text-sm cursor-pointer hover:border-[var(--brand)] focus:border-[var(--brand)] transition-colors";

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

function useBodyScrollLock() {
  const previousOverflow = useRef<string>("");

  const lock = () => {
    if (typeof document === "undefined") return;
    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  };

  const unlock = () => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = previousOverflow.current || "";
  };

  return { lock, unlock };
}

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

function formatCount(value?: number | string | null) {
  return Number(toNumber(value)).toLocaleString("fa-IR");
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

/**
 * کامپوننت InfoCard بهینه‌شده برای نمایش اطلاعات آماری
 */
interface InfoCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

function InfoCard({ label, value, icon: Icon, className = "" }: InfoCardProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-soft)]/55 p-3 transition-all hover:border-[var(--brand)] hover:bg-[var(--surface-soft)] ${className}`}
    >
      <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
        {Icon && <Icon className="h-3.5 w-3.5 text-[var(--brand-hover)]" />}
        <span>{label}</span>
      </div>
      <div className="min-h-[20px] overflow-hidden truncate font-sans text-sm font-black text-[var(--text-primary)]">
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

  const fieldErrors = Object.entries(data)
    .map(([field, messages]) => {
      const msg = Array.isArray(messages) ? messages.join("، ") : messages;
      return `${msg}`;
    })
    .join(" | ");

  if (fieldErrors) return fieldErrors;

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
  const { toast } = useToast();
  const router = useRouter();
  const { activeCompany } = useCompany();
  const joinId = activeCompany?.id;

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<ActiveContract | null>(null);
  const [projectBudget, setProjectBudget] = useState<number>(0);
  const [phases, setPhases] = useState<ContractFinancialPhase[]>([]);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // State مربوط به مودال توضیحات کامل فاز
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [activeDescription, setActiveDescription] = useState<string>("");
  // کد جدید
  const [finalSettlement, setFinalSettlement] =
    useState<FinalSettlement | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [isSettlementSaving, setIsSettlementSaving] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [tempInsuranceSettled, setTempInsuranceSettled] = useState(false);
  const [tempTaxSettled, setTempTaxSettled] = useState(false);
  const [settlementNote, setSettlementNote] = useState("");

  const canFinalizeSettlement =
  finalSettlement != null &&
  finalSettlement.insurance_status === "resolved" &&
  finalSettlement.tax_status === "resolved" &&
  finalSettlement.is_finally_settled !== true;


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
      is_insurance:
        p.is_insurance === true || String(p.is_insurance) === "true",
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

  // کد جدید
  const fetchFinalSettlement = async () => {
    if (!joinId || !contract?.id) return;

    try {
      setSettlementLoading(true);

      const res = await api.get(`/settlement/final/${joinId}/${contract.id}/`);

      console.log("final settlement GET response:", res?.data);

      const responseData = res?.data;
      const settlementData = responseData?.settlement_info ?? responseData;

      const isResolvedStatus = (value?: string | null) =>
        value === "resolved" ||
        value === "دریافت شده" ||
        value === "تعیین تکلیف شده";

const normalizeSettlementStatus = (
  value?: string | null,
  wasPreviouslyResolved = false,
): SettlementStatus => {
  if (
    value === "resolved" ||
    value === "دریافت شده" ||
    value === "تعیین تکلیف شده"
  ) {
    return "resolved";
  }

  if (value === "needs_review" || value === "نیازمند بررسی") {
    return wasPreviouslyResolved ? "needs_review_again" : "needs_review";
  }

  return "pending";
};



      const normalizedSettlement: FinalSettlement = {
        ...settlementData,
        contract_id: settlementData?.contract_id ?? contract.id,
        insurance_status: normalizeSettlementStatus(
  settlementData?.insurance_status,
),
tax_status: normalizeSettlementStatus(settlementData?.tax_status),

        insurance_settled:
          settlementData?.insurance_settled === true ||
          isResolvedStatus(settlementData?.insurance_status),
        tax_settled:
          settlementData?.tax_settled === true ||
          isResolvedStatus(settlementData?.tax_status),
        is_finally_settled: settlementData?.is_finally_settled ?? false,
        remaining_amount: settlementData?.remaining_amount ?? 0,
        note: settlementData?.note ?? null,
      };




      setFinalSettlement(normalizedSettlement);
    } catch (err) {
      console.error("Error fetching settlement:", err);
    } finally {
      setSettlementLoading(false);
    }
  };

  useEffect(() => {
    if (contract?.id) {
      fetchFinalSettlement();
    }
  }, [joinId, contract?.id]);

  const handleUpdateSettlementStatus = async () => {
    if (!contract?.id || !joinId) return;

    const payload: {
      insurance_status: SettlementStatus;
      tax_status: SettlementStatus;
      note: string;
    } = {
      insurance_status: tempInsuranceSettled ? "resolved" : "pending",
      tax_status: tempTaxSettled ? "resolved" : "pending",
      note: settlementNote,
    };

    setIsSettlementSaving(true);

    try {
      await api.patch(`/settlement/final/${joinId}/${contract.id}/`, payload);

      setFinalSettlement((previousSettlement) => ({
        ...(previousSettlement ?? {}),
        ...payload,
        contract_id: previousSettlement?.contract_id ?? contract.id,
        insurance_settled: payload.insurance_status === "resolved",
        tax_settled: payload.tax_status === "resolved",
        is_finally_settled: previousSettlement?.is_finally_settled ?? false,
        remaining_amount: previousSettlement?.remaining_amount ?? 0,
      }));

      toast({
        title: "وضعیت تسویه با موفقیت بروزرسانی شد",
      });

      const handleFinalSettlement = async () => {
  if (!contract?.id || !joinId) return;

  if (!canFinalizeSettlement) return;

  try {
    setIsSettlementSaving(true);
    await api.post(`/settlement/final/${joinId}/${contract.id}/`, {});
    await fetchFinalSettlement();
  } catch (err) {
    console.error("Error finalizing settlement:", err);
  } finally {
    setIsSettlementSaving(false);
  }
};


      setIsSettlementModalOpen(false);
    } catch (error) {
      console.error("Error updating settlement status:", error);

      toast({
        title: "خطا در ثبت اطلاعات تسویه نهایی",
      });
    } finally {
      setIsSettlementSaving(false);
    }
  };

  const handleFinalSettlement = async () => {
    if (!contract?.id) return;
    try {
      setIsSettlementSaving(true);
      await api.post(`/settlement/final/${joinId}/${contract.id}/`, {});
      await fetchFinalSettlement(); // رفرش داده
    } catch (err) {
      console.error("Error finalizing settlement:", err);
    } finally {
      setIsSettlementSaving(false);
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
          `/${joinId}/${contract.id}/${selectedPhase.id}/phase/`,
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
    if (!joinId) {
      alert("شناسه شرکت/عضویت (joinId) مشخص نیست.");
      return;
    }
    if (!contract?.id) {
      alert("قرارداد فعال مشخص نیست.");
      return;
    }
    if (!selectedPhase?.id) {
      alert("فاز انتخاب نشده است.");
      return;
    }

    if (isPhaseLocked(selectedPhase)) {
      alert("این فاز قبلا صادر و قفل شده است.");
      return;
    }

    setIsIssuing(true);
    try {
      await api.post(
        `/statement/issuance/${joinId}/${contract.id}/${selectedPhase.id}/`,
        {},
      );

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
      <div className="animate-pulse p-20 text-center text-[var(--text-secondary)]">
        در حال بارگذاری...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-hover)] shadow-sm">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-black text-[var(--text-primary)]">
                قرارداد فعال پروژه
              </h2>
              <p className="text-xs font-medium text-[var(--text-secondary)]">
                مدیریت فازهای مالی و صورت‌وضعیت‌ها
              </p>
            </div>
          </div>

          {/* {(contract || projectBudget > 0) && (
            <div className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-2.5 text-xs font-bold font-sans text-[var(--text-primary)]">
              مانده قابل تخصیص: {formatAmount(remainingAmount)}
            </div>
          )} */}
        </div>
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
          {/* بخش اطلاعات مالی و پایه قرارداد (تمام‌عرض به صورت ستونی در بالا) */}
          <div className="space-y-6">
            {/* ۱. نمای مالی قرارداد - تمام عرض */}
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <h3 className="text-sm font-black text-[var(--text-primary)]">
                  نمای مالی قرارداد
                </h3>
                <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                  مهم‌ترین شاخص‌های مالی قرارداد و وضعیت تخصیص
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--text-muted)]">
                      مبلغ قرارداد
                    </span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-hover)]">
                      <Receipt className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="font-sans text-lg font-black text-[var(--text-primary)] md:text-xl">
                    {formatAmount(
                      contract.contract_amount ?? contract.amount ?? 0,
                    )}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700">
                      مجموع دریافتی فازها
                    </span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="font-sans text-lg font-black text-emerald-700 md:text-xl">
                    {formatAmount(
                      contract.total_deficit ??
                        Math.max(
                          0,
                          toNumber(
                            contract.contract_amount ?? contract.amount ?? 0,
                          ) -
                            phases.reduce(
                              (sum, phase) =>
                                sum + toNumber(phase.amount_received),
                              0,
                            ),
                        ),
                    )}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-red-200 bg-red-50/80 p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-red-700">
                      کسری کل
                    </span>
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-red-600">
                      <AlertCircle className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="font-sans text-lg font-black text-red-700 md:text-xl">
                    {formatAmount(
                      contract.total_deficit ??
                        Math.max(
                          0,
                          toNumber(contract.amount) -
                            phases.reduce(
                              (sum, phase) =>
                                sum + toNumber(phase.amount_received),
                              0,
                            ),
                        ),
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <InfoCard
                  label="مجموع مبلغ فازها"
                  value={formatAmount(
                    contract.sum_phases_amount ?? totalAllocatedAmount,
                  )}
                  icon={FileText}
                />
                <InfoCard
                  label="مانده قابل تخصیص"
                  value={formatAmount(
                    contract.left_over_settlement ?? remainingAmount ?? 0,
                  )}
                  icon={Landmark}
                />
                <InfoCard
                  label="فازهای تکمیل‌شده"
                  value={formatCount(
                    contract.total_completed_phase ??
                      phases.filter(
                        (phase) =>
                          phase.statement_issued === true ||
                          phase.is_issued === true,
                      ).length,
                  )}
                  icon={CheckCircle2}
                  className="border-emerald-500/20 bg-emerald-50"
                />
                <InfoCard
                  label="فازهای باقی‌مانده"
                  value={formatCount(
                    contract.remaining_phases ??
                      phases.filter(
                        (phase) =>
                          phase.statement_issued !== true &&
                          phase.is_issued !== true,
                      ).length,
                  )}
                  icon={Clock3}
                  className="border-amber-500/20 bg-amber-50"
                />
              </div>
            </div>

            {/* ۲. اطلاعات پایه قرارداد - تمام عرض */}
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm md:p-6">
              <div className="mb-5">
                <h3 className="text-sm font-black text-[var(--text-primary)]">
                  اطلاعات پایه قرارداد
                </h3>
                <p className="mt-1 text-xs font-medium text-[var(--text-secondary)]">
                  مشخصات اصلی قرارداد و مقادیر پایه
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InfoCard
                  label="بودجه پروژه"
                  value={formatAmount(projectBudget)}
                  icon={Receipt}
                />
                <InfoCard
                  label="وضعیت"
                  value={statusMeta.label}
                  icon={ShieldCheck}
                  className={statusMeta.className}
                />
                <InfoCard
                  label="مدت زمان"
                  value={`${contract.duration_days?.toLocaleString("fa-IR")} روز`}
                  icon={Clock3}
                />
                <InfoCard
                  label="مبلغ بیمه"
                  value={
                    contract?.is_insurance
                      ? formatAmount(contract?.insurance_amount)
                      : "—"
                  }
                  icon={ShieldCheck}
                />
                <InfoCard
                  label="مبلغ مالیات"
                  value={
                    contract?.is_tax ? formatAmount(contract?.tax_amount) : "—"
                  }
                  icon={Landmark}
                />
              </div>
            </div>
          </div>

          {/* ۳. بخش مدیریت فازهای مالی - تمام عرض در پایین */}
          <div className="mt-6 rounded-[2.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm md:p-6 xl:p-8">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  فازهای مالی
                </h3>
                <p className="text-xs font-medium text-[var(--text-secondary)]">
                  مدیریت تخصیص مبالغ، دریافتی‌ها و صورت‌وضعیت هر فاز
                </p>
              </div>

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
                className="h-10 w-full rounded-xl px-4 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
                    className={`rounded-[2rem] border p-4 transition-all sm:p-5 md:p-6 ${
                      isLocked
                        ? "border-[var(--border)] bg-[var(--surface-soft)]/45 opacity-90 select-none"
                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--brand)] hover:shadow-sm"
                    }`}
                  >
                    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="w-full min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="inline-flex min-w-8 items-center justify-center rounded-xl bg-[var(--surface-soft)] px-2.5 py-1 text-[11px] font-black text-[var(--text-muted)]">
                            {(idx + 1).toLocaleString("fa-IR")}
                          </span>

                          <h4
                            className={`text-sm font-bold ${
                              isLocked
                                ? "text-[var(--text-secondary)]"
                                : "text-[var(--text-primary)]"
                            }`}
                          >
                            {phase.name || `فاز ${idx + 1}`}
                          </h4>

                          {phase.is_finally && (
                            <span className="inline-flex items-center rounded-full border border-[var(--success)]/10 bg-[var(--success)]/10 px-2.5 py-1 text-[10px] font-black text-[var(--success)]">
                              تسویه نهایی
                            </span>
                          )}

                          {phase.is_insurance && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 shadow-sm">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              مشمول بیمه
                            </span>
                          )}

                          {phase.is_tax && (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700 shadow-sm">
                              <Landmark className="h-3.5 w-3.5 text-blue-600" />
                              مشمول مالیات
                            </span>
                          )}
                        </div>

                        {/* بخش توضیحات فاز (تمام‌عرض با قابلیت کلیک و نمایش کامل در مودال) */}
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          <div className="md:col-span-3">
                            <div
                              className="group relative w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/60 px-4 py-3 cursor-pointer hover:bg-[var(--surface-soft)] hover:border-[var(--brand)] transition-all duration-200"
                              onClick={() => {
                                setActiveDescription(phase.description || "");
                                setIsDescModalOpen(true);
                              }}
                            >
                              <div className="mb-1.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-[11px] font-bold text-[var(--text-muted)]">
                                  توضیحات فاز
                                </span>
                                <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] transition-colors duration-200 group-hover:text-[var(--brand-hover)]">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
                                  جهت مشاهده کامل کلیک کنید
                                </span>
                              </div>

                              <p className="truncate text-sm leading-7 text-[var(--text-primary)]">
                                {phase.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isLocked && (
                        <div className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-500 shrink-0">
                          <Lock className="h-3.5 w-3.5 text-neutral-400" />
                          <span>قفل شده</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] xl:items-stretch">
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

                      <div className="col-span-full flex flex-wrap items-center justify-end gap-2 pt-1 xl:col-span-1 xl:pt-0">
                        {!isLocked ? (
                          <>
                            <Button
                              size="icon"
                              className="h-9 w-9 rounded-lg"
                              onClick={() => {
                                setSelectedPhase(phase);
                                setPhaseForm({
                                  name: phase.name || "",
                                  description: phase.description || "",
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
                              className="h-9 flex-1 rounded-lg px-4 text-xs sm:flex-none"
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
                          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--success)]/10 bg-[var(--success)]/5 px-3 py-2 text-[10px] font-black text-[var(--success)] sm:w-auto sm:justify-start">
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

      {/* Modal: مشاهده متن کامل توضیحات */}
      {mounted &&
        isDescModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/65 p-4 backdrop-blur-sm sm:items-center">
            <div
              className="relative w-full max-w-lg rounded-[1.75rem] bg-white p-5 shadow-2xl text-right sm:rounded-[2.5rem] sm:p-8"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h3 className="text-lg font-black text-[var(--text-primary)]">
                  توضیحات کامل فاز مالی
                </h3>
                <button
                  onClick={() => setIsDescModalOpen(false)}
                  className="rounded-full p-1.5 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto pr-1 pl-1">
                <p className="whitespace-pre-line text-sm leading-8 text-[var(--text-primary)]">
                  {activeDescription}
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setIsDescModalOpen(false)}
                  className="h-10 rounded-xl px-6"
                >
                  بستن
                </Button>
              </div>
            </div>
          </div>,
          document.body,
        )}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                تسویه نهایی قرارداد
              </h3>
              <p className="mt-0.5 text-xs leading-5 text-[var(--text-secondary)]">
                بررسی وضعیت مفاصاحساب بیمه، مالیات و بستن پرونده مالی پروژه
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)] animate-pulse" />
              در انتظار تعیین تکلیف
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 md:gap-4">
          <div className="flex flex-col justify-between gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              مانده قابل تسویه
            </span>
            <div className="mt-1 flex items-baseline gap-1 text-right dir-ltr">
              <span className="text-base font-bold text-[var(--text-primary)] md:text-lg">
                {Number(
                  contract?.left_over_settlement ?? remainingAmount ?? 0,
                ).toLocaleString()}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                تومان
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              مفاصاحساب بیمه
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span
                className={
                  finalSettlement?.insurance_status === "resolved" ||
                  finalSettlement?.insurance_settled === true
                    ? "rounded-md bg-[color:rgba(22,163,74,0.12)] px-2.5 py-1 text-xs font-bold text-[var(--success)]"
                    : "rounded-md bg-[color:rgba(245,158,11,0.12)] px-2.5 py-1 text-xs font-bold text-[var(--warning)]"
                }
              >
               {finalSettlement?.insurance_status === "needs_review" ||
finalSettlement?.insurance_status === "needs_review_again"
  ? "نیازمند بررسی مجدد"
  : finalSettlement?.insurance_status === "resolved" ||
      finalSettlement?.insurance_settled === true
    ? "دریافت شده"
    : "تعیین تکلیف نشده"}

              </span>

              <FileCheck className="h-4 w-4 text-[var(--text-secondary)] opacity-60" />
            </div>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              مفاصاحساب مالیات
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span
                className={
                  finalSettlement?.tax_status === "resolved" ||
                  finalSettlement?.tax_settled === true
                    ? "rounded-md bg-[color:rgba(22,163,74,0.12)] px-2.5 py-1 text-xs font-bold text-[var(--success)]"
                    : "rounded-md bg-[color:rgba(245,158,11,0.12)] px-2.5 py-1 text-xs font-bold text-[var(--warning)]"
                }
              >
               {finalSettlement?.tax_status === "needs_review" ||
finalSettlement?.tax_status === "needs_review_again"
  ? "نیازمند بررسی مجدد"
  : finalSettlement?.tax_status === "resolved" ||
      finalSettlement?.tax_settled === true
    ? "دریافت شده"
    : "تعیین تکلیف نشده"}

              </span>

              <Receipt className="h-4 w-4 text-[var(--text-secondary)] opacity-60" />
            </div>
          </div>

          <div className="flex flex-col justify-between gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              وضعیت کلی تسویه
            </span>
            <div className="mt-1 flex items-center justify-between">
              <span className="rounded-md bg-[color:rgba(220,38,38,0.12)] px-2.5 py-1 text-xs font-bold text-[var(--error)]">
                تسویه نشده
              </span>
              <AlertCircle className="h-4 w-4 text-[var(--error)]" />
            </div>
          </div>
        </div>

        {finalSettlement?.note?.trim() && (
          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4">
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              یادداشت تسویه
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
              {finalSettlement.note}
            </p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2.5 border-t border-[var(--border)] pt-4">
          <button
            type="button"
            onClick={() => {
              setTempInsuranceSettled(
                finalSettlement?.insurance_status === "resolved" ||
                  finalSettlement?.insurance_settled === true,
              );

              setTempTaxSettled(
                finalSettlement?.tax_status === "resolved" ||
                  finalSettlement?.tax_settled === true,
              );

              setSettlementNote(finalSettlement?.note ?? "");
              setIsSettlementModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--brand-soft)]"
          >
            <SlidersHorizontal className="h-4 w-4 text-[var(--text-secondary)]" />
            تعیین تکلیف بیمه و مالیات
          </button>

         <button
  type="button"
  onClick={handleFinalSettlement}
  disabled={
    settlementLoading ||
    isSettlementSaving ||
    !canFinalizeSettlement
  }
  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-4 py-2.5 text-xs font-bold text-[var(--text-on-dark)] shadow-sm transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
>

            <CheckCircle2 className="h-4 w-4" />
            انجام تسویه نهایی پروژه
          </button>
        </div>
      </div>

      {/* Settlement Adjustment Modal */}
      {mounted &&
        isSettlementModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
              <div className="mb-6 flex items-start justify-between gap-3 border-b border-[var(--border)] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">
                    تعیین تکلیف بیمه و مالیات
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">
                    وضعیت مفاصاحساب‌ها و یادداشت تسویه نهایی را ثبت کنید.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:bg-[var(--brand-soft)]">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--brand)]"
                    checked={tempInsuranceSettled}
                    onChange={(e) => setTempInsuranceSettled(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    مفاصاحساب بیمه دریافت شده است
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 transition-colors hover:bg-[var(--brand-soft)]">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-[var(--brand)]"
                    checked={tempTaxSettled}
                    onChange={(e) => setTempTaxSettled(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    مفاصاحساب مالیات دریافت شده است
                  </span>
                </label>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--text-secondary)]">
                    یادداشت تسویه
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
                    rows={3}
                    placeholder="توضیحات مربوط به تسویه نهایی..."
                    value={settlementNote}
                    onChange={(e) => setSettlementNote(e.target.value)}
                  />
                  <p className="text-xs text-[var(--text-muted)]">
                    ثبت این یادداشت اختیاری است.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border)] pt-4">
                <button
                  type="button"
                  onClick={() => setIsSettlementModalOpen(false)}
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                >
                  انصراف
                </button>

                <button
                  type="button"
                  onClick={handleUpdateSettlementStatus}
                  disabled={isSettlementSaving}
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-bold text-[var(--text-on-dark)] shadow-sm transition hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSettlementSaving ? "در حال ثبت..." : "ثبت تغییرات نهایی"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modal: افزودن/ویرایش فاز */}
      {mounted &&
        isPhaseModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/60 px-4 pt-6 pb-4 backdrop-blur-sm sm:items-center sm:pt-4">
            <div
              className="relative my-auto flex min-h-0 w-[calc(100vw-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[1.75rem] bg-white p-5 text-right shadow-2xl sm:w-full sm:rounded-[2.5rem] sm:p-8"
              dir="rtl"
            >
              <h3 className="mb-6 shrink-0 text-xl font-black">
                {selectedPhase ? "ویرایش فاز" : "افزودن فاز جدید"}
              </h3>

              <div className="scrollbar-thin max-h-[calc(100dvh-10rem)] min-w-0 space-y-4 overflow-x-hidden overflow-y-auto pr-1 pl-1">
                <div className="space-y-2">
                  <label className="px-1 text-xs font-bold">عنوان فاز</label>
                  <input
                    value={phaseForm.name}
                    onChange={(e) =>
                      setPhaseForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border px-4 outline-none ring-[var(--brand)] focus:ring-2 bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="px-1 text-xs font-bold">توضیحات</label>
                  <textarea
                    rows={4}
                    value={phaseForm.description}
                    onChange={(e) =>
                      setPhaseForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="توضیحات فاز..."
                    className="w-full rounded-2xl border border-[var(--border)] px-4 py-3 outline-none ring-[var(--brand)] focus:ring-2 bg-white resize-none"
                  />
                </div>

                <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="px-1 text-xs font-bold">تاریخ شروع</label>
                    {mounted && (
                      <DatePicker
                        portal
                        portalTarget={document.body}
                        zIndex={9999}
                        value={toPersianDateObject(
                          phaseForm.planned_start_date,
                        )}
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
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="px-1 text-xs font-bold">
                      تاریخ پایان
                    </label>
                    {mounted && (
                      <DatePicker
                        portal
                        portalTarget={document.body}
                        zIndex={9999}
                        value={toPersianDateObject(phaseForm.planned_end_date)}
                        onChange={(date) =>
                          setPhaseForm((prev) => ({
                            ...prev,
                            planned_end_date: toGregorianIso(
                              date as DateObject,
                            ),
                          }))
                        }
                        calendar={persian}
                        locale={persian_fa}
                        format="YYYY/MM/DD"
                        inputClass={dateInputClass}
                        containerClassName="w-full"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="px-1 text-xs font-bold">
                    سررسید پرداخت
                  </label>
                  {mounted && (
                    <DatePicker
                      portal
                      portalTarget={document.body}
                      zIndex={9999}
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
                      className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/55 px-4 font-sans text-lg font-black outline-none transition-all focus:border-[var(--brand)] focus:bg-white disabled:bg-[var(--border)]/20"
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
                  <div className="rounded-xl border border-[var(--brand)] bg-[var(--brand-soft)] px-3 py-2 text-xs font-bold text-[var(--brand-hover)]">
                    مانده تسویه پروژه:{" "}
                    <span className="font-black">
                      {formatAmount(
                        contract?.left_over_settlement ?? remainingAmount ?? 0,
                      )}
                    </span>
                  </div>
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
                    className="h-5 w-5 rounded-md border-gray-300 text-[var(--brand)]"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">
                      این فاز، فاز نهایی (تسویه) است
                    </span>
                  </div>
                </div>
              </div>

              {phaseFormError && (
                <div className="mt-4 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-bold text-red-600">
                  {phaseFormError}
                </div>
              )}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
          </div>,
          document.body,
        )}

      {/* Modal: صدور صورت‌وضعیت */}
      {mounted &&
        isIssueModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="my-auto min-w-0 w-full max-w-md rounded-[1.75rem] bg-white p-5 text-center shadow-2xl sm:rounded-[2.5rem] sm:p-8">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-black">صدور صورت‌وضعیت</h3>
              <p className="mt-3 text-sm text-gray-500">
                با صدور صورت‌وضعیت، این فاز مالی قفل شده و دیگر امکان ویرایش
                نخواهد داشت.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  className="h-12 flex-1 rounded-2xl"
                  onClick={() => {
                    setIsIssueModalOpen(false);
                    setSelectedPhase(null);
                  }}
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
          </div>,
          document.body,
        )}
    </div>
  );
}
