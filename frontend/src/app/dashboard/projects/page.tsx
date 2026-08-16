"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { SectionTitle } from "@/app/components/ui/section-title";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import Switch from "@/app/components/ui/switch";
import api from "@/app/components/lib/api";
import { useCompany } from "@/app/components/company/company-provider";

type APIProject = {
  id: number;
  code: string;
  title: string;
  employer: string;
  budget: number;
  incurred_cost: number;
  progress: number;
  status: string;
  owner_first_name: string;
  owner_last_name: string;
};

type StatusKind = "suspended" | "in_progress" | "completed" | "unknown";

function normalizeStatus(status: string) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

function getStatusKind(status: string): StatusKind {
  const normalized = normalizeStatus(status);

  if (
    normalized === "suspension" ||
    normalized === "suspended" ||
    normalized === "suspend" ||
    normalized === "تعلیق" ||
    normalized === "معلق" ||
    normalized === "تعلیق شده" ||
    normalized === "تعلیق‌شده"
  ) {
    return "suspended";
  }

  if (
    normalized === "inprogress" ||
    normalized === "in_progress" ||
    normalized === "in progress" ||
    normalized === "در حال انجام" ||
    normalized === "درحال انجام" ||
    normalized === "در جریان" ||
    normalized === "فعال"
  ) {
    return "in_progress";
  }

  if (
    normalized === "completed" ||
    normalized === "complete" ||
    normalized === "تکمیل شده" ||
    normalized === "تکمیل‌شده" ||
    normalized === "اتمام یافته" ||
    normalized === "پایان یافته"
  ) {
    return "completed";
  }

  return "unknown";
}

function isSuspended(status: string) {
  return getStatusKind(status) === "suspended";
}

function isCompleted(status: string) {
  return getStatusKind(status) === "completed";
}

