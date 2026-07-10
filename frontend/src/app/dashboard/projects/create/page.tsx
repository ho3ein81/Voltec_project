"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronDown,
  Loader2,
  TriangleAlert,
  Search,
  X,
  Coins,
} from "lucide-react";
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import gregorian_en from "react-date-object/locales/gregorian_en";

import { SectionTitle } from "@/app/components/ui/section-title";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import api from "@/app/components/lib/api";
import { useCompany } from "@/app/components/company/company-provider";
import { useToast } from "@/app/components/ui/use-toast";
import DateObject from "react-date-object";
import { useRouter } from "next/navigation";

type Member = {
  id: number;
  user_first_name: string;
  user_last_name: string;
  user_national_id: string;
  access_level: string;
  department: string | null;
  created_at: string;
};

type FieldErrors = {
  title?: string;
  employer?: string;
  owner?: string;
  budget?: string;
  delivery_time?: string;
  nonField?: string;
};

// تابع کمکی برای تبدیل عدد به حروف فارسی (پشتیبانی تا ۹۹۹ میلیارد)
const numberToPersianWords = (num: number | string): string => {
  const digits = String(num).replace(/[^\d]/g, "");
  if (!digits || digits === "0") return "";

  const parsedNum = parseInt(digits, 10);
  if (isNaN(parsedNum)) return "";

  const MAX_SUPPORTED_NUMBER = 999999999999;
  if (parsedNum > MAX_SUPPORTED_NUMBER) {
    return "مبلغ بیش از حد مجاز است (سقف ۹۹۹ میلیارد تومان)";
  }

  const yekan = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const dahha = [
    "",
    "ده",
    "بیست",
    "سی",
    "چهل",
    "پنجاه",
    "شصت",
    "هفتاد",
    "هشتاد",
    "نود",
  ];
  const dahToNuzdah = [
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
  const sadha = [
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
  const stages = ["", "هزار", "میلیون", "میلیارد"];

  const convertThreeDigits = (n: number): string => {
    if (n === 0) return "";
    let res = "";

    // صدگان
    const sad = Math.floor(n / 100);
    if (sad > 0) res += sadha[sad];

    // دهگان و یکان
    const dahYekan = n % 100;
    if (dahYekan > 0) {
      if (res !== "") res += " و ";
      if (dahYekan >= 10 && dahYekan < 20) {
        res += dahToNuzdah[dahYekan - 10];
      } else {
        const dah = Math.floor(dahYekan / 10);
        const yek = dahYekan % 10;
        if (dah > 0) {
          res += dahha[dah];
          if (yek > 0) res += " و " + yekan[yek];
        } else {
          res += yekan[yek];
        }
      }
    }
    return res;
  };

  let tempNum = parsedNum;
  const parts: string[] = [];
  let stageIdx = 0;

  while (tempNum > 0) {
    const slice = tempNum % 1000;
    if (slice > 0) {
      const word = convertThreeDigits(slice);
      const suffix = stages[stageIdx] ? " " + stages[stageIdx] : "";
      parts.unshift(word + suffix);
    }
    tempNum = Math.floor(tempNum / 1000);
    stageIdx++;
  }

  return parts.join(" و ") + " تومان";
};

const normalizeMembers = (payload: unknown): Member[] => {
  if (Array.isArray(payload)) return payload as Member[];

  if (payload && typeof payload === "object") {
    const data = payload as {
      results?: Member[];
      data?: Member[];
      members?: Member[];
    };

    if (Array.isArray(data.results)) return data.results;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.members)) return data.members;
  }

  return [];
};

const getMemberLabel = (member: Member) => {
  const firstName = member.user_first_name?.trim() || "";
  const lastName = member.user_last_name?.trim() || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || `عضو #${member.id}`;
};

