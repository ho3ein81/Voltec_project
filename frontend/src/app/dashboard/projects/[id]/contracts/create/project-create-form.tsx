"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  FileBadge2,
  FileText,
  Landmark,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import api from "@/app/components/lib/api";
import { useCompany } from "@/app/components/company/company-provider";

// ایمپورت کتابخانه‌های تقویم شمسی
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

type ProjectResponse = {
  title?: string;
  code?: string;
  employer?: string;
  budget?: number | string;
  company_name?: string;
  company_national_id?: string;
  delivery_time?: string | number;
  owner_first_name?: string | null;
  owner_last_name?: string | null;
};

function threeDigitsToWords(num: number): string {
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

  const parts: string[] = [];

  const h = Math.floor(num / 100);
  const remainder = num % 100;

  if (h > 0) {
    parts.push(hundreds[h]);
  }

  if (remainder >= 10 && remainder < 20) {
    parts.push(teens[remainder - 10]);
  } else {
    const t = Math.floor(remainder / 10);
    const o = remainder % 10;

    if (t > 0) {
      parts.push(tens[t]);
    }

    if (o > 0) {
      parts.push(ones[o]);
    }
  }

  return parts.join(" و ");
}

function numberToPersianWords(value: unknown): string {
  const num = toNumber(value);

  if (!num) return "صفر تومان";

  const units = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];
  const parts: string[] = [];
  let remainder = Math.floor(num);
  let unitIndex = 0;

  while (remainder > 0 && unitIndex < units.length) {
    const chunk = remainder % 1000;

    if (chunk > 0) {
      const chunkText = threeDigitsToWords(chunk);
      const unit = units[unitIndex];
      parts.unshift(unit ? `${chunkText} ${unit}` : chunkText);
    }

    remainder = Math.floor(remainder / 1000);
    unitIndex += 1;
  }

  return `${parts.join(" و ")} تومان`;
}

// تبدیل تاریخ میلادی به شمسی برای نمایش در جزئیات پروژه
function convertToPersianDate(
  dateString: string | number | undefined | null,
): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch (e) {
    return String(dateString);
  }
}

function normalizeDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function formatNumericInput(value: string): string {
  const normalized = normalizeDigits(value);
  const digits = normalized.replace(/[^\d]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("en-US");
}

function toNumber(val: unknown): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;

  const normalized = normalizeDigits(String(val));
  const cleaned = normalized
    .replace(/[^\d.-]/g, "")
    .replace(/,/g, "")
    .trim();
  const n = Number(cleaned);

  return Number.isFinite(n) ? n : 0;
}

function formatToman(amount: unknown): string {
  const n = toNumber(amount);
  return n.toLocaleString("fa-IR");
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function extractApiError(err: any): string {
  const data = err?.response?.data;

  if (!data) {
    return err?.message ?? "درخواست با خطا مواجه شد";
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (
    Array.isArray(data?.non_field_errors) &&
    data.non_field_errors.length > 0
  ) {
    return data.non_field_errors.join(" ");
  }

  const fieldErrors = Object.entries(data).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((item) => `${key}: ${String(item)}`);
    }
    if (typeof value === "string") {
      return `${key}: ${value}`;
    }
    return [];
  });

  if (fieldErrors.length > 0) {
    return fieldErrors.join(" | ");
  }

  return err?.message ?? "درخواست با خطا مواجه شد";
}

