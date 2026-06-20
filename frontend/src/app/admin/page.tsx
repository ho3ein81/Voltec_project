"use client";

import { useEffect, useState } from "react";
import { SectionTitle } from "@/app/components/ui/section-title";
import { Card, CardContent } from "@/app/components/ui/card";
import api from "@/app/components/lib/api"; // مطمئن شو مسیر ایمپورت api درست است
import Link from "next/link";

// تعریف تایپ دقیق بر اساس پاسخ API
type CompanyRequest = {
  created_at: string;
  company_name: string;
  type_company: string;
  status: "pending" | "approved" | "rejected";
};

// تابع کمکی برای استایل‌دهی وضعیت‌ها
function getStatusMeta(status: string) {
  switch (status) {
    case "approved":
      return {
        label: "تایید شده",
        className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
      };
    case "pending":
      return {
        label: "در انتظار",
        className: "border-amber-500/20 bg-amber-500/10 text-amber-500",
      };
    case "rejected":
      return {
        label: "رد شده",
        className: "border-red-500/20 bg-red-500/10 text-red-500",
      };
    default:
      return {
        label: status,
        className: "border-gray-500/20 bg-gray-500/10 text-gray-500",
      };
  }
}

// تابع تبدیل تاریخ به شمسی
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fa-IR");
}

export default function AdminCompanyRequestsPage() {
  const [companies, setCompanies] = useState<CompanyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // استفاده از تونل api (Axios Interceptor)
        const res = await api.get("/user_requests/company-registration-request/");
        setCompanies(res.data.results);
      } catch (error) {
        console.error("خطا در دریافت لیست شرکت‌ها:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--text-secondary)]">
        <div className="animate-pulse">در حال بارگذاری اطلاعات...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* هدر صفحه ادمین */}
      <SectionTitle
        title="مدیریت درخواست‌های ثبت شرکت"
        description="بررسی و تایید شرکت‌های جدید برای ورود به سامانه"
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-right">
              <thead className="bg-[var(--surface-soft)] text-[var(--text-secondary)] border-b border-[var(--border)]">
                <tr>
                  <th className="px-6 py-4 font-semibold">نام شرکت</th>
                  <th className="px-6 py-4 font-semibold">نوع حقوقی</th>
                  <th className="px-6 py-4 font-semibold">تاریخ ثبت درخواست</th>
                  <th className="px-6 py-4 font-semibold">وضعیت فعلی</th>
                  <th className="px-6 py-4 font-semibold">عملیات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {companies.length > 0 ? (
                  companies.map((company, index) => {
                    const status = getStatusMeta(company.status);

                    return (
                      <tr
                        key={index}
                        className="transition-colors hover:bg-[var(--surface-soft)]/50"
                      >
                        <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                          {company.company_name}
                        </td>

                        <td className="px-6 py-4 text-[var(--text-secondary)]">
                          {company.type_company === "public_joint_stock" 
                            ? "سهامی عام" 
                            : company.type_company}
                        </td>

                        <td className="px-6 py-4 text-[var(--text-secondary)]">
                          {formatDate(company.created_at)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/company-request/${index}`} 
                            className="text-sm font-medium text-[var(--brand)] hover:underline"
                          >
                            بررسی جزئیات
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[var(--text-secondary)]">
                      هیچ درخواستی یافت نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
