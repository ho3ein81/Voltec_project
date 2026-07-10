"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SectionTitle } from "@/app/components/ui/section-title";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import api from "@/app/components/lib/api";
import { useCompany } from "@/app/components/company/company-provider";
import { Loader2 } from "lucide-react";

// تعریف تایپ پروژه‌های دریافتی از سرور بر اساس آخرین ریسپانس ارسالی شما
type APIProject = {
  id: number;
  code: string;
  title: string;
  employer: string;
  budget: number;
  incurred_cost: number;
  progress: number;
  status: string; // مانند "درحال انجام"
  delivery_time: string;
  owner_first_name: string;
  owner_last_name: string;
};

function getStatusMeta(status: string) {
  // مدیریت وضعیت بر اساس لیبل‌های فارسی ریسپانس شما
  switch (status) {
    case "درحال انجام":
    case "active":
      return {
        label: "درحال انجام",
        className:
          "border-[color:var(--success)]/20 bg-[color:var(--success)]/10 text-[color:var(--success)]",
      };
    case "در انتظار":
    case "pending":
      return {
        label: "در انتظار",
        className:
          "border-[color:var(--warning)]/20 bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
      };
    case "تکمیل‌شده":
    case "completed":
      return {
        label: "تکمیل‌شده",
        className:
          "border-[color:var(--info)]/20 bg-[color:var(--info)]/10 text-[color:var(--info)]",
      };
    default:
      return {
        label: status || "نامشخص",
        className:
          "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]",
      };
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export default function ProjectsPage() {
  const { activeCompany } = useCompany();
  const [projectsList, setProjectsList] = useState<APIProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!activeCompany?.id) {
        setProjectsList([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // دریافت پروژه‌های شرکت فعال
        const projectsRes = await api.get(`/projects/${activeCompany.id}/`);
        
        let projectsData: APIProject[] = [];
        // مدیریت ساختار Pagination (results)
        if (projectsRes.data && Array.isArray(projectsRes.data.results)) {
          projectsData = projectsRes.data.results;
        } else if (Array.isArray(projectsRes.data)) {
          projectsData = projectsRes.data;
        }
        
        setProjectsList(projectsData);
      } catch (err) {
        console.error("Error fetching projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeCompany?.id]);

  return (
    <div className="flex flex-col gap-6">
      {/* هدر کامپوننت با اصلاح تراز دکمه ایجاد پروژه در دسکتاپ و موبایل */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <SectionTitle
            title="پروژه‌ها"
            description="لیست کامل پروژه‌های ثبت‌شده در سامانه VOLTEC"
          />
        </div>
        <div className="w-full sm:w-auto">
          <Link href="/dashboard/projects/create" className="block w-full sm:inline-block">
            <Button className="w-full sm:w-auto">ایجاد پروژه جدید</Button>
          </Link>
        </div>
      </div>

      <Card className="w-full overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex h-48 w-full items-center justify-center gap-2 text-sm text-[var(--text-secondary)]">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--brand)]" />
              در حال دریافت پروژه‌ها...
            </div>
          ) : projectsList.length === 0 ? (
            <div className="flex h-32 w-full items-center justify-center text-sm text-[var(--text-muted)]">
              هیچ پروژه‌ای برای شرکت انتخاب شده یافت نشد.
            </div>
          ) : (
            <>
              {/* ۱. نمای جدولی: فقط در دیوایس‌های بزرگ (lg به بالا) نمایش داده می‌شود */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-soft)] text-[var(--text-secondary)]">
                    <tr className="border-b border-[var(--border)]">
                      <th className="px-4 py-3 text-right font-medium">کد</th>
                      <th className="px-4 py-3 text-right font-medium">عنوان پروژه</th>
                      <th className="px-4 py-3 text-right font-medium">کارفرما</th>
                      <th className="px-4 py-3 text-right font-medium">مسئول پروژه</th>
                      <th className="px-4 py-3 text-right font-medium">بودجه</th>
                      <th className="px-4 py-3 text-right font-medium">هزینه‌کرد</th>
                      <th className="px-4 py-3 text-center font-medium">پیشرفت</th>
                      <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                      <th className="px-4 py-3 text-right font-medium">عملیات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {projectsList.map((project, index) => {
                      const statusMeta = getStatusMeta(project.status);
                      const firstName = project.owner_first_name?.trim() || "";
                      const lastName = project.owner_last_name?.trim() || "";
                      const ownerFullName = `${firstName} ${lastName}`.trim() || "نامشخص";

                      return (
                        <tr
                          key={project.id || index}
                          className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-soft)]"
                        >
                          <td className="px-4 py-4 text-[var(--text-secondary)]">
                            {project.code || `PRJ-${project.id}`}
                          </td>
                          <td className="px-4 py-4 font-medium text-[var(--text-primary)]">
                            {project.title}
                          </td>
                          <td className="px-4 py-4 text-[var(--text-secondary)]">
                            {project.employer}
                          </td>
                          <td className="px-4 py-4 text-[var(--text-secondary)]">
                            {ownerFullName}
                          </td>
                          <td className="px-4 py-4 text-[var(--text-secondary)]">
                            {formatCurrency(project.budget)} تومان
                          </td>
                          <td className="px-4 py-4 text-[var(--text-secondary)]">
                            {formatCurrency(project.incurred_cost)} تومان
                          </td>
                          <td className="px-4 py-4 text-center text-[var(--text-secondary)]">
                            {project.progress ?? 0}٪
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusMeta.className}`}
                            >
                              {statusMeta.label}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <Link
                              href={`/dashboard/projects/${project.id}`}
                              className="text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]"
                            >
                              مشاهده
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ۲. نمای کارتی: برای موبایل و تبلت (کمتر از lg) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 lg:hidden">
                {projectsList.map((project, index) => {
                  const statusMeta = getStatusMeta(project.status);
                  const firstName = project.owner_first_name?.trim() || "";
                  const lastName = project.owner_last_name?.trim() || "";
                  const ownerFullName = `${firstName} ${lastName}`.trim() || "نامشخص";

                  return (
                    <div
                      key={project.id || index}
                      className="border border-[var(--border)] rounded-xl p-4 flex flex-col gap-3 bg-[var(--background)] hover:shadow-md transition-shadow"
                    >
                      {/* هدر کارت */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-[var(--text-secondary)]">
                            {project.code || `PRJ-${project.id}`}
                          </span>
                          <h4 className="font-semibold text-sm text-[var(--text-primary)]">
                            {project.title}
                          </h4>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      {/* اطلاعات میانی */}
                      <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs border-t border-b border-[var(--border)]/40 py-3 my-1">
                        <div>
                          <span className="text-[var(--text-secondary)] block mb-1">کارفرما</span>
                          <span className="font-medium text-[var(--text-primary)]">{project.employer}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)] block mb-1">مسئول پروژه</span>
                          <span className="font-medium text-[var(--text-primary)]">{ownerFullName}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)] block mb-1">بودجه</span>
                          <span className="font-medium text-[var(--text-primary)]">{formatCurrency(project.budget)} تومان</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)] block mb-1">هزینه‌کرد</span>
                          <span className="font-medium text-[var(--text-primary)]">{formatCurrency(project.incurred_cost)} تومان</span>
                        </div>
                      </div>

                      {/* بخش پیشرفت و دکمه مشاهده */}
                      <div className="flex items-center justify-between gap-4 mt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)]">پیشرفت:</span>
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {project.progress ?? 0}٪
                          </span>
                        </div>
                        <Link
                          href={`/dashboard/projects/${project.id}`}
                          className="text-xs font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] border border-[var(--brand)]/20 px-3 py-1.5 rounded-lg hover:bg-[var(--brand)]/5 transition-colors"
                        >
                          مشاهده پروژه
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
