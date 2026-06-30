"use client";

import { useEffect, useState } from "react";
import { SectionTitle } from "@/app/components/ui/section-title";
import { Card, CardContent } from "@/app/components/ui/card";
import api from "../../../components/lib/api";


type CompanyRequest = {
  created_at: string;
  company_name: string;
  type_company: string;
  status: "pending" | "approved" | "rejected";
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
};


function getCompanyTypeLabel(type: string) {
  return COMPANY_TYPE_LABELS[type] || type;
}

function getStatusMeta(status: string) {
  switch (status) {
    case "approved":
      return {
        label: "تایید شده",
        className:
         "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
      };

    case "pending":
      return {
        label: "در انتظار",
        className:
          "border-amber-500/20 bg-amber-500/10 text-amber-500",
      };

    case "rejected":
      return {
        label: "رد شده",
        className:
          "border-red-500/20 bg-red-500/10 text-red-500",
      };

    default:
      return {
        label: status,
        className:
          "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]",
      };
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("fa-IR");
}

export default function CompanyRequestsPage() {
  const [companies, setCompanies] = useState<CompanyRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
  try {
    const res = await api.get("/user_requests/company-registration-request/");
    const data = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
    setCompanies(data);
  } finally {
    setLoading(false);
  }
};

    fetchData();
  }, []);

  if (loading) return <div>در حال بارگذاری...</div>;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="درخواست‌های ثبت شرکت"
        description="لیست شرکت‌های درخواست‌دهنده برای ایجاد Tenant"
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-[var(--surface-soft)] text-[var(--text-secondary)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-right font-medium">نام شرکت</th>
                  <th className="px-4 py-3 text-right font-medium">نوع شرکت</th>
                  <th className="px-4 py-3 text-right font-medium">
                    تاریخ درخواست
                  </th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                </tr>
              </thead>

              <tbody>
                {companies.map((company, index) => {
                  const status = getStatusMeta(company.status);

                  return (
                    <tr
                      key={index}
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
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
