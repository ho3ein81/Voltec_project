"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { SectionTitle } from "@/app/components/ui/section-title";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import api from "../../../../components/lib/api";
import { AxiosResponse } from "axios";
import {
  ArrowRight,
  Save,
  X,
  Loader2,
  Building2,
  MapPin,
  FileText,
  CheckCircle2,
  Edit2,
  AlertCircle,
  Trash2,
} from "lucide-react";

// ---------- Types ----------
type Province = {
  id: number;
  name: string;
};

type City = {
  id: number;
  name: string;
  province?: number;
};

type PaginatedResponse<T> = {
  count?: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
};

type CompanyRequestDetail = {
  id: number;
  created_at?: string;
  reviewed_at?: string | null;

  company_name: string;
  company_national_id: string;
  company_registration_number: string;
  company_description: string;
  type_company: string;

  company_address?: string;
  company_phone?: string;

  company_province: number | null;
  company_city: number | null;
  company_province_name?: string;
  company_city_name?: string;

  status: string;
  reject_reason?: string | null;

  requester_first_name?: string;
  requester_last_name?: string;
};

const EDITABLE_STATUS = "در حال بررسی";

// ---------- Helpers ----------
const COMPANY_TYPES = [
  { value: "public_joint_stock", label: "سهامی عام" },
  { value: "private_joint_stock", label: "سهامی خاص" },
  { value: "llc", label: "مسئولیت محدود" },
  { value: "solidarity", label: "تضامنی" },
  { value: "proportional", label: "نسبی" },
  { value: "mixed_joint_stock", label: "مختلط سهامی" },
  { value: "mixed_non_joint_stock", label: "مختلط غیرسهامی" },
  { value: "cooperative", label: "تعاونی" },
];

const getCompanyTypeValue = (typeStr: string | undefined | null): string => {
  if (!typeStr) return "";
  const found = COMPANY_TYPES.find(
    (t) => t.value === typeStr || t.label === typeStr
  );
  return found ? found.value : "";
};

