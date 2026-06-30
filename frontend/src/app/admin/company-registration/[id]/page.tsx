// ویرایش اطلاعات ثبت شرکت 

"use client";

import { useEffect, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import api from "@/app/components/lib/api";
import { useParams , useRouter } from "next/navigation";




type PaginatedResponse<T> = {
  results: T[];
  next: string | null;
};

async function fetchAllPaginated<T>(url: string): Promise<T[]> {
  let allResults: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const res: { data: PaginatedResponse<T> | T[] } =
      await api.get<PaginatedResponse<T> | T[]>(nextUrl);

    const data: PaginatedResponse<T> | T[] = res.data;

    if (Array.isArray(data)) {
      allResults.push(...data);
      nextUrl = null;
    } else {
      allResults.push(...data.results);
      nextUrl = data.next;
    }
  }

  return allResults;
}


// --- ثابت‌ها ---
const COMPANY_TYPE_LABELS: Record<string, string> = {
  public_joint_stock: "سهامی عام",
  private_joint_stock: "سهامی خاص",
  llc: "مسئولیت محدود",
  limited_liability: "مسئولیت محدود",
  solidarity: "تضامنی",
  proportional: "نسبی",
  mixed_joint_stock: "مختلط سهامی",
  mixed_non_joint_stock: "مختلط غیرسهامی",
  cooperative: "تعاونی",
};

type Province = { id: string; name: string };
type City = { id: string; name: string };

type CompanyRequest = {
  first_name: string;
  last_name: string;
  company_name: string;
  national_id: string;
  registration_number: string;
  description: string;
  type_company: string;
  province_id: string;
  city_id: string;
  status: string;
  created_at: string;
  reject_reason: string | null;
};

