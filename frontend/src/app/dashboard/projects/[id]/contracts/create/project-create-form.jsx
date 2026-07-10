"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import DatePicker from "react-multi-date-picker";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import {
  BadgeDollarSign,
  CircleAlert,
  FileSignature,
  FolderKanban,
  Layers3,
  Plus,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

const contractTypes = [
  { label: "پیمان اصلی", value: "primary" },
  { label: "مشاوره", value: "consulting" },
  { label: "نظارت", value: "supervision" },
  { label: "اجرا", value: "execution" },
];

const statusOptions = [
  { label: "فعال", value: "active" },
  { label: "غیرفعال", value: "inactive" },
];

const currencyOptions = [
  { label: "ریال", value: "IRR" },
  { label: "تومان", value: "TOMAN" },
  { label: "دلار", value: "USD" },
  { label: "یورو", value: "EUR" },
];

const insuranceOptions = [
  { label: "مشمول بیمه", value: "included" },
  { label: "معاف از بیمه", value: "exempt" },
  { label: "طبق شرایط قرارداد", value: "conditional" },
];

const taxOptions = [
  { label: "مشمول مالیات", value: "included" },
  { label: "معاف از مالیات", value: "exempt" },
  { label: "طبق شرایط قرارداد", value: "conditional" },
];

const registrationTypeOptions = [
  { label: "درصدی", value: "percentage" },
  { label: "مبلغ ثابت", value: "fixed" },
];

const createInitialPhase = (order = 1) => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  title: "",
  order,
  registration_type: "percentage",
  percentage: "",
  amount: "",
  planned_start_date: "",
  planned_end_date: "",
  due_date: "",
});

const INTEGER_INPUT_REGEX = /^[0-9,]*$/;
const DECIMAL_INPUT_REGEX = /^[0-9,]*\.?[0-9]*$/;

function normalizeNumericString(value) {
  return String(value || "")
    .replaceAll(",", "")
    .trim();
}