function getStatusMeta(status: string) {
  const statusKind = getStatusKind(status);

  switch (statusKind) {
    case "completed":
      return {
        label: "تکمیل شده",
        className:
          "border-[color:var(--info)]/20 bg-[color:var(--info)]/10 text-[color:var(--info)]",
      };

    case "in_progress":
      return {
        label: "فعال",
        className:
           "border-[color:var(--success)]/20 bg-[color:var(--success)]/10 text-[color:var(--success)]",
      };

    case "suspended":
      return {
        label: "تعلیق",
        className:
          "border-[color:var(--warning)]/20 bg-[color:var(--warning)]/10 text-[color:var(--warning)]",
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
  return new Intl.NumberFormat("fa-IR").format(Number(value || 0));
}

function getOwnerFullName(project: APIProject) {
  const firstName = project.owner_first_name?.trim() || "";
  const lastName = project.owner_last_name?.trim() || "";
  return `${firstName} ${lastName}`.trim() || "نامشخص";
}

function extractErrorMessage(err: any, fallback: string) {
  const data = err?.response?.data;

  if (typeof data === "string") return data;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.success === "string") return data.success;

  if (data && typeof data === "object") {
    const values = Object.values(data).flat();

    if (values.length > 0) {
      return values
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
        .join(" - ");
    }
  }

  return fallback;
}
function getProjectStatusPermissionMessage(
  err: any,
  action: "suspend" | "reopen",
) {
  const detail = err?.response?.data?.detail;

  if (detail === "You do not have permission to perform this action.") {
    return action === "reopen"
      ? "شما دسترسی لازم برای بازگشایی این پروژه را ندارید."
      : "شما دسترسی لازم برای معلق کردن این پروژه را ندارید.";
  }

  return null;
}

export default function ProjectsPage() {
  const { activeCompany } = useCompany();

  const [projectsList, setProjectsList] = useState<APIProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    project: APIProject | null;
    action: "suspend" | "reopen" | null;
  }>({
    open: false,
    project: null,
    action: null,
  });

  // JoinCompany فیلد join_id ندارد، پس از id استفاده می‌کنیم.
  const joinId = activeCompany?.id ?? null;

  const fetchProjects = useCallback(async () => {
    if (!joinId) {
      setProjectsList([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");

      const projectsRes = await api.get(`/projects/${joinId}/`);

      let projectsData: APIProject[] = [];

      if (Array.isArray(projectsRes?.data?.results)) {
        projectsData = projectsRes.data.results;
      } else if (Array.isArray(projectsRes?.data)) {
        projectsData = projectsRes.data;
      }

      setProjectsList(projectsData);
    } catch (err: any) {
      console.error("Error fetching projects:", {
        status: err?.response?.status,
        data: err?.response?.data,
      });

      setErrorMessage(
        extractErrorMessage(err, "دریافت لیست پروژه‌ها با خطا مواجه شد."),
      );
    } finally {
      setLoading(false);
    }
  }, [joinId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openStatusConfirm = (project: APIProject) => {
    const suspended = isSuspended(project.status);

    setConfirmState({
      open: true,
      project,
      action: suspended ? "reopen" : "suspend",
    });
  };

  const closeStatusConfirm = () => {
    if (actionLoadingId !== null) return;

    setConfirmState({
      open: false,
      project: null,
      action: null,
    });
  };

  const confirmProjectStatusChange = async () => {
    const project = confirmState.project;
    const action = confirmState.action;

    if (!joinId) {
      setErrorMessage("شناسه شرکت فعال معتبر نیست.");
      return;
    }

    if (!project || !action) return;

    const endpoint =
      action === "reopen"
        ? `/projects/${joinId}/${project.id}/reopen/`
        : `/projects/${joinId}/${project.id}/suspension/`;

    try {
      setActionLoadingId(project.id);
      setErrorMessage("");

      await api.post(endpoint);
      await fetchProjects();

      setConfirmState({
        open: false,
        project: null,
        action: null,
      });
    } catch (err: any) {
      console.error("Project status toggle error:", {
        endpoint,
        projectId: project.id,
        projectStatus: project.status,
        action,
        responseStatus: err?.response?.status,
        responseData: err?.response?.data,
      });

      const permissionMessage = getProjectStatusPermissionMessage(err, action);

      setErrorMessage(
        permissionMessage ??
          extractErrorMessage(
            err,
            action === "reopen"
              ? "بازگشایی پروژه با خطا مواجه شد."
              : "تعلیق پروژه با خطا مواجه شد.",
          ),
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const renderActionButtons = (project: APIProject) => {
    const suspended = isSuspended(project.status);
    const completed = isCompleted(project.status);
    const isLoadingThisProject = actionLoadingId === project.id;

    return (
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/dashboard/projects/${project.id}`}
          className="text-sm font-medium text-[var(--brand)] transition-colors hover:text-[var(--brand-hover)]"
        >
          مشاهده
        </Link>

        <div className="flex items-center gap-3">
          <Switch
            checked={!suspended}
            onChange={() => openStatusConfirm(project)}
            disabled={isLoadingThisProject || completed}
          />

          <div className="flex min-w-[88px] flex-col">
            <span className="text-xs font-medium text-[var(--text-primary)]">
              {suspended ? "بازگشایی" : "تعلیق"}
            </span>

            {completed ? (
              <span className="mt-1 text-[11px] text-[var(--success)]">
                پروژه تکمیل شده
              </span>
            ) : isLoadingThisProject ? (
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {suspended ? "در حال بازگشایی..." : "در حال تعلیق..."}
              </span>
            ) : (
              <span className="mt-1 text-[11px] text-[var(--text-muted)]">
                {suspended ? "پروژه غیرفعال است" : "پروژه فعال است"}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const confirmProject = confirmState.project;
  const confirmAction = confirmState.action;
  const isConfirmLoading =
    !!confirmProject && actionLoadingId === confirmProject.id;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <SectionTitle
            title="پروژه‌ها"
            description="لیست کامل پروژه‌های ثبت‌شده در سامانه VOLTEC"
          />
        </div>

        <div className="w-full sm:w-auto">
          <Link
            href="/dashboard/projects/create"
            className="block w-full sm:inline-block"
          >
            <Button className="w-full sm:w-auto">ایجاد پروژه جدید</Button>
          </Link>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

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
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--surface-soft)] text-[var(--text-secondary)]">
                    <tr className="border-b border-[var(--border)]">
                      <th className="px-4 py-3 text-right font-medium">کد</th>
                      <th className="px-4 py-3 text-right font-medium">
                        عنوان پروژه
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        کارفرما
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        مسئول پروژه
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        بودجه
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        هزینه‌کرد
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        پیشرفت
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        وضعیت
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        عملیات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {projectsList.map((project, index) => {
                      const statusMeta = getStatusMeta(project.status);
                      const ownerFullName = getOwnerFullName(project);

                      return (
                        <tr
                          key={project.id ?? index}
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
                            {renderActionButtons(project)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:hidden">
                {projectsList.map((project, index) => {
                  const statusMeta = getStatusMeta(project.status);
                  const ownerFullName = getOwnerFullName(project);
                  const suspended = isSuspended(project.status);
                  const completed = isCompleted(project.status);
                  const isLoadingThisProject = actionLoadingId === project.id;

                  return (
                    <div
                      key={project.id ?? index}
                      className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-[var(--text-secondary)]">
                            {project.code || `PRJ-${project.id}`}
                          </span>
                          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                            {project.title}
                          </h4>
                        </div>

                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusMeta.className}`}
                        >
                          {statusMeta.label}
                        </span>
                      </div>

                      <div className="my-1 grid grid-cols-2 gap-x-4 gap-y-2 border-y border-[var(--border)]/40 py-3 text-xs">
                        <div>
                          <span className="mb-1 block text-[var(--text-secondary)]">
                            کارفرما
                          </span>
                          <span className="font-medium text-[var(--text-primary)]">
                            {project.employer}
                          </span>
                        </div>

                        <div>
                          <span className="mb-1 block text-[var(--text-secondary)]">
                            مسئول پروژه
                          </span>
                          <span className="font-medium text-[var(--text-primary)]">
                            {ownerFullName}
                          </span>
                        </div>

                        <div>
                          <span className="mb-1 block text-[var(--text-secondary)]">
                            بودجه
                          </span>
                          <span className="font-medium text-[var(--text-primary)]">
                            {formatCurrency(project.budget)} تومان
                          </span>
                        </div>

                        <div>
                          <span className="mb-1 block text-[var(--text-secondary)]">
                            هزینه‌کرد
                          </span>
                          <span className="font-medium text-[var(--text-primary)]">
                            {formatCurrency(project.incurred_cost)} تومان
                          </span>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[var(--text-secondary)]">
                            پیشرفت:
                          </span>
                          <span className="text-xs font-semibold text-[var(--text-primary)]">
                            {project.progress ?? 0}٪
                          </span>
                        </div>

                        <div className="flex items-end justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={!suspended}
                              onChange={() => openStatusConfirm(project)}
                              disabled={isLoadingThisProject || completed}
                            />

                            <div className="flex min-w-[88px] flex-col">
                              <span className="text-xs font-medium text-[var(--text-primary)]">
                                {suspended ? "بازگشایی" : "تعلیق"}
                              </span>

                              {completed ? (
                                <span className="mt-1 text-[11px] text-[var(--success)]">
                                  پروژه تکمیل شده است
                                </span>
                              ) : isLoadingThisProject ? (
                                <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)]">
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  {suspended
                                    ? "در حال بازگشایی..."
                                    : "در حال تعلیق..."}
                                </span>
                              ) : (
                                <span className="mt-1 text-[11px] text-[var(--text-muted)]">
                                  {suspended
                                    ? "پروژه غیرفعال است"
                                    : "پروژه فعال است"}
                                </span>
                              )}
                            </div>
                          </div>

                          <Link
                            href={`/dashboard/projects/${project.id}`}
                            className="rounded-lg border border-[var(--brand)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--brand)] transition-colors hover:bg-[var(--brand)]/5 hover:text-[var(--brand-hover)]"
                          >
                            مشاهده پروژه
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {confirmState.open && confirmProject ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-xl">
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {confirmAction === "reopen" ? "بازگشایی پروژه" : "تعلیق پروژه"}
              </h3>

              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                {confirmAction === "reopen"
                  ? `آیا مطمئن هستید که می‌خواهید پروژه «${confirmProject.title}» را دوباره فعال کنید؟`
                  : `آیا مطمئن هستید که می‌خواهید پروژه «${confirmProject.title}» را تعلیق کنید؟`}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={closeStatusConfirm}
                disabled={isConfirmLoading}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--surface-soft)] disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={confirmProjectStatusChange}
                disabled={isConfirmLoading}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                  confirmAction === "reopen"
                    ? "bg-[color:var(--success)] text-[var(--text-on-dark)] hover:opacity-90"
                    : "bg-[color:var(--warning)] text-[var(--text-on-dark)] hover:opacity-90"
                }`}
              >
                {isConfirmLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {confirmAction === "reopen"
                      ? "در حال فعال‌سازی..."
                      : "در حال تعلیق..."}
                  </span>
                ) : confirmAction === "reopen" ? (
                  "فعال‌سازی پروژه"
                ) : (
                  "تعلیق پروژه"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