const getReadableErrorMessage = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return "ثبت پروژه با خطا مواجه شد.";
  }

  const err = error as {
    response?: {
      data?: Record<string, unknown>;
    };
  };

  const data = err.response?.data;

  if (!data) return "ثبت پروژه با خطا مواجه شد.";

  const firstErrorValue = (value: unknown): string | undefined => {
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      return typeof first === "string" ? first : undefined;
    }
    return undefined;
  };

  const mappedMessages: Record<string, string> = {
    title: "عنوان پروژه الزامی است.",
    employer: "نام کارفرما الزامی است.",
    owner: "مسئول پروژه الزامی است.",
    budget: "مبلغ بودجه را به‌درستی وارد کنید.",
    delivery_time: "تاریخ تحویل را به‌درستی وارد کنید.",
    non_field_errors: "اطلاعات وارد شده معتبر نیست.",
    detail: "عملیات با خطا مواجه شد.",
  };

  for (const key of Object.keys(data)) {
    const value = data[key];
    const message = firstErrorValue(value);

    if (message) {
      if (
        key === "detail" &&
        message
          .toLowerCase()
          .includes("you do not have permission to perform this action")
      ) {
        return "خطای عدم دسترسی: شما مجوز لازم برای ثبت پروژه را ندارید. این عملیات فقط توسط  مدیرعامل قابل انجام است.";
      }

      return mappedMessages[key] ?? message;
    }
  }

  return "ثبت پروژه با خطا مواجه شد.";
};

const extractFieldErrors = (error: unknown): FieldErrors => {
  if (!error || typeof error !== "object") return {};

  const err = error as {
    response?: {
      data?: Record<string, unknown>;
    };
  };

  const data = err.response?.data;
  if (!data) return {};

  const pick = (key: string) => {
    const value = data[key];
    if (typeof value === "string") return value;
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      return typeof first === "string" ? first : undefined;
    }
    return undefined;
  };

  return {
    title: pick("title"),
    employer: pick("employer"),
    owner: pick("owner"),
    budget: pick("budget"),
    delivery_time: pick("delivery_time"),
    nonField: pick("non_field_errors") || pick("detail") || undefined,
  };
};

const formatBudget = (value: string) => {
  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) return "";
  return Number(digitsOnly).toLocaleString("en-US");
};

const unformatBudget = (value: string) => value.replace(/,/g, "");

const inputBaseClass =
  "h-11 w-full rounded-xl border bg-white px-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:ring-4";