export default function CompanyRequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // ---------- States ----------
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(
    searchParams.get("edit") === "true",
  );

  const [data, setData] = useState<CompanyRequestDetail | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [error, setError] = useState<string>("");

  const canEdit = useMemo(() => {
    return data?.status === EDITABLE_STATUS;
  }, [data]);

  // ---------- Data Fetching ----------
  const fetchCities = async (provinceId: number) => {
    if (!provinceId) {
      setCities([]);
      return;
    }

    try {
      let allCities: City[] = [];
      let nextUrl: string | null = `/core/cities/${provinceId}/`;

      while (nextUrl) {
        const cleanUrl: string = nextUrl.includes("http") 
          ? nextUrl.split("/api/v1")[1] || nextUrl 
          : nextUrl;

        const res: AxiosResponse<PaginatedResponse<City> | City[]> = await api.get(cleanUrl);
        const resData = res.data;

        if (Array.isArray(resData)) {
          allCities = [...allCities, ...resData];
          nextUrl = null;
        } else if (resData && typeof resData === "object" && "results" in resData) {
          allCities = [...allCities, ...resData.results];
          nextUrl = resData.next || null;
        } else {
          nextUrl = null;
        }
      }

      setCities(allCities);
    } catch (error) {
      console.error("Error fetching cities:", error);
      setCities([]);
    }
  };

  const fetchProvinces = async () => {
    try {
      let allProvinces: Province[] = [];
      let nextUrl: string | null = "/core/provinces/";

      while (nextUrl) {
        const cleanUrl: string = nextUrl.includes("http") 
          ? nextUrl.split("/api/v1")[1] || nextUrl 
          : nextUrl;

        const res: AxiosResponse<PaginatedResponse<Province> | Province[]> = await api.get(cleanUrl);
        const resData = res.data;

        if (Array.isArray(resData)) {
          allProvinces = [...allProvinces, ...resData];
          nextUrl = null;
        } else if (resData && typeof resData === "object" && "results" in resData) {
          allProvinces = [...allProvinces, ...resData.results];
          nextUrl = resData.next || null;
        } else {
          nextUrl = null;
        }
      }

      setProvinces(allProvinces);
    } catch (error) {
      console.error("Error fetching provinces:", error);
      setProvinces([]);
    }
  };

  const fetchDetails = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get(
        `/user_requests/company-registration-request/${id}/`,
      );

      const result = res.data as CompanyRequestDetail;

      if (result) {
        result.type_company = getCompanyTypeValue(result.type_company);
      }

      setData(result);

      if (result.company_province) {
        await fetchCities(result.company_province);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error("Error fetching details:", error);
      setError("خطا در دریافت اطلاعات درخواست");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;

    fetchDetails();
    fetchProvinces();
  }, [id]);

  useEffect(() => {
    setIsEditMode(searchParams.get("edit") === "true");
  }, [searchParams]);

  // ---------- Handlers ----------
  const handleProvinceChange = async (provinceId: number) => {
    if (!data) return;

    if (!provinceId) {
      setData({
        ...data,
        company_province: null,
        company_city: null,
        company_province_name: "",
        company_city_name: "",
      });

      setCities([]);
      return;
    }

    setData({
      ...data,
      company_province: provinceId,
      company_city: null,
      company_city_name: "",
    });

    await fetchCities(provinceId);
  };

  const handleSave = async () => {
    if (!data) return;

    if (!canEdit) {
      setError("این درخواست در وضعیت فعلی قابل ویرایش نیست.");
      return;
    }

    if (!data.company_name?.trim()) {
      setError("نام شرکت الزامی است.");
      return;
    }

    if (!data.company_national_id?.trim()) {
      setError("شناسه ملی الزامی است.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = {
        company_name: data.company_name,
        company_national_id: data.company_national_id,
        company_registration_number: data.company_registration_number,
        company_description: data.company_description,
        type_company: getCompanyTypeValue(data.type_company),
        company_address: data.company_address ?? "",
        company_phone: data.company_phone ?? "",
        company_province: data.company_province,
        company_city: data.company_city,
      };

      await api.patch(
        `/user_requests/company-registration-request/${id}/`,
        payload,
      );

      setIsEditMode(false);
      router.replace(`/dashboard/projects/user-list/${id}`);

      await fetchDetails();
    } catch (error) {
      console.error("Error updating request:", error);
      setError("خطا در ذخیره‌سازی تغییرات");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError("");
      
      // فراخوانی متد DELETE به روت بک‌اند شما
      await api.delete(`/user_requests/company-registration-request/${id}/`);
      
      // ریدایرکت به لیست درخواست‌ها پس از حذف موفقیت‌آمیز
      router.push("/dashboard/projects/user-list");
    } catch (err) {
      console.error("Error deleting request:", err);
      setError("خطا در حذف درخواست. لطفاً دوباره تلاش کنید.");
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelEdit = async () => {
    setIsEditMode(false);
    router.replace(`/dashboard/projects/user-list/${id}`);
    await fetchDetails();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "در حال بررسی":
        return "bg-amber-50 text-amber-600 border border-amber-200/60";
      case "تایید شده":
        return "bg-emerald-50 text-emerald-600 border border-emerald-200/60";
      case "تایید نشده":
        return "bg-red-50 text-red-600 border border-red-200/60";
      default:
        return "bg-stone-50 text-stone-600 border border-stone-200/60";
    }
  };

  // ---------- Render States ----------
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)]" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
        <AlertCircle className="h-5 w-5 shrink-0" />
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-[var(--text-secondary)]">
        درخواست مورد نظر یافت نشد.
      </div>
    );
  }

  const inputClass =
    "flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm transition-colors focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex flex-col gap-6 text-[var(--text-primary)] relative">
      
      {/* Modal تایید حذف پیشرفته */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl animate-in fade-in zoom-in-95 duration-250">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-[var(--text-primary)]">حذف درخواست ثبت شرکت</h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  آیا از حذف درخواست شرکت <strong className="text-[var(--text-primary)]">{data.company_name}</strong> مطمئن هستید؟ این عملیات غیرقابل بازگشت است.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                
                className="rounded-xl border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
                disabled={isDeleting}
                onClick={() => setShowDeleteConfirm(false)}
              >
                انصراف
              </Button>
              <Button
                className="rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    در حال حذف...
                  </>
                ) : (
                  "حذف درخواست"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl border border-[var(--border)] hover:bg-[var(--surface-soft)]"
            onClick={() => router.push("/dashboard/projects/user-list")}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>

          <SectionTitle
            title={
              isEditMode ? `ویرایش ${data.company_name}` : data.company_name
            }
            description="جزئیات درخواست ثبت شرکت و اطلاعات حقوقی مربوطه"
          />
        </div>

        <div className="flex items-center gap-2">
          {isEditMode ? (
            <>
              <Button
                className="rounded-xl border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
                onClick={handleCancelEdit}
                disabled={saving}
              >
                <X className="ml-2 h-4 w-4" />
                انصراف
              </Button>

              <Button
                className="rounded-xl bg-[var(--brand)] text-[var(--sidebar-bg)] hover:bg-[var(--brand-hover)] font-medium"
                onClick={handleSave}
                disabled={saving || !canEdit}
              >
                {saving ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="ml-2 h-4 w-4" />
                )}
                ذخیره تغییرات
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              {canEdit && (
                <>
                  <Button
                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="ml-2 h-4 w-4" />
                    حذف درخواست
                  </Button>
                  <Button
                    className="rounded-xl bg-[var(--brand)] text-[var(--sidebar-bg)] hover:bg-[var(--brand-hover)] font-medium"
                    onClick={() => {
                      setIsEditMode(true);
                      router.replace(`/dashboard/projects/user-list/${id}?edit=true`);
                    }}
                  >
                    <Edit2 className="ml-2 h-4 w-4" />
                    ویرایش اطلاعات
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/50 p-4 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Details Area */}
        <Card className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-none lg:col-span-2">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Company Name */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <Building2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  نام شرکت
                </label>

                {isEditMode ? (
                  <Input
                    className={inputClass}
                    value={data.company_name ?? ""}
                    onChange={(e) =>
                      setData({ ...data, company_name: e.target.value })
                    }
                  />
                ) : (
                  <p className="min-h-10 flex items-center text-sm font-medium">{data.company_name || "-"}</p>
                )}
              </div>

              {/* Company Type */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <Building2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  نوع شرکت
                </label>

                {isEditMode ? (
                  <select
                    className={inputClass}
                    value={data.type_company}
                    onChange={(e) =>
                      setData({ ...data, type_company: e.target.value })
                    }
                  >
                    <option value="">انتخاب نوع شرکت...</option>
                    {COMPANY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="min-h-10 flex items-center text-sm font-medium">
                    {COMPANY_TYPES.find((t) => t.value === data.type_company)?.label || data.type_company || "-"}
                  </p>
                )}
              </div>

              {/* National ID */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  شناسه ملی
                </label>

                {isEditMode ? (
                  <Input
                    className={inputClass}
                    value={data.company_national_id ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        company_national_id: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="min-h-10 flex items-center text-sm font-mono tracking-wider">{data.company_national_id || "-"}</p>
                )}
              </div>

              {/* Registration Number */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  شماره ثبت
                </label>

                {isEditMode ? (
                  <Input
                    className={inputClass}
                    value={data.company_registration_number ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        company_registration_number: e.target.value,
                      })
                    }
                  />
                ) : (
                  <p className="min-h-10 flex items-center text-sm font-mono">{data.company_registration_number || "-"}</p>
                )}
              </div>

              {/* Province Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  استان
                </label>

                {isEditMode ? (
                  <select
                    className={inputClass}
                    value={data.company_province ?? ""}
                    onChange={(e) =>
                      handleProvinceChange(
                        e.target.value ? Number(e.target.value) : 0,
                      )
                    }
                  >
                    <option value="">انتخاب استان...</option>
                    {provinces.map((province) => (
                      <option key={province.id} value={province.id}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="min-h-10 flex items-center text-sm font-medium">{data.company_province_name || "-"}</p>
                )}
              </div>

              {/* City Selector */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  شهر
                </label>

                {isEditMode ? (
                  <select
                    className={inputClass}
                    value={data.company_city ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        company_city: e.target.value
                          ? Number(e.target.value)
                          : null,
                      })
                    }
                    disabled={!data.company_province}
                  >
                    <option value="">انتخاب شهر...</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="min-h-10 flex items-center text-sm font-medium">{data.company_city_name || "-"}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
                  <FileText className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                  توضیحات فعالیت
                </label>

                {isEditMode ? (
                  <textarea
                    className="flex min-h-[120px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-2 text-sm transition-colors focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] resize-none"
                    value={data.company_description ?? ""}
                    onChange={(e) =>
                      setData({
                        ...data,
                        company_description: e.target.value,
                      })
                    }
                  />
                ) : (
                  <div className="rounded-xl bg-[var(--surface-soft)] p-4 text-sm leading-relaxed text-[var(--text-secondary)] border border-[var(--border)]/40">
                    {data.company_description || "-"}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Info & Controls */}
        <div className="space-y-6">
          {/* Status Box */}
          <Card className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-none">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">وضعیت درخواست</h3>

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">وضعیت فعلی:</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                      data.status,
                    )}`}
                  >
                    {data.status || "-"}
                  </span>
                </div>

                {data.reject_reason && (
                  <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5 text-xs text-red-600">
                    <span className="mb-1 block font-semibold">
                      دلیل رد درخواست:
                    </span>
                    {data.reject_reason}
                  </div>
                )}

                <div className="border-t border-[var(--border)] pt-4">
                  <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                    {canEdit
                      ? "تا زمانی که وضعیت درخواست «در حال بررسی» باشد، اطلاعات قابل ویرایش و حذف است."
                      : "این درخواست بررسی یا نهایی شده است و دیگر امکان ویرایش یا حذف مستقیم آن وجود ندارد."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requester Info */}
          <Card className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-none">
            <CardContent className="p-6">
              <h3 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                اطلاعات درخواست‌دهنده
              </h3>

              <div className="space-y-3.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">نام:</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {data.requester_first_name || "-"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-secondary)]">
                    نام خانوادگی:
                  </span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {data.requester_last_name || "-"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