export default function ContractCreateForm() {
  const router = useRouter();
  const params = useParams();
  const { activeCompany } = useCompany();

  const projectId = params?.id as string;
  const joinId = activeCompany?.id;

  const [project, setProject] = useState<ProjectResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ذخیره‌سازی تاریخ به صورت میلادی YYYY-MM-DD جهت ارسال به بک‌اند
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // مدیریت مقدار ورودی برای آبجکت‌های DatePicker
  const [startPickerValue, setStartPickerValue] = useState<DateObject | null>(
    null,
  );
  const [endPickerValue, setEndPickerValue] = useState<DateObject | null>(null);

  const [amount, setAmount] = useState("");
  const [isInsurance, setIsInsurance] = useState(false);
  const [insuranceAmount, setInsuranceAmount] = useState("");
  const [isTax, setIsTax] = useState(false);
  const [taxAmount, setTaxAmount] = useState("");

  const [isClient, setIsClient] = useState(false);

  const canSubmit =
    Boolean(joinId) && Boolean(projectId) && projectId !== "undefined";

  // جلوگیری از خطای ناسازگاری رندر سمت سرور و کلاینت
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const fetchProjectDetail = async () => {
      if (!projectId || projectId === "undefined" || !joinId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await api.get(`/projects/${joinId}/${projectId}/`);
        const data: ProjectResponse = response?.data ?? {};
        setProject(data);
      } catch (err: any) {
        console.error("خطا در دریافت جزئیات پروژه:", err);
        setError(extractApiError(err));
        setProject(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetail();
  }, [projectId, joinId]);

  useEffect(() => {
    if (!isInsurance) {
      setInsuranceAmount("");
    }
  }, [isInsurance]);

  useEffect(() => {
    if (!isTax) {
      setTaxAmount("");
    }
  }, [isTax]);

  // کنترل تغییر تاریخ شروع و تبدیل به میلادی
  const handleStartDateChange = (date: DateObject | null) => {
    setStartPickerValue(date);
    if (date) {
      // شبیه‌سازی تبدیل به میلادی
      const gregorianDate = new DateObject(date).convert(
        gregorian,
        gregorian_en,
      );
      setStartDate(gregorianDate.format("YYYY-MM-DD"));
    } else {
      setStartDate("");
    }
  };

  // کنترل تغییر تاریخ پایان و تبدیل به میلادی
  const handleEndDateChange = (date: DateObject | null) => {
    setEndPickerValue(date);
    if (date) {
      const gregorianDate = new DateObject(date).convert(
        gregorian,
        gregorian_en,
      );
      setEndDate(gregorianDate.format("YYYY-MM-DD"));
    } else {
      setEndDate("");
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!joinId || !projectId || projectId === "undefined") {
      setError("پارامترهای لازم برای ثبت قرارداد کامل نیست.");
      return;
    }

    const today = getTodayString();
    const amountValue = toNumber(amount);
    const insuranceValue = toNumber(insuranceAmount);
    const taxValue = toNumber(taxAmount);

    if (!startDate || !endDate) {
      setError("تاریخ شروع و پایان قرارداد الزامی است.");
      return;
    }

    if (startDate < today) {
      setError("زمان شروع قرارداد نامعتبر می‌باشد.");
      return;
    }

    if (endDate < startDate) {
      setError("زمان پایان قرارداد اشتباه است.");
      return;
    }

    if (amountValue <= 0) {
      setError("مبلغ قرارداد باید بیشتر از صفر باشد.");
      return;
    }

    if (isInsurance && insuranceValue <= 0) {
      setError("لطفا مبلغ بیمه را مشخص کنید.");
      return;
    }

    if (isTax && taxValue <= 0) {
      setError("لطفا مبلغ مالیات را مشخص کنید.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload = {
      project: projectId,
      start_date: startDate,
      end_date: endDate,
      amount: amountValue,
      is_insurance: isInsurance,
      insurance_amount: isInsurance ? insuranceValue : 0,
      is_tax: isTax,
      tax_amount: isTax ? taxValue : 0,
    };

    try {
      await api.post(`/contracts/${joinId}/${projectId}/`, payload);
      setSuccess("قرارداد با موفقیت ثبت شد.");
      router.push(`/dashboard/projects/${projectId}/contracts/create`);
    } catch (err: any) {
      console.error("خطا در ثبت قرارداد:", err);
      setError(extractApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setStartDate("");
    setEndDate("");
    setStartPickerValue(null);
    setEndPickerValue(null);
    setAmount("");
    setIsInsurance(false);
    setInsuranceAmount("");
    setIsTax(false);
    setTaxAmount("");
    setError(null);
    setSuccess(null);
  }

  if (loading || !joinId) {
    return (
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 inline-block h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            در حال بارگذاری اطلاعات پروژه...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-hover)] shadow-inner">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[var(--text-primary)]">
                ایجاد قرارداد جدید
              </h1>
              <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                اطلاعات پروژه از API خوانده می‌شود و سپس قرارداد ثبت می‌گردد.
              </p>
              <p className="mt-2 text-[11px] font-bold text-[var(--text-muted)] opacity-70">
                Project ID: {projectId}
              </p>
            </div>
          </div>

          <div className="w-fit rounded-2xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-4 py-2 text-xs font-bold text-[var(--brand-hover)]">
            فرم ثبت قرارداد
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-[var(--error)]/20 bg-[var(--error)]/5 px-5 py-4 shadow-sm">
          <p className="text-sm font-bold text-[var(--error)]">
            خطا در ثبت یا دریافت اطلاعات
          </p>
          <p className="mt-1 text-xs font-medium text-[var(--error)]/90">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="rounded-3xl border border-[var(--success)]/20 bg-[var(--success)]/5 px-5 py-4 shadow-sm">
          <p className="text-sm font-bold text-[var(--success)]">عملیات موفق</p>
          <p className="mt-1 text-xs font-medium text-[var(--success)]/90">
            {success}
          </p>
        </div>
      )}

      <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-[var(--border)]/60 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-soft)] text-[var(--brand-hover)]">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)]">
              اطلاعات پروژه
            </h2>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              داده‌های این بخش از API پروژه دریافت شده‌اند
            </p>
          </div>
        </div>

        {project ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <InfoRow
              label="عنوان پروژه"
              value={project.title}
              icon={<FileText className="h-4 w-4" />}
            />
            <InfoRow
              label="کد پروژه"
              value={project.code}
              icon={<FileBadge2 className="h-4 w-4" />}
            />
            <InfoRow
              label="کارفرما"
              value={project.employer}
              icon={<BriefcaseBusiness className="h-4 w-4" />}
            />
            <InfoRow
              label="بودجه"
              value={
                project.budget !== undefined && project.budget !== null
                  ? `${formatToman(project.budget)} تومان`
                  : "-"
              }
              icon={<Wallet className="h-4 w-4" />}
            />
            <InfoRow
              label="نام شرکت"
              value={project.company_name}
              icon={<Building2 className="h-4 w-4" />}
            />
            <InfoRow
              label="شناسه ملی شرکت"
              value={project.company_national_id}
              icon={<Landmark className="h-4 w-4" />}
            />
            <InfoRow
              label="زمان تحویل"
              value={convertToPersianDate(project.delivery_time)}
              icon={<CalendarDays className="h-4 w-4" />}
            />
            <InfoRow
              label="مسئول پروژه"
              value={
                `${project.owner_first_name ?? ""} ${
                  project.owner_last_name ?? ""
                }`.trim() || "-"
              }
              icon={<ShieldCheck className="h-4 w-4" />}
            />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)]/70 p-8 text-center">
            <p className="text-sm font-medium text-[var(--text-muted)]">
              اطلاعات پروژه در دسترس نیست.
            </p>
          </div>
        )}
      </section>

      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
      >
        <div className="mb-6 flex items-center gap-3 border-b border-[var(--border)]/60 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-hover)]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)]">
              اطلاعات قرارداد
            </h2>
            <p className="text-xs font-medium text-[var(--text-secondary)]">
              داده‌های مالی و حقوقی قرارداد را تکمیل کنید
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field label="تاریخ شروع قرارداد">
            {isClient ? (
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={startPickerValue}
                onChange={handleStartDateChange}
                calendarPosition="bottom-right"
                inputClass="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                containerClassName="w-full"
                placeholder="انتخاب تاریخ شروع"
              />
            ) : (
              <div className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] animate-pulse" />
            )}
          </Field>

          <Field label="تاریخ پایان قرارداد">
            {isClient ? (
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                value={endPickerValue}
                onChange={handleEndDateChange}
                calendarPosition="bottom-right"
                inputClass="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                containerClassName="w-full"
                placeholder="انتخاب تاریخ پایان"
              />
            ) : (
              <div className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] animate-pulse" />
            )}
          </Field>

          <Field label="مبلغ قرارداد">
            <div className="space-y-2">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(formatNumericInput(e.target.value))}
                placeholder="مثال: ۱۲,۰۰۰,۰۰۰"
                className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-left font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 [direction:ltr]"
                required
              />

              <div className="rounded-xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-3 py-2 text-xs font-bold text-[var(--brand-hover)]">
                پیش‌نمایش مبلغ: {formatToman(amount)} تومان
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
                مبلغ به حروف: {numberToPersianWords(amount)}
              </div>
            </div>
          </Field>

          <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface-soft)]/70 p-4">
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <label className="mb-3 flex cursor-pointer items-center gap-3 text-sm font-bold text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={isInsurance}
                    onChange={(e) => setIsInsurance(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--brand)]"
                  />
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[var(--success)]" />
                    مشمول بیمه
                  </span>
                </label>

                <Field label="مبلغ بیمه">
                  <div className="space-y-2">
                    <input
                      type="text"
                      disabled={!isInsurance}
                      value={insuranceAmount}
                      onChange={(e) =>
                        setInsuranceAmount(formatNumericInput(e.target.value))
                      }
                      placeholder="مبلغ بیمه"
                      className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-left font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 [direction:ltr] disabled:bg-[var(--surface-soft)] disabled:opacity-50"
                    />

                    <div className="rounded-xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-3 py-2 text-xs font-bold text-[var(--brand-hover)]">
                      پیش‌نمایش مبلغ بیمه: {formatToman(insuranceAmount)} تومان
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
                      مبلغ بیمه به حروف: {numberToPersianWords(insuranceAmount)}
                    </div>
                  </div>
                </Field>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <label className="mb-3 flex cursor-pointer items-center gap-3 text-sm font-bold text-[var(--text-primary)]">
                  <input
                    type="checkbox"
                    checked={isTax}
                    onChange={(e) => setIsTax(e.target.checked)}
                    className="h-4 w-4 rounded border-[var(--border)] accent-[var(--brand)]"
                  />
                  <span className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-[var(--info)]" />
                    مشمول مالیات
                  </span>
                </label>

                <Field label="مبلغ مالیات">
                  <div className="space-y-2">
                    <input
                      type="text"
                      disabled={!isTax}
                      value={taxAmount}
                      onChange={(e) =>
                        setTaxAmount(formatNumericInput(e.target.value))
                      }
                      placeholder="مبلغ مالیات"
                      className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-left font-medium text-[var(--text-primary)] outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10 [direction:ltr] disabled:bg-[var(--surface-soft)] disabled:opacity-50"
                    />

                    <div className="rounded-xl border border-[var(--brand)]/20 bg-[var(--brand-soft)] px-3 py-2 text-xs font-bold text-[var(--brand-hover)]">
                      پیش‌نمایش مبلغ مالیات: {formatToman(taxAmount)} تومان
                    </div>

                    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-medium text-[var(--text-secondary)]">
                      مبلغ مالیات به حروف: {numberToPersianWords(taxAmount)}
                    </div>
                  </div>
                </Field>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-[var(--border)]/60 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={handleReset}
            className="h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 text-sm font-bold text-[var(--text-secondary)] transition-all hover:bg-[var(--surface-soft)] disabled:opacity-60"
            disabled={submitting}
          >
            ریست فرم
          </button>

          <button
            type="submit"
            className="h-12 rounded-2xl bg-[var(--surface-dark)] px-6 text-sm font-bold text-[var(--text-on-dark)] transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting || loading || !canSubmit}
          >
            {submitting ? "در حال ثبت..." : "ثبت قرارداد"}
          </button>
        </div>
      </form>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)]/60 p-4 transition-all hover:bg-[var(--surface-soft)]">
      <div className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-muted)]">
        <span className="text-[var(--brand-hover)]">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="mt-2 text-sm font-black text-[var(--text-primary)]">
        {value ?? "-"}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-[var(--text-secondary)]">
        {label}
      </label>
      {children}
    </div>
  );
}
