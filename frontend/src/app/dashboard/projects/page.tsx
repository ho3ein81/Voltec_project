import Link from "next/link";
import { SectionTitle } from "@/app/components/ui/section-title";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { projects } from "@/data/projects";
import { ProjectStatus } from "@/types/project";

function getStatusMeta(status: ProjectStatus) {
  switch (status) {
    case "active":
      return {
        label: "فعال",
        className:
          "border-[color:var(--success)]/20 bg-[color:var(--success)]/10 text-[color:var(--success)]",
      };
    case "pending":
      return {
        label: "در انتظار",
        className:
          "border-[color:var(--warning)]/20 bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
      };
    case "completed":
      return {
        label: "تکمیل‌شده",
        className:
          "border-[color:var(--info)]/20 bg-[color:var(--info)]/10 text-[color:var(--info)]",
      };
    case "suspended":
      return {
        label: "معلق",
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="پروژه‌ها"
        description="لیست کامل پروژه‌های ثبت‌شده در سامانه VOLTEC"
        action={
          <Link href="/dashboard/projects/create">
            <Button>ایجاد پروژه جدید</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-[var(--surface-soft)] text-[var(--text-secondary)]">
                <tr className="border-b border-[var(--border)]">
                  <th className="px-4 py-3 text-right font-medium">کد</th>
                  <th className="px-4 py-3 text-right font-medium">عنوان پروژه</th>
                  <th className="px-4 py-3 text-right font-medium">کارفرما</th>
                  <th className="px-4 py-3 text-right font-medium">مدیر پروژه</th>
                  <th className="px-4 py-3 text-right font-medium">بودجه</th>
                  <th className="px-4 py-3 text-right font-medium">هزینه‌کرد</th>
                  <th className="px-4 py-3 text-right font-medium">پیشرفت</th>
                  <th className="px-4 py-3 text-right font-medium">وضعیت</th>
                  <th className="px-4 py-3 text-right font-medium">عملیات</th>
                </tr>
              </thead>

              <tbody>
                {projects.map((project) => {
                  const status = getStatusMeta(project.status);

                  return (
                    <tr
                      key={project.id}
                      className="border-b border-[var(--border)] transition-colors hover:bg-[var(--surface-soft)]"
                    >
                      <td className="px-4 py-4 text-[var(--text-secondary)]">
                        {project.code}
                      </td>
                      <td className="px-4 py-4 font-medium text-[var(--text-primary)]">
                        {project.title}
                      </td>
                      <td className="px-4 py-4 text-[var(--text-secondary)]">
                        {project.client}
                      </td>
                      <td className="px-4 py-4 text-[var(--text-secondary)]">
                        {project.manager}
                      </td>
                      <td className="px-4 py-4 text-[var(--text-secondary)]">
                        {formatCurrency(project.budget)} ریال
                      </td>
                      <td className="px-4 py-4 text-[var(--text-secondary)]">
                        {formatCurrency(project.spent)} ریال
                      </td>
                      <td className="px-4 py-4 text-[var(--text-secondary)]">
                        {project.progress}٪
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.label}
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
        </CardContent>
      </Card>
    </div>
  );
}
