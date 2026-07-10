"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SectionTitle } from "@/app/components/ui/section-title";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import api from "../../../components/lib/api";
import { Eye, Edit2, Loader2 } from "lucide-react";

type CompanyRequestListItem = {
  id: number;
  created_at: string;
  company_name: string;
  type_company: string;
  status: string;
};

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
  "سهامی عام": "سهامی عام",
  "سهامی خاص": "سهامی خاص",
  "تضامنی": "تضامنی",
};

function getCompanyTypeLabel(type: string) {
  return COMPANY_TYPE_LABELS[type] || type;
}

function getStatusMeta(status: string): { label: string; className: string; isPending: boolean } {
  const normalized = status ? status.trim().toLowerCase() : "";
  if (normalized === "approved" || normalized === "تایید شده" || normalized === "فعال") {
    return {
      label: "تایید شده",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
      isPending: false,
    };
  }
  if (
    normalized === "pending" ||
    normalized === "در حال بررسی" ||
    normalized === "در انتظار" ||
    normalized === "در انتظار بررسی"
  ) {
    return {
      label: "در انتظار بررسی",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-500",
      isPending: true,
    };
  }
  if (normalized === "rejected" || normalized === "تایید نشده" || normalized === "رد شده") {
    return {
      label: "رد شده",
      className: "border-red-500/20 bg-red-500/10 text-red-500",
      isPending: false,
    };
  }
  return {
    label: status || "نامشخص",
    className: "border-gray-500/20 bg-gray-500/10 text-gray-500",
    isPending: false,
  };
}

function formatDate(date: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fa-IR");
}

export default function CompanyRequestsPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await api.get("/user_requests/company-registration-request/");
      const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      
      const mappedData = data.map((item: any) => ({
        id: item.id,
        created_at: item.created_at || item.company_created_at || "",
        company_name: item.company_name || item.name || "-",
        type_company: item.type_company || item.company_type || "",
        status: item.status || "pending",
      }));
      
      setCompanies(mappedData);
    } catch (error) {
      console.error("خطا در بارگذاری درخواست‌های ثبت شرکت:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="درخواست‌های ثبت شرکت"
        description="لیست شرکت‌های درخواست‌دهنده برای ایجاد Tenant"
      />

      <Card className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-[var(--surface-soft)] text-[var(--text-secondary)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-right font-medium">نام شرکت</th>
                  <th className="px-4 py-3 text-right font-medium">نوع شرکت</th>
                  <th className="px-4 py-3 text-right font-medium">تاریخ درخواست</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-center font-medium">جزئیات</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />
                        <span>در حال بارگذاری لیست...</span>
                      </div>
                    </td>
                  </tr>
                ) : companies.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-muted)]">
                      هیچ درخواستی برای نمایش وجود ندارد.
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => {
                    const statusMeta = getStatusMeta(company.status);

                    return (
                      <tr
                        key={company.id}
                        className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-soft)]"
                      >
                        <td className="px-4 py-4 font-medium text-[var(--text-primary)]">
                          {company.company_name}
                        </td>

                        <td className="px-4 py-4 text-[var(--text-secondary)]">
                          {getCompanyTypeLabel(company.type_company)}
                        </td>

                        <td className="px-4 py-4 text-[var(--text-secondary)]">
                          {formatDate(company.created_at)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* دکمه مشاهده مینیمال با استایل متناسب با Border و Brand پروژه */}
                            <Button
                              size="sm"
                              className="h-8 gap-1.5 rounded-xl border border-[var(--border)] bg-transparent px-3 text-xs text-[var(--text-secondary)] shadow-none transition-all hover:border-[var(--brand)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
                              onClick={() => router.push(`/dashboard/projects/user-list/${company.id}`)}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              مشاهده
                            </Button>
                            
                            {/* دکمه ویرایش ملایم متناسب با رنگ‌های وضعیت Pending */}
                            {statusMeta.isPending && (
                              <Button
                                size="sm"
                                className="h-8 gap-1.5 rounded-xl border border-transparent bg-[var(--brand-soft)] px-3 text-xs text-amber-700 shadow-none transition-all hover:bg-[var(--brand)] hover:text-[var(--sidebar-bg)] font-medium"
                                onClick={() => router.push(`/dashboard/projects/user-list/${company.id}?edit=true`)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                ویرایش
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