const CreateProjectPage = () => {
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const router = useRouter();
  const [deliveryDateValue, setDeliveryDateValue] = useState<DateObject | null>(null);

  const maxDeliveryDate = useMemo(
    () =>
      new DateObject({
        calendar: persian,
        locale: persian_fa,
        year: 2100,
        month: 12,
        day: 29,
      }),
    [],
  );

  const [formData, setFormData] = useState({
    title: "",
    employer: "",
    owner: "",
    budget: "",
    delivery_time: "",
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const hasActiveCompany = useMemo(
    () => Boolean(activeCompany?.id),
    [activeCompany],
  );

  // محاسبه معادل حروفی مبلغ به صورت بهینه و در لحظه
  const budgetInWords = useMemo(() => {
    const rawVal = unformatBudget(formData.budget);
    return numberToPersianWords(rawVal);
  }, [formData.budget]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!activeCompany?.id) {
        setMembers([]);
        return;
      }

      try {
        setMembersLoading(true);
        setMembersError("");

        const res = await api.get(`/tenants/members/${activeCompany.id}/`);
        const list = normalizeMembers(res.data);

        setMembers(list);
      } catch (err) {
        console.error("Error fetching members:", err);
        setMembersError("خطا در دریافت لیست اعضای شرکت");
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, [activeCompany?.id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    const nextValue = name === "budget" ? formatBudget(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (error) setError("");
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleDeliveryDateChange = (value: any) => {
    if (!value || typeof value !== "object") {
      setDeliveryDateValue(null);

      setFormData((prev) => ({
        ...prev,
        delivery_time: "",
      }));

      if (error) setError("");
      if (fieldErrors.delivery_time) {
        setFieldErrors((prev) => ({
          ...prev,
          delivery_time: undefined,
        }));
      }

      return;
    }

    setDeliveryDateValue(value);

    const dateInGregorian = value.convert(gregorian, gregorian_en);
    const dateValue = dateInGregorian.format("YYYY-MM-DD");

    setFormData((prev) => ({
      ...prev,
      delivery_time: dateValue,
    }));

    if (error) setError("");
    if (fieldErrors.delivery_time) {
      setFieldErrors((prev) => ({
        ...prev,
        delivery_time: undefined,
      }));
    }
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    return members.filter((member) => {
      const label = getMemberLabel(member).toLowerCase();
      return label.includes(searchQuery.toLowerCase());
    });
  }, [members, searchQuery]);

  const selectedMember = useMemo(() => {
    if (!formData.owner) return null;
    return members.find((m) => String(m.id) === formData.owner) || null;
  }, [members, formData.owner]);

  const selectMember = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      owner: String(id),
    }));
    setIsOpen(false);
    setSearchQuery("");

    if (error) setError("");
    if (fieldErrors.owner) {
      setFieldErrors((prev) => ({
        ...prev,
        owner: undefined,
      }));
    }
  };

  const clearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData((prev) => ({
      ...prev,
      owner: "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setFieldErrors({});
    setError("");

    if (
      !formData.title ||
      !formData.employer ||
      !formData.owner ||
      !formData.budget ||
      !formData.delivery_time
    ) {
      const message = "لطفاً تمام فیلدهای الزامی را تکمیل کنید.";

      setError(message);
      toast({
        title: "خطای اعتبارسنجی",
      });
      return;
    }

    if (!activeCompany?.id) {
      const message = "شرکت فعال پیدا نشد. لطفاً ابتدا شرکت را انتخاب کنید.";

      setError(message);
      toast({
        title: "عدم وجود شرکت فعال",
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        employer: formData.employer,
        owner: Number(formData.owner),
        budget: Number(unformatBudget(formData.budget)),
        delivery_time: formData.delivery_time,
        company: activeCompany.id,
      };

      const res = await api.post(`/projects/${activeCompany.id}/`, payload);

      console.log("Project created:", res.data);

      toast({
        title: "پروژه با موفقیت ثبت شد",
      });

      setFormData({
        title: "",
        employer: "",
        owner: "",
        budget: "",
        delivery_time: "",
      });
      setDeliveryDateValue(null);
      router.push("/dashboard/projects");
    } catch (err: any) {
      console.error("Error creating project:", err);

      const serverFieldErrors = extractFieldErrors(err);
      setFieldErrors(serverFieldErrors);

      const message = getReadableErrorMessage(err);
      setError(message);

      toast({
        title: "ثبت پروژه ناموفق بود",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div dir="rtl" className="flex flex-col gap-8">
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-l from-[var(--brand-soft)] via-white to-white p-6 shadow-sm">
        <SectionTitle
          title="ایجاد پروژه"
          description="اطلاعات پروژه جدید را وارد کنید"
        />
      </div>

      <Card className="overflow-visible rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardHeader className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-6 py-5">
          <CardTitle className="flex items-center gap-3 pb-5 text-lg font-bold text-[var(--text-primary)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-black text-[var(--surface-dark)]">
              ۱
            </span>
            مشخصات پروژه
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6 py-6 md:px-8 md:py-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            {error && (
              <div className="mx-auto flex max-w-2xl items-start justify-between gap-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
                <div className="flex items-start gap-3">
                  <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold">خطا در ثبت پروژه</p>
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            )}

            {membersError && (
              <div className="mx-auto flex max-w-2xl items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-sm">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-bold">هشدار</p>
                    <p>{membersError}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  عنوان پروژه
                  <span className="mr-1 text-[var(--error)]">*</span>
                </label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="مثلاً پروژه توسعه پست برق"
                  className={`${inputBaseClass} ${
                    fieldErrors.title
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-[var(--border)] focus:border-[var(--brand)] focus:ring-[var(--brand-soft)]"
                  }`}
                />
                {fieldErrors.title && (
                  <p className="text-xs font-medium text-red-600">
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  کارفرما
                  <span className="mr-1 text-[var(--error)]">*</span>
                </label>
                <input
                  name="employer"
                  value={formData.employer}
                  onChange={handleChange}
                  placeholder="نام کارفرما را وارد کنید"
                  className={`${inputBaseClass} ${
                    fieldErrors.employer
                      ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                      : "border-[var(--border)] focus:border-[var(--brand)] focus:ring-[var(--brand-soft)]"
                  }`}
                />
                {fieldErrors.employer && (
                  <p className="text-xs font-medium text-red-600">
                    {fieldErrors.employer}
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  مسئول پروژه
                  <span className="mr-1 text-[var(--error)]">*</span>
                </label>

                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      if (hasActiveCompany && !membersLoading) {
                        setIsOpen(!isOpen);
                      }
                    }}
                    disabled={!hasActiveCompany || membersLoading}
                    className={`flex h-11 w-full items-center justify-between rounded-xl border bg-white px-4 text-sm text-[var(--text-primary)] outline-none transition-all focus:ring-4 focus:ring-[var(--brand-soft)] disabled:cursor-not-allowed disabled:bg-[var(--surface-soft)] ${
                      fieldErrors.owner
                        ? "border-red-300"
                        : "border-[var(--border)] hover:border-[var(--brand)]"
                    }`}
                  >
                    <span
                      className={
                        !selectedMember ? "text-[var(--text-muted)]" : ""
                      }
                    >
                      {membersLoading
                        ? "در حال دریافت اعضا..."
                        : !hasActiveCompany
                          ? "ابتدا شرکت را انتخاب کنید"
                          : selectedMember
                            ? getMemberLabel(selectedMember)
                            : "انتخاب مسئول پروژه"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {selectedMember && (
                        <span
                          onClick={clearSelection}
                          className="rounded-full p-0.5 hover:bg-[var(--surface-dark)] hover:text-white transition-colors"
                        >
                          <X className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                        </span>
                      )}
                      <ChevronDown
                        className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-[var(--border)] bg-white p-2 shadow-lg animate-in fade-in-50 slide-in-from-top-1">
                      <div className="relative mb-2">
                        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="جستجوی نام مسئول..."
                          className="h-9 w-full rounded-lg border border-[var(--border)] pr-9 pl-3 text-xs outline-none focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand-soft)]"
                          autoFocus
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-0.5">
                        {filteredMembers.length > 0 ? (
                          filteredMembers.map((member) => (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => selectMember(member.id)}
                              className={`w-full rounded-lg px-3 py-2 text-right text-xs transition-colors hover:bg-[var(--brand-soft)] hover:text-[var(--brand-hover)] ${
                                formData.owner === String(member.id)
                                  ? "bg-[var(--brand-soft)] font-semibold text-[var(--brand-hover)]"
                                  : "text-[var(--text-primary)]"
                              }`}
                            >
                              {getMemberLabel(member)}
                            </button>
                          ))
                        ) : (
                          <div className="py-3 text-center text-xs text-[var(--text-muted)]">
                            موردی یافت نشد.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {fieldErrors.owner && (
                  <p className="text-xs font-medium text-red-600">
                    {fieldErrors.owner}
                  </p>
                )}
              </div>

              {/* بخش بودجه به همراه نمایش معادل حروفی */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  بودجه پروژه
                  <span className="mr-1 text-[var(--error)]">*</span>
                </label>
                <div className="relative">
                  <input
                    name="budget"
                    type="text"
                    inputMode="numeric"
                    value={formData.budget}
                    onChange={handleChange}
                    placeholder="مثلاً 500,000,000"
                    className={`${inputBaseClass} pl-10 ${
                      fieldErrors.budget
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-[var(--border)] focus:border-[var(--brand)] focus:ring-[var(--brand-soft)]"
                    }`}
                  />
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--text-muted)]">
                    تومان
                  </span>
                </div>

                {/* نمایش پویای معادل حروفی مبلغ با افکت نرم */}
                {budgetInWords && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-soft)] px-3.5 py-2 text-xs font-medium text-[var(--brand-hover)] animate-in fade-in duration-200">
                    <Coins className="h-4 w-4 shrink-0" />
                    <span>{budgetInWords}</span>
                  </div>
                )}

                {fieldErrors.budget && (
                  <p className="text-xs font-medium text-red-600">
                    {fieldErrors.budget}
                  </p>
                )}
              </div>

              <div className="space-y-3 md:col-span-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  تاریخ تحویل
                  <span className="mr-1 text-[var(--error)]">*</span>
                </label>

                <div className="relative">
                  <DatePicker
                    value={deliveryDateValue}
                    onChange={handleDeliveryDateChange}
                    calendar={persian}
                    locale={persian_fa}
                    calendarPosition="bottom-right"
                    format="YYYY-MM-DD"
                    maxDate={maxDeliveryDate}
                    inputClass={`${inputBaseClass} pl-11 ${
                      fieldErrors.delivery_time
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-[var(--border)] focus:border-[var(--brand)] focus:ring-[var(--brand-soft)]"
                    }`}
                    containerClassName="w-full"
                    placeholder="تاریخ تحویل را انتخاب کنید"
                  />
                  <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                </div>

                {fieldErrors.delivery_time && (
                  <p className="text-xs font-medium text-red-600">
                    {fieldErrors.delivery_time}
                  </p>
                )}
              </div>
            </div>

            {/* {fieldErrors.nonField && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {fieldErrors.nonField}
              </div>
            )} */}

            <div className="flex justify-end border-t border-[var(--border)] pt-6">
              <Button
                type="submit"
                disabled={submitting || membersLoading}
                className="h-11 rounded-xl bg-[var(--brand)] px-7 font-bold text-[var(--surface-dark)] transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    در حال ثبت...
                  </span>
                ) : (
                  "ثبت پروژه"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProjectPage;