export default function EditCompanyRequestPage() {
  const params = useParams();
  const companyId = params.id as string;
  const API_ENDPOINT = `/user_requests/company-registration-request/${companyId}/`;
  const router = useRouter();

  const [form, setForm] = useState<CompanyRequest>({
    first_name: "",
    last_name: "",
    company_name: "",
    national_id: "",
    registration_number: "",
    description: "",
    type_company: "",
    province_id: "",
    city_id: "",
    status: "",
    created_at: "",
    reject_reason: null,
  });

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

useEffect(() => {
  const initData = async () => {
    try {
      setLoading(true); // حتماً در شروع لودینگ true کنید
      const [companyRes, allProvinces] = await Promise.all([
        api.get(API_ENDPOINT),
        fetchAllPaginated<Province>("/core/provinces/")
      ]);

      const data = companyRes.data;
      
      setForm({
        first_name: data.requester_first_name || "",
        last_name: data.requester_last_name || "",
        company_name: data.company_name || "",
        national_id: data.company_national_id || "",
        registration_number: data.company_registration_number || "",
        description: data.company_description || "",
        type_company: data.type_company || "",
        province_id: "",
        city_id: "",
        status: data.status || "",
        created_at: data.created_at || "",
        reject_reason: data.reject_reason,
      });

      setProvinces(allProvinces);
      // پیدا کردن استان بر اساس name
if (data.company_province_name) {
  const matchedProvince = allProvinces.find(
    (p) => p.name === data.company_province_name
  );

  if (matchedProvince) {
    // ست کردن province_id
    setForm((prev) => ({
      ...prev,
      province_id: matchedProvince.id,
    }));

    // گرفتن شهرهای آن استان
    const allCities = await fetchAllPaginated<City>(
      `/core/cities/${matchedProvince.id}/`
    );

    setCities(allCities);

    // پیدا کردن شهر بر اساس name
    if (data.company_city_name) {
      const matchedCity = allCities.find(
        (c) => c.name === data.company_city_name
      );

      if (matchedCity) {
        setForm((prev) => ({
          ...prev,
          city_id: matchedCity.id,
        }));
      }
    }
  }
}



      // اگر استان انتخاب شده، شهرها را هم کامل لود کن
      if (data.company_province) {
        await fetchCities(String(data.company_province));
      }
    } catch (error) {
      console.error("Initialization error:", error);
    } finally {
      setLoading(false);
    }
  };

  initData();
}, [companyId]);

// ۳. تابع fetchCities را هم به این شکل به روز کنید
const fetchCities = async (provinceId: string) => {
  try {
    const allCities = await fetchAllPaginated<City>(`/core/cities/${provinceId}/`);
    setCities(allCities);
  } catch (error) {
    console.error("Cities fetch error:", error);
  }
};

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "province_id") {
      setForm((prev) => ({ ...prev, city_id: "" }));
      if (value) fetchCities(value);
      else setCities([]);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        requester_first_name: form.first_name,
        requester_last_name: form.last_name,
        company_name: form.company_name,
        company_national_id: form.national_id,
        company_registration_number: form.registration_number,
        company_description: form.description,
        type_company: form.type_company,
        // ارسال IDها به بک‌انند برای ویرایش
        company_province: form.province_id,
        company_city: form.city_id,
      };

      await api.patch(API_ENDPOINT, payload);
      
      // نمایش پیام موفقیت به کاربر
      alert("تغییرات با موفقیت اعمال شد");
      
      // هدایت خودکار کاربر به صفحه لیست درخواست‌ها
      // دقت کنید مسیر باید با ساختار پروژه شما (مثلاً /admin/company-request) همخوانی داشته باشد
      router.push("/admin/company-registration/list");
      
    } catch (error: any) {
      console.error("Save error:", error);
      alert("خطا در ذخیره‌سازی: " + (error.response?.data?.detail || "مشکلی پیش آمده است"));
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-soft)]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-sm text-[var(--text-secondary)] shadow-sm">
          در حال بارگذاری اطلاعات...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {/* Header */}
          <div className="border-b border-[var(--border)] bg-gradient-to-b from-white to-[var(--surface-soft)] px-6 py-5 md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] md:text-2xl">
                  ویرایش درخواست ثبت شرکت
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  شناسه درخواست: <span className="font-medium">{companyId}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  وضعیت: {form.status || "نامشخص"}
                </span>
                <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {form.created_at
                    ? new Date(form.created_at).toLocaleDateString("fa-IR")
                    : "تاریخ نامشخص"}
                </span>
              </div>
            </div>

            {form.reject_reason && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-semibold">دلیل رد:</span> {form.reject_reason}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="px-6 py-6 md:px-8 md:py-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
             

              

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  نام شرکت
                </label>
                <Input
                  name="company_name"
                  value={form.company_name}
                  onChange={handleChange}
                  className="h-11 rounded-xl border-[var(--border)] bg-white text-[var(--text-primary)] shadow-sm transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  شناسه ملی
                </label>
                <Input
                  name="national_id"
                  value={form.national_id}
                  onChange={handleChange}
                  className="h-11 rounded-xl border-[var(--border)] bg-white text-[var(--text-primary)] shadow-sm transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  شماره ثبت
                </label>
                <Input
                  name="registration_number"
                  value={form.registration_number}
                  onChange={handleChange}
                  className="h-11 rounded-xl border-[var(--border)] bg-white text-[var(--text-primary)] shadow-sm transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  نوع شرکت
                </label>
                <select
                  name="type_company"
                  value={form.type_company}
                  onChange={handleChange}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--text-primary)] shadow-sm outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                >
                  <option value="">انتخاب نوع شرکت</option>
                  {Object.entries(COMPANY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  استان
                </label>
                <select
                  name="province_id"
                  value={form.province_id}
                  onChange={handleChange}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--text-primary)] shadow-sm outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                >
                  <option value="">انتخاب استان</option>
                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-primary)]">
                  شهر
                </label>
                <select
                  name="city_id"
                  value={form.city_id}
                  onChange={handleChange}
                  disabled={!form.province_id}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--text-primary)] shadow-sm outline-none transition-all disabled:cursor-not-allowed disabled:bg-[var(--surface-soft)] disabled:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                >
                  <option value="">
                    {form.province_id ? "انتخاب شهر" : "ابتدا استان را انتخاب کنید"}
                  </option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                توضیحات
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                placeholder="توضیحات شرکت را وارد کنید..."
              />
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="h-11 rounded-xl bg-[var(--brand)] px-6 text-sm font-semibold text-[#111] shadow-sm transition-all hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