function parseNumericValue(value) {
  const normalized = normalizeNumericString(value);
  if (!normalized) return 0;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isValidNumericInput(value, allowDecimal = false) {
  return allowDecimal
    ? DECIMAL_INPUT_REGEX.test(value)
    : INTEGER_INPUT_REGEX.test(value);
}

function formatNumberDisplay(value) {
  const raw = typeof value === "number" ? String(value) : String(value || "");
  const normalized = normalizeNumericString(raw);
  if (!normalized) return "—";
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return "—";
  return parsed.toLocaleString("fa-IR");
}

function getCurrencyLabel(currency) {
  return (
    currencyOptions.find((item) => item.value === currency)?.label ?? "ریال"
  );
}

function getCurrencyWord(currency) {
  const map = {
    IRR: "ریال",
    TOMAN: "تومان",
    USD: "دلار",
    EUR: "یورو",
  };
  return map[currency] ?? "ریال";
}

function getFieldNumericErrorLabel(label) {
  return `${label} فقط باید با اعداد لاتین وارد شود`;
}

function numberToPersianWords(num) {
  if (!Number.isFinite(num) || num < 0) return "";
  if (num === 0) return "صفر";

  const ones = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const teens = [
    "ده",
    "یازده",
    "دوازده",
    "سیزده",
    "چهارده",
    "پانزده",
    "شانزده",
    "هفده",
    "هجده",
    "نوزده",
  ];
  const tens = [
    "",
    "",
    "بیست",
    "سی",
    "چهل",
    "پنجاه",
    "شصت",
    "هفتاد",
    "هشتاد",
    "نود",
  ];
  const hundreds = [
    "",
    "صد",
    "دویست",
    "سیصد",
    "چهارصد",
    "پانصد",
    "ششصد",
    "هفتصد",
    "هشتصد",
    "نهصد",
  ];
  const scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون", "کوادریلیون"];

  const convertBelowThousand = (n) => {
    const parts = [];
    const h = Math.floor(n / 100);
    const remainder = n % 100;
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;

    if (h > 0) parts.push(hundreds[h]);

    if (remainder >= 10 && remainder < 20) {
      parts.push(teens[remainder - 10]);
    } else {
      if (t > 0) parts.push(tens[t]);
      if (o > 0) parts.push(ones[o]);
    }

    return parts.join(" و ");
  };

  let value = Math.floor(num);
  const parts = [];
  let scaleIndex = 0;

  while (value > 0) {
    const chunk = value % 1000;
    if (chunk > 0) {
      const chunkText = convertBelowThousand(chunk);
      const scaleText = scales[scaleIndex];
      parts.unshift(scaleText ? `${chunkText} ${scaleText}` : chunkText);
    }
    value = Math.floor(value / 1000);
    scaleIndex += 1;
  }

  return parts.join(" و ");
}

function getAmountInWords(value, currency) {
  const amount = parseNumericValue(value);
  if (!amount) return "";
  const integerAmount = Math.floor(amount);
  return `${numberToPersianWords(integerAmount)} ${getCurrencyWord(currency)}`;
}

export default function ContractCreateForm() {
  const params = useParams();
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    project_id: String(params?.id ?? ""),
    title: "",
    contract_number: "",
    contract_type: "primary",
    signed_at: "",
    end_date: "",
    status: "active",
    total_amount: "",
    currency: "IRR",
    payment_terms: "",
    insurance_type: "included",
    insurance_rate: "",
    tax_type: "included",
    tax_rate: "",
    legal_financial_notes: "",
    phases: [createInitialPhase(1)],
  });

  const setFieldError = (key, message = "") => {
    setErrors((prev) => {
      if (!message) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: message };
    });
  };

  const updateField = (key, value) => {
    const integerFields = {
      total_amount: "مبلغ کل قرارداد",
    };

    const decimalFields = {
      insurance_rate: "درصد بیمه",
      tax_rate: "درصد مالیات",
    };

    if (integerFields[key]) {
      if (!isValidNumericInput(value, false)) {
        setFieldError(
          String(key),
          getFieldNumericErrorLabel(integerFields[key]),
        );
      } else {
        setFieldError(String(key));
      }
    }

    if (decimalFields[key]) {
      if (!isValidNumericInput(value, true)) {
        setFieldError(
          String(key),
          getFieldNumericErrorLabel(decimalFields[key]),
        );
      } else {
        setFieldError(String(key));
      }
    }

    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePhase = (phaseId, key, value) => {
    const errorKey = `phase-${phaseId}-${String(key)}`;

    if (key === "amount" && !isValidNumericInput(value, false)) {
      setFieldError(errorKey, "مبلغ فاز فقط باید با اعداد لاتین وارد شود");
    } else if (key === "percentage" && !isValidNumericInput(value, true)) {
      setFieldError(errorKey, "درصد فاز فقط باید با اعداد لاتین وارد شود");
    } else if (key === "order" && !isValidNumericInput(value, false)) {
      setFieldError(errorKey, "ترتیب فاز فقط باید با اعداد لاتین وارد شود");
    } else {
      setFieldError(errorKey);
    }

    setForm((prev) => ({
      ...prev,
      phases: prev.phases.map((phase) =>
        phase.id === phaseId ? { ...phase, [key]: value } : phase,
      ),
    }));
  };

  const addPhase = () => {
    setForm((prev) => ({
      ...prev,
      phases: [...prev.phases, createInitialPhase(prev.phases.length + 1)],
    }));
  };

  const removePhase = (phaseId) => {
    setForm((prev) => {
      const filtered = prev.phases.filter((phase) => phase.id !== phaseId);

      return {
        ...prev,
        phases: filtered.length
          ? filtered.map((phase, index) => ({
              ...phase,
              order: index + 1,
            }))
          : [createInitialPhase(1)],
      };
    });

    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        if (key.includes(`phase-${phaseId}-`)) {
          delete next[key];
        }
      });
      return next;
    });
  };

  const parsedContractAmount = parseNumericValue(form.total_amount);

  const amountInWords = useMemo(() => {
    return getAmountInWords(form.total_amount, form.currency);
  }, [form.total_amount, form.currency]);

  const contractDuration = useMemo(() => {
    if (!form.signed_at || !form.end_date) return "—";

    try {
      const start = new DateObject({
        date: form.signed_at,
        calendar: persian,
        locale: persian_fa,
      });

      const end = new DateObject({
        date: form.end_date,
        calendar: persian,
        locale: persian_fa,
      });

      const diff = Math.max(
        0,
        Math.round(
          (end.toDate().getTime() - start.toDate().getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );

      return `${diff.toLocaleString("fa-IR")} روز`;
    } catch {
      return "—";
    }
  }, [form.signed_at, form.end_date]);

  const totals = useMemo(() => {
    const normalPhases = form.phases.length > 1 ? form.phases.slice(0, -1) : [];

    const totalPercentage = normalPhases.reduce(
      (sum, phase) => sum + parseNumericValue(phase.percentage),
      0,
    );

    const totalPhaseAmount = normalPhases.reduce(
      (sum, phase) => sum + parseNumericValue(phase.amount),
      0,
    );

    const preliminaryFinalSettlement = Math.max(
      parsedContractAmount - totalPhaseAmount,
      0,
    );

    return {
      totalPercentage,
      totalPhaseAmount,
      preliminaryFinalSettlement,
    };
  }, [form.phases, parsedContractAmount]);

  const validations = useMemo(() => {
    return [
      {
        label: "حداقل یک فاز مالی وجود داشته باشد",
        ok: form.phases.length > 0,
      },
      {
        label: "فاز آخر همیشه تسویه نهایی در نظر گرفته می‌شود",
        ok: form.phases.length > 0,
      },
      {
        label: "مجموع درصد فازهای قبل از تسویه بیشتر از ۱۰۰٪ نباشد",
        ok: totals.totalPercentage <= 100,
      },
      {
        label: "مجموع مبلغ فازهای قبل از تسویه از مبلغ قرارداد بیشتر نشود",
        ok:
          parsedContractAmount === 0 ||
          totals.totalPhaseAmount <= parsedContractAmount,
      },
      {
        label:
          "مبلغ تسویه نهایی در زمان صورت‌وضعیت از مانده واقعی محاسبه می‌شود",
        ok: true,
        note: "در ثبت قرارداد، مبلغ نهایی تسویه به‌صورت قطعی قفل نمی‌شود.",
      },
      {
        label: "فقط یک قرارداد فعال برای هر پروژه مجاز است",
        ok: true,
        note: "این مورد باید سمت بک‌اند کنترل شود.",
      },
    ];
  }, [
    form.phases.length,
    totals.totalPercentage,
    totals.totalPhaseAmount,
    parsedContractAmount,
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 sm:gap-6 sm:px-4 sm:py-6 md:px-6 xl:px-8">
        <div className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.18)] sm:rounded-[28px] sm:p-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]">
                <FileSignature className="h-4 w-4" />
                ثبت قرارداد پروژه
              </div>

              <div className="space-y-2">
                <h1 className="text-xl font-black tracking-tight sm:text-2xl md:text-3xl">
                  ایجاد قرارداد جدید
                </h1>
                <p className="max-w-4xl text-sm leading-7 text-[var(--text-secondary)]">
                  در این فرم، ساختار پایه قرارداد ثبت می‌شود: اطلاعات قرارداد،
                  مبلغ کل، وضعیت بیمه و مالیات، و فازهای مالی اولیه. دریافت
                  واقعی مبالغ در مرحله صورت‌وضعیت و ثبت عملکرد هر فاز انجام
                  خواهد شد.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full border-0 bg-[var(--brand)] px-3 py-1 text-[var(--surface-dark)] hover:bg-[var(--brand)]">
                پروژه: {form.project_id || "—"}
              </Badge>
              <Badge
                variant="outline"
                className="rounded-full border-[var(--border)] px-3 py-1 text-[var(--text-secondary)]"
              >
                فرم پایه قرارداد
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-6">
          <div className="order-2 space-y-4 xl:order-1 xl:space-y-6">
            <Card className="rounded-[24px] border-[var(--border)] bg-[var(--surface)] shadow-sm sm:rounded-[28px]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-black sm:text-lg">
                  <FolderKanban className="h-5 w-5 text-[var(--brand-hover)]" />
                  اطلاعات پایه قرارداد
                </CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="پروژه مرتبط">
                  <Input
                    value={form.project_id}
                    disabled
                    className="h-11 rounded-2xl border-[var(--border)] bg-[var(--surface-soft)]"
                  />
                </Field>

                <Field label="عنوان قرارداد" required>
                  <Input
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="مثلاً قرارداد اجرای فاز اول"
                    className="h-11 rounded-2xl border-[var(--border)]"
                  />
                </Field>

                <Field label="شماره قرارداد" required>
                  <Input
                    value={form.contract_number}
                    onChange={(e) =>
                      updateField("contract_number", e.target.value)
                    }
                    placeholder="مثلاً C-1405-01"
                    className="h-11 rounded-2xl border-[var(--border)]"
                  />
                </Field>

                <Field label="نوع قرارداد">
                  <Select
                    value={form.contract_type}
                    onChange={(value) => updateField("contract_type", value)}
                    options={contractTypes}
                  />
                </Field>

                <Field label="تاریخ امضا / شروع قرارداد">
                  <PersianDateInput
                    value={form.signed_at}
                    onChange={(value) => updateField("signed_at", value)}
                    placeholder="انتخاب تاریخ شروع قرارداد"
                  />
                </Field>

                <Field label="تاریخ پایان قرارداد">
                  <PersianDateInput
                    value={form.end_date}
                    onChange={(value) => updateField("end_date", value)}
                    placeholder="انتخاب تاریخ پایان"
                  />
                </Field>

                <Field label="مدت قرارداد">
                  <Input
                    value={contractDuration}
                    disabled
                    className="h-11 rounded-2xl border-[var(--border)] bg-[var(--surface-soft)] font-semibold"
                  />
                </Field>

                <Field label="وضعیت قرارداد">
                  <Select
                    value={form.status}
                    onChange={(value) => updateField("status", value)}
                    options={statusOptions}
                  />
                </Field>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-[var(--border)] bg-[var(--surface)] shadow-sm sm:rounded-[28px]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-black sm:text-lg">
                  <BadgeDollarSign className="h-5 w-5 text-[var(--brand-hover)]" />
                  اطلاعات مالی قرارداد
                </CardTitle>
              </CardHeader>

              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="مبلغ کل قرارداد"
                  required
                  error={errors.total_amount}
                  hint={
                    form.total_amount && !errors.total_amount ? (
                      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2.5">
                        <p className="text-xs font-semibold text-[var(--brand-hover)]">
                          {formatNumberDisplay(form.total_amount)}{" "}
                          {getCurrencyLabel(form.currency)}
                        </p>
                        {amountInWords ? (
                          <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                            {amountInWords}
                          </p>
                        ) : null}
                      </div>
                    ) : null
                  }
                >
                  <Input
                    value={form.total_amount}
                    onChange={(e) =>
                      updateField("total_amount", e.target.value)
                    }
                    placeholder="مثلاً 25000000000"
                    inputMode="numeric"
                    className="h-11 rounded-2xl border-[var(--border)]"
                  />
                </Field>

                <Field label="واحد پول">
                  <Select
                    value={form.currency}
                    onChange={(value) => updateField("currency", value)}
                    options={currencyOptions}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="شرایط پرداخت کلی">
                    <textarea
                      value={form.payment_terms}
                      onChange={(e) =>
                        updateField("payment_terms", e.target.value)
                      }
                      placeholder="مثلاً پیش‌پرداخت، پرداخت مرحله‌ای، آزادسازی مبالغ بر اساس پیشرفت و صورت‌وضعیت"
                      className="min-h-[110px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]"
                    />
                  </Field>
                </div>

                <Field label="وضعیت بیمه">
                  <Select
                    value={form.insurance_type}
                    onChange={(value) => updateField("insurance_type", value)}
                    options={insuranceOptions}
                  />
                </Field>

                <Field label="درصد بیمه" error={errors.insurance_rate}>
                  <Input
                    value={form.insurance_rate}
                    onChange={(e) =>
                      updateField("insurance_rate", e.target.value)
                    }
                    placeholder="مثلاً 7.8"
                    inputMode="decimal"
                    disabled={form.insurance_type === "exempt"}
                    className="h-11 rounded-2xl border-[var(--border)] disabled:opacity-60"
                  />
                </Field>

                <Field label="وضعیت مالیات">
                  <Select
                    value={form.tax_type}
                    onChange={(value) => updateField("tax_type", value)}
                    options={taxOptions}
                  />
                </Field>

                <Field label="درصد مالیات" error={errors.tax_rate}>
                  <Input
                    value={form.tax_rate}
                    onChange={(e) => updateField("tax_rate", e.target.value)}
                    placeholder="مثلاً 10"
                    inputMode="decimal"
                    disabled={form.tax_type === "exempt"}
                    className="h-11 rounded-2xl border-[var(--border)] disabled:opacity-60"
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="توضیحات مالی / حقوقی">
                    <textarea
                      value={form.legal_financial_notes}
                      onChange={(e) =>
                        updateField("legal_financial_notes", e.target.value)
                      }
                      placeholder="ملاحظات حقوقی، تضامین، کسورات، شرایط خاص مالی، نحوه تسویه، بندهای خاص بیمه و مالیات و ..."
                      className="min-h-[120px] w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]"
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-[var(--border)] bg-[var(--surface)] shadow-sm sm:rounded-[28px]">
              <CardHeader className="gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-black sm:text-lg">
                  <Layers3 className="h-5 w-5 text-[var(--brand-hover)]" />
                  فازهای مالی قرارداد
                </CardTitle>

                <Button
                  type="button"
                  onClick={addPhase}
                  className="h-11 rounded-2xl bg-[var(--brand)] px-4 text-[var(--surface-dark)] hover:bg-[var(--brand-hover)]"
                >
                  <Plus className="ml-2 h-4 w-4" />
                  افزودن فاز
                </Button>
              </CardHeader>

              <CardContent className="space-y-4 sm:space-y-5">
                {form.phases.map((phase, index) => {
                  const isFinalPhase = index === form.phases.length - 1;
                  const phaseAmountInWords = getAmountInWords(
                    phase.amount,
                    form.currency,
                  );

                  return (
                    <div
                      key={phase.id}
                      className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-soft)] p-4 sm:rounded-[24px] sm:p-5"
                    >
                      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="rounded-full border-0 bg-[var(--brand-soft)] text-[var(--text-primary)] hover:bg-[var(--brand-soft)]">
                            {isFinalPhase ? "تسویه نهایی" : `فاز ${index + 1}`}
                          </Badge>
                          <span className="text-sm font-semibold text-[var(--text-secondary)]">
                            {isFinalPhase
                              ? "این فاز به‌صورت خودکار به‌عنوان تسویه نهایی در نظر گرفته می‌شود"
                              : "ساختار مالی فاز"}
                          </span>
                        </div>

                        {form.phases.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePhase(phase.id)}
                            className="inline-flex w-fit items-center gap-1 rounded-xl px-3 py-2 text-sm text-[var(--error)] transition hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            حذف
                          </button>
                        )}
                      </div>

                      {isFinalPhase && (
                        <div className="mb-4 overflow-hidden rounded-3xl border border-[color:rgba(245,183,0,0.28)] bg-[var(--brand-soft)] shadow-[0_10px_30px_-18px_rgba(245,183,0,0.45)]">
                          <div className="flex items-start gap-3 p-4 sm:p-5">
                            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand)]/15 ring-1 ring-[color:rgba(245,183,0,0.22)]">
                              <CircleAlert className="h-5 w-5 text-[var(--brand-hover)]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[var(--brand)] px-2.5 py-1 text-[11px] font-bold text-[var(--surface-dark)]">
                                  نکته مهم
                                </span>
                                <h4 className="text-sm font-extrabold text-[var(--text-primary)] sm:text-[15px]">
                                  منطق محاسبه تسویه نهایی
                                </h4>
                              </div>

                              <p className="text-sm leading-7 text-[var(--text-secondary)]">
                                مبلغ این فاز در زمان ثبت قرارداد قطعی نیست و در
                                مرحله صورت‌وضعیت، بر اساس مانده واقعی قرارداد
                                محاسبه می‌شود.
                              </p>

                              <div className="mt-3 rounded-2xl border border-[color:rgba(217,159,0,0.20)] bg-white/75 px-4 py-3 backdrop-blur-sm">
                                <div className="mb-1 text-xs font-semibold tracking-wide text-[var(--text-muted)]">
                                  فرمول محاسبه
                                </div>
                                <div className="text-sm font-black text-[var(--text-primary)] sm:text-[15px]">
                                  تسویه نهایی = مبلغ قرارداد - مجموع دریافت
                                  واقعی ثبت‌شده
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
                        <Field label="عنوان فاز">
                          <Input
                            value={phase.title}
                            onChange={(e) =>
                              updatePhase(phase.id, "title", e.target.value)
                            }
                            placeholder={
                              isFinalPhase
                                ? "مثلاً تسویه نهایی قرارداد"
                                : "مثلاً پیش‌پرداخت یا تجهیز کارگاه"
                            }
                            className="h-11 rounded-2xl border-[var(--border)] bg-[var(--surface)]"
                          />
                        </Field>

                        <Field
                          label="ترتیب فاز"
                          error={errors[`phase-${phase.id}-order`]}
                        >
                          <Input
                            value={phase.order}
                            onChange={(e) =>
                              updatePhase(phase.id, "order", e.target.value)
                            }
                            inputMode="numeric"
                            className="h-11 rounded-2xl border-[var(--border)] bg-[var(--surface)]"
                          />
                        </Field>

                        <Field label="نوع ثبت مبلغ">
                          <Select
                            value={phase.registration_type}
                            onChange={(value) =>
                              updatePhase(phase.id, "registration_type", value)
                            }
                            options={registrationTypeOptions}
                          />
                        </Field>

                        {phase.registration_type === "percentage" ? (
                          <Field
                            label="درصد فاز"
                            error={errors[`phase-${phase.id}-percentage`]}
                          >
                            <Input
                              value={phase.percentage}
                              onChange={(e) =>
                                updatePhase(
                                  phase.id,
                                  "percentage",
                                  e.target.value,
                                )
                              }
                              placeholder={
                                isFinalPhase
                                  ? "درصد نهایی به‌صورت پویا لحاظ می‌شود"
                                  : "مثلاً 20"
                              }
                              inputMode="decimal"
                              disabled={isFinalPhase}
                              className="h-11 rounded-2xl border-[var(--border)] bg-[var(--surface)] disabled:opacity-60"
                            />
                          </Field>
                        ) : (
                          <Field
                            label="مبلغ فاز"
                            error={errors[`phase-${phase.id}-amount`]}
                            hint={
                              phase.amount &&
                              !errors[`phase-${phase.id}-amount`] ? (
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                                  <p className="text-xs font-semibold text-[var(--brand-hover)]">
                                    {formatNumberDisplay(phase.amount)}{" "}
                                    {getCurrencyLabel(form.currency)}
                                  </p>
                                  {phaseAmountInWords ? (
                                    <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                                      {phaseAmountInWords}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null
                            }
                          >
                            <Input
                              value={phase.amount}
                              onChange={(e) =>
                                updatePhase(phase.id, "amount", e.target.value)
                              }
                              placeholder={
                                isFinalPhase
                                  ? "در زمان صورت‌وضعیت محاسبه می‌شود"
                                  : "مثلاً 500000000"
                              }
                              inputMode="numeric"
                              disabled={isFinalPhase}
                              className="h-11 rounded-2xl border-[var(--border)] bg-[var(--surface)] disabled:opacity-60"
                            />
                          </Field>
                        )}

                        {phase.registration_type === "percentage" && (
                          <Field
                            label="مبلغ فاز"
                            error={errors[`phase-${phase.id}-amount`]}
                            hint={
                              phase.amount &&
                              !errors[`phase-${phase.id}-amount`] ? (
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5">
                                  <p className="text-xs font-semibold text-[var(--brand-hover)]">
                                    {formatNumberDisplay(phase.amount)}{" "}
                                    {getCurrencyLabel(form.currency)}
                                  </p>
                                  {phaseAmountInWords ? (
                                    <p className="mt-1 text-xs leading-6 text-[var(--text-secondary)]">
                                      {phaseAmountInWords}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null
                            }
                          >
                            <Input
                              value={phase.amount}
                              onChange={(e) =>
                                updatePhase(phase.id, "amount", e.target.value)
                              }
                              placeholder={
                                isFinalPhase
                                  ? "در زمان صورت‌وضعیت محاسبه می‌شود"
                                  : "در صورت نیاز دستی ثبت شود"
                              }
                              inputMode="numeric"
                              disabled={isFinalPhase}
                              className="h-11 rounded-2xl border-[var(--border)] bg-[var(--surface)] disabled:opacity-60"
                            />
                          </Field>
                        )}

                        <Field label="تاریخ شروع برنامه‌ریزی‌شده">
                          <PersianDateInput
                            value={phase.planned_start_date}
                            onChange={(value) =>
                              updatePhase(phase.id, "planned_start_date", value)
                            }
                            placeholder="تاریخ شروع فاز"
                          />
                        </Field>

                        <Field label="تاریخ پایان برنامه‌ریزی‌شده">
                          <PersianDateInput
                            value={phase.planned_end_date}
                            onChange={(value) =>
                              updatePhase(phase.id, "planned_end_date", value)
                            }
                            placeholder="تاریخ پایان فاز"
                          />
                        </Field>

                        <div className="sm:col-span-2">
                          <Field label="تاریخ سررسید پرداخت / صورت‌وضعیت">
                            <PersianDateInput
                              value={phase.due_date}
                              onChange={(value) =>
                                updatePhase(phase.id, "due_date", value)
                              }
                              placeholder="تاریخ سررسید"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="order-1 space-y-4 xl:order-2 xl:sticky xl:top-6 xl:self-start xl:space-y-6">
            <Card className="rounded-[24px] border-[var(--border)] bg-[var(--surface)] shadow-sm sm:rounded-[28px]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-black sm:text-lg">
                  <ReceiptText className="h-5 w-5 text-[var(--brand-hover)]" />
                  خلاصه مالی قرارداد
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <SummaryItem
                  label="مبلغ قرارداد"
                  value={
                    form.total_amount
                      ? `${formatNumberDisplay(form.total_amount)} ${getCurrencyLabel(form.currency)}`
                      : "—"
                  }
                />
                <SummaryItem
                  label="واحد پول"
                  value={getCurrencyLabel(form.currency)}
                />
                <SummaryItem
                  label="تعداد فازها"
                  value={form.phases.length.toLocaleString("fa-IR")}
                />
                <SummaryItem
                  label="مجموع درصد فازهای عادی"
                  value={`${totals.totalPercentage.toLocaleString("fa-IR")}%`}
                />
                <SummaryItem
                  label="مجموع مبلغ فازهای عادی"
                  value={`${totals.totalPhaseAmount.toLocaleString("fa-IR")} ${getCurrencyLabel(form.currency)}`}
                />
                <SummaryItem
                  label="مانده اولیه برای تسویه نهایی"
                  value={`${totals.preliminaryFinalSettlement.toLocaleString("fa-IR")} ${getCurrencyLabel(form.currency)}`}
                />
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-[var(--border)] bg-[var(--surface)] shadow-sm sm:rounded-[28px]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base font-black sm:text-lg">
                  <ShieldCheck className="h-5 w-5 text-[var(--brand-hover)]" />
                  اعتبارسنجی‌های مهم
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {validations.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-3"
                  >
                    <div className="flex items-start gap-2">
                      <CircleAlert
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          item.ok
                            ? "text-[var(--success)]"
                            : "text-[var(--error)]"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                          {item.label}
                        </p>
                        {item.note ? (
                          <p className="mt-1 text-xs leading-6 text-[var(--text-muted)]">
                            {item.note}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-[24px] border-[var(--border)] bg-[var(--surface)] shadow-sm sm:rounded-[28px]">
              <CardContent className="flex flex-col gap-3 p-4">
                <Button className="h-11 rounded-2xl bg-[var(--brand)] text-[var(--surface-dark)] hover:bg-[var(--brand-hover)]">
                  ثبت قرارداد
                </Button>
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-[var(--border)]"
                >
                  ذخیره پیش‌نویس
                </Button>
              </CardContent>
            </Card>

            <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:rounded-[24px]">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[var(--brand-soft)] p-2">
                  <Sparkles className="h-5 w-5 text-[var(--text-primary)]" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold">یادداشت معماری</p>
                  <p className="text-sm leading-7 text-[var(--text-secondary)]">
                    این فرم فقط ساختار اولیه قرارداد را ثبت می‌کند. ثبت دریافت
                    واقعی، کنترل مانده، و تعیین تسویه نهایی در ماژول صورت‌وضعیت
                    و عملکرد مالی فازها انجام می‌شود.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PersianDateInput({ value, onChange, placeholder }) {
  return (
    <DatePicker
      value={
        value
          ? new DateObject({
              date: value,
              calendar: persian,
              locale: persian_fa,
            })
          : ""
      }
      onChange={(date) => onChange(date ? date.format("YYYY/MM/DD") : "")}
      calendar={persian}
      locale={persian_fa}
      calendarPosition="bottom-right"
      inputClass="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]"
      containerClassName="w-full"
      placeholder={placeholder}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 text-sm outline-none transition focus:ring-2 focus:ring-[var(--brand)]"
    >
      {options.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>
  );
}

function Field({ label, required, children, error, hint }) {
  return (
    <label className="block space-y-2">
      <div className="flex items-center gap-1 text-sm font-semibold text-[var(--text-secondary)]">
        <span>{label}</span>
        {required ? <span className="text-[var(--error)]">*</span> : null}
      </div>
      {children}
      {hint}
      {error ? (
        <p className="text-xs font-medium text-[var(--error)]">{error}</p>
      ) : null}
    </label>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-soft)] px-3 py-2.5">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="text-left font-semibold text-[var(--text-primary)]">
        {value}
      </span>
    </div>
  );
}
