"use client";

import { useState, useEffect } from "react";
import { SectionTitle } from "@/app/components/ui/section-title";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useRouter } from "next/navigation";
import api from "../components/lib/api";

interface Province {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
}

type PaginatedResponse<T> = {
  count?: number;
  next: string | null;
  previous?: string | null;
  results: T[];
};

const fetchAllPaginated = async <T,>(url: string): Promise<T[]> => {
  let results: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl !== null) {
    const res: Response = await api(nextUrl);

    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    const data: PaginatedResponse<T> | T[] = await res.json();

    if (Array.isArray(data)) {
      results = [...results, ...data];
      nextUrl = null;
    } else {
      results = [...results, ...data.results];
      nextUrl = data.next;
    }
  }

  return results;
};

export default function CreateProjectPage() {
  const router = useRouter();

  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);

  const [formData, setFormData] = useState({
    company_name: "",
    company_national_id: "",
    company_description: "",
    company_registration_number: "",
    type_company: "",
    company_province: "",
    company_city: "",
  });

  /* گرفتن استان ها */
  /* گرفتن استان ها */
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const allProvinces = await fetchAllPaginated<Province>(
          "http://127.0.0.1:8000/api/core/provinces/",
        );

        setProvinces(allProvinces);
      } catch (error) {
        console.error("Province fetch error:", error);
      }
    };

    fetchProvinces();
  }, []);

  /* گرفتن شهرها بر اساس استان */
  const fetchCities = async (provinceId: string) => {
    try {
      const allCities = await fetchAllPaginated<City>(
        `http://127.0.0.1:8000/api/core/cities/${provinceId}/`,
      );

      setCities(allCities);
    } catch (error) {
      console.error("Cities fetch error:", error);
    }
  };

  /* تغییرات فرم */
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;

    if (name === "company_province") {
      setFormData((prev) => ({
        ...prev,
        company_province: value,
        company_city: "",
      }));

      if (value) {
        fetchCities(value);
      } else {
        setCities([]);
      }

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ارسال فرم */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");

    try {
      const res = await api.post(
        "/user_requests/company-registration-request/",
        formData,
      );

      const data = await res.data;
      console.log("API Response:", data);

      if (res.status !== 200) {
        router.push("/dashboard/projects");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div dir="rtl" className="flex flex-col gap-8">
      <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-l from-[var(--brand-soft)] via-white to-white p-6 shadow-sm">
        <SectionTitle
          title="ایجاد شرکت"
          description="اطلاعات شرکت را جهت ثبت در سامانه وارد کنید"
        />
      </div>

      <Card className="overflow-visible rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardHeader className="border-b border-[var(--border)] bg-[var(--surface-soft)] px-6 py-5">
          <CardTitle className="flex items-center pb-5 gap-3 text-lg font-bold text-[var(--text-primary)]">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-black text-[var(--surface-dark)]">
              ۱
            </span>
            مشخصات شرکت
          </CardTitle>
        </CardHeader>

        <CardContent className="px-6 py-6 md:px-8 md:py-8">
          <form onSubmit={handleSubmit} className="space-y-7">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* نام شرکت */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  نام شرکت
                  <span className="mr-1 text-[var(--error)]">*</span>
                </label>

                <input
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  placeholder="مثلاً شرکت مهندسی ولتک"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                  required
                />
              </div>

              {/* شناسه ملی */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  شناسه ملی شرکت
                  <span className="mr-1 text-[var(--error)]">*</span>
                </label>

                <input
                  name="company_national_id"
                  value={formData.company_national_id}
                  onChange={handleChange}
                  placeholder="شناسه ملی ۱۱ رقمی شرکت را وارد کنید"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                  required
                />
              </div>

              {/* شماره ثبت */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  شماره ثبت
                  <span className="mr-1 text-[var(--error)]">*</span>
                </label>

                <input
                  name="company_registration_number"
                  value={formData.company_registration_number}
                  onChange={handleChange}
                  placeholder="شماره ثبت شرکت"
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                />
              </div>

              {/* نوع شرکت */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  نوع شرکت
                  <span className="mr-1 text-[var(--error)]">*</span>
                </label>

                <select
                  name="type_company"
                  value={formData.type_company}
                  onChange={handleChange}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                  required
                >
                  <option value="">انتخاب کنید</option>
                  <option value="public_joint_stock">سهامی عام</option>
                  <option value="private_joint_stock">سهامی خاص</option>
                  <option value="llc">مسئولیت محدود</option>
                  <option value="solidarity">تضامنی</option>
                  <option value="proportional">نسبی</option>
                  <option value="mixed_joint_stock">مختلط سهامی</option>
                  <option value="mixed_non_joint_stock">مختلط غیرسهامی</option>
                  <option value="cooperative">تعاونی</option>
                </select>
              </div>

              {/* استان */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  استان
                </label>

                <select
                  name="company_province"
                  value={formData.company_province}
                  onChange={handleChange}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                >
                  <option value="">انتخاب استان</option>

                  {provinces.map((province) => (
                    <option key={province.id} value={province.id}>
                      {province.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* شهر */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  شهر
                </label>

                <select
                  name="company_city"
                  value={formData.company_city}
                  onChange={handleChange}
                  disabled={!formData.company_province}
                  className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-4 pl-20 text-sm text-[var(--text-primary)] outline-none transition-all disabled:cursor-not-allowed disabled:bg-[var(--surface-soft)] disabled:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                >
                  <option value="">
                    {formData.company_province
                      ? "انتخاب شهر"
                      : "ابتدا استان را انتخاب کنید"}
                  </option>

                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* توضیحات */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[var(--text-primary)]">
                توضیحات شرکت
              </label>

              <textarea
                name="company_description"
                value={formData.company_description}
                onChange={handleChange}
                placeholder="توضیح کوتاهی درباره شرکت، حوزه فعالیت یا اطلاعات تکمیلی وارد کنید..."
                className="min-h-32 w-full resize-none rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-soft)]"
                rows={4}
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[var(--border)] pt-6 sm:flex-row sm:justify-end">
              <Button
                variant="secondary"
                onClick={() => router.back()}
                className="h-11 rounded-xl px-6"
              >
                انصراف
              </Button>

              <Button
                type="submit"
                className="h-11 rounded-xl bg-[var(--brand)] px-7 font-bold text-[var(--surface-dark)] transition-colors hover:bg-[var(--brand-hover)]"
              >
                ثبت شرکت
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
