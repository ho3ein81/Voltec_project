"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SectionTitle } from "@/app/components/ui/section-title";
import { Card, CardContent } from "@/app/components/ui/card";
import api from "@/app/components/lib/api";

enum CompanyRequestStatus {
  Pending = "pending",
  Approved = "approved",
  Rejected = "rejected",
}

type CompanyRequest = {
  id: number;
  created_at: string;
  company_name: string;
  type_company: string;
  status: CompanyRequestStatus | string; // پذیرش وضعیت‌های فارسی یا انگلیسی
  company_id?: number | null; // فیلد اضافه شده از بک‌اند
};

const COMPANY_REGISTRATION_ENDPOINT =
  "/approvals/company-registration-request/moderators/";

const MODERATOR_COMPANY_REGISTRATION_ENDPOINT =
  "/approvals/company-registration-request/moderators/";

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

function getCompanyTypeLabel(type?: string | null) {
  if (!type) return "-";
  const normalizedType = String(type).trim().toLowerCase();
  return COMPANY_TYPE_LABELS[normalizedType] ?? type;
}

function getStatusMeta(status: string) {
  // مدیریت هر دو حالت فارسی (دریافت شده از بک‌اند) و انگلیسی
  const normalized = status.trim();
  if (normalized === "approved" || normalized === "تایید شده") {
    return {
      label: "تایید شده",
      className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
    };
  }
  if (normalized === "pending" || normalized === "در حال بررسی" || normalized === "در انتظار") {
    return {
      label: "در حال بررسی",
      className: "border-amber-500/20 bg-amber-500/10 text-amber-500",
    };
  }
  if (normalized === "rejected" || normalized === "تایید نشده" || normalized === "رد شده") {
    return {
      label: "رد شده",
      className: "border-red-500/20 bg-red-500/10 text-red-500",
    };
  }
  return {
    label: status,
    className: "border-gray-500/20 bg-gray-500/10 text-gray-500",
  };
}

function formatDate(date: string) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("fa-IR");
}

function getErrorMessage(error: any) {
  const status = error?.response?.status;
  if (status === 401) return "نشست شما منقضی شده است. لطفاً دوباره وارد شوید.";
  if (status === 403) return "شما دسترسی لازم برای مشاهده درخواست‌ها را ندارید. کاربر باید عضو گروه moderators باشد.";
  if (status === 404) return "آدرس API مربوط به درخواست‌های ثبت شرکت پیدا نشد.";
  if (error?.response?.data?.detail) return error.response.data.detail;
  return "خطا در ارتباط با سرور.";
}

export default function AdminCompanyRequestsPage() {
  const router = useRouter();

  const [companies, setCompanies] = useState<CompanyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        router.push("/login");
        return;
      }

      const res = await api.get(COMPANY_REGISTRATION_ENDPOINT);
      const data = Array.isArray(res.data) ? res.data : (res.data?.results ?? []);
      setCompanies(data);
    } catch (error: any) {
      console.error("خطا در دریافت لیست درخواست‌ها:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (
    requestId: number,
    status: CompanyRequestStatus,
  ) => {
    try {
      setUpdatingId(requestId);
      setErrorMessage(null);

      await api.patch(
        `${MODERATOR_COMPANY_REGISTRATION_ENDPOINT}${requestId}/`,
        {
          operator: status === CompanyRequestStatus.Approved ? "approve" : "reject",
        },
      );

      await fetchData();
    } catch (error: any) {
      console.error("خطا در بروزرسانی وضعیت درخواست:", error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-[var(--text-secondary)]">
        <div className="animate-pulse text-sm">در حال بارگذاری اطلاعات...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="مدیریت درخواست‌های ثبت شرکت"
        description="بررسی و تایید شرکت‌های جدید برای ورود به سامانه"
      />

      {errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {errorMessage}
        </div>
      )}

      <Card className="overflow-hidden border-[var(--border)] bg-[var(--surface)] shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]">
                <tr>
                  <th className="px-6 py-4 font-semibold">نام شرکت</th>
                  <th className="px-6 py-4 font-semibold">نوع حقوقی</th>
                  <th className="px-6 py-4 font-semibold">تاریخ ثبت درخواست</th>
                  <th className="px-6 py-4 font-semibold">وضعیت فعلی</th>
                  <th className="px-6 py-4 font-semibold">جزئیات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">
                {companies.length > 0 ? (
                  companies.map((company) => {
                    const statusMeta = getStatusMeta(company.status);
                    const isUpdating = updatingId === company.id;
                    const isPending =
                      company.status === "pending" ||
                      company.status === "در حال بررسی";

                    // برای بارگذاری جزئیات در صفحه ویرایش، همیشه از شناسه درخواست (company.id) استفاده می‌شود
                    const targetId = company.id;

                    return (
                      <tr
                        key={company.id}
                        className="transition-colors hover:bg-[var(--surface-soft)]/50"
                      >
                        <td className="px-6 py-4 font-medium text-[var(--text-primary)]">
                          {company.company_name}
                        </td>

                        <td className="px-6 py-4 text-[var(--text-secondary)]">
                          {getCompanyTypeLabel(company.type_company)}
                        </td>

                        <td className="px-6 py-4 text-[var(--text-secondary)]">
                          {formatDate(company.created_at)}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusMeta.className}`}
                          >
                            {statusMeta.label}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <Link
                              href={`/admin/company-registration/${targetId}`}
                              className="text-sm font-medium text-[var(--brand)] hover:underline"
                            >
                              بررسی جزئیات
                            </Link>

                            <button
                              type="button"
                              disabled={!isPending || isUpdating}
                              onClick={() =>
                                handleUpdateStatus(
                                  company.id,
                                  CompanyRequestStatus.Approved,
                                )
                              }
                              className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-500 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isUpdating ? "ثبت..." : "تایید"}
                            </button>

                            <button
                              type="button"
                              disabled={!isPending || isUpdating}
                              onClick={() =>
                                handleUpdateStatus(
                                  company.id,
                                  CompanyRequestStatus.Rejected,
                                )
                              }
                              className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isUpdating ? "ثبت..." : "رد"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-10 text-center text-[var(--text-secondary)]"
                    >
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
