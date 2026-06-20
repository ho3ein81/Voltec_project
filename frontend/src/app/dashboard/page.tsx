"use client";

import { useEffect, useState } from "react";
import { SectionTitle } from "@/app/components/ui/section-title";
import { Card, CardContent } from "@/app/components/ui/card";
import api from "../components/lib/api";

type CompanyRequest = {
  created_at: string;
  company_name: string;
  type_company: string;
  status: "pending" | "approved" | "rejected";
};

function getStatusMeta(status: string) {
  switch (status) {
    case "approved":
      return {
        label: "تایید شده",
        className:
          "border-[color:var(--success)]/20 bg-[color:var(--success)]/10 text-[color:var(--success)]",
      };

    case "pending":
      return {
        label: "در انتظار",
        className:
          "border-[color:var(--warning)]/20 bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
      };

    case "rejected":
      return {
        label: "رد شده",
        className:
          "border-[color:var(--error)]/20 bg-[color:var(--error)]/10 text-[color:var(--error)]",
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
      const token = localStorage.getItem("access_token");

      const res = await api.get(
        "/user_requests/company-registration-request/",
      );

      const data = await res.data;

      setCompanies(data.results);
      setLoading(false);
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
                        {company.type_company}
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
