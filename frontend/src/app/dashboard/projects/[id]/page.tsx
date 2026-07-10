"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Loader2, AlertCircle, Folder, FileText, FileCheck, DollarSign, HardDrive, BarChart3 } from "lucide-react";
import api from "@/app/components/lib/api";
import { useCompany } from "@/app/components/company/company-provider";

// وارد کردن پنل‌های جدید
import ProjectDetailHeader from "./components/project-detail-header";
import ProjectOverviewPanel from "./components/project-overview-panel";
import ProjectContractsPanel from "./components/project-contracts-panel";
// سایر پنل‌ها را نیز به همین صورت Import کنید...

// تایپ دقیق پروژه برای پاس دادن به کامپوننت‌ها
export type APIProjectDetail = {
  id: number;
  code: string;
  title: string;
  employer: string;
  budget: number;
  incurred_cost: number;
  progress: number;
  status: string; 
  delivery_time: string;
  owner_first_name: string | null;
  owner_last_name: string | null;
};

const tabs = [
  { key: "overview", label: "اطلاعات کلی", icon: Folder },
  { key: "contracts", label: "قراردادها", icon: FileText },
  { key: "statements", label: "صورت‌وضعیت‌ها", icon: FileCheck },
  { key: "finance", label: "امور مالی", icon: DollarSign },
  { key: "claims", label: "مطالبات", icon: AlertCircle },
  { key: "technicalDocs", label: "اسناد فنی", icon: HardDrive },
  { key: "reports", label: "گزارش‌ها", icon: BarChart3 },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { activeCompany } = useCompany();
  
  const projectId = params?.id as string;
  const joinId = activeCompany?.id;
  
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [project, setProject] = useState<APIProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjectDetail = async () => {
      if (!projectId || projectId === "undefined" || !joinId) return;
      try {
        setLoading(true);
        const response = await api.get(`/projects/${joinId}/${projectId}/`);
        setProject(response.data);
      } catch (err) {
        console.error("خطا در دریافت جزئیات پروژه:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProjectDetail();
  }, [projectId, joinId]);

  if (loading || !joinId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[var(--text-secondary)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand)] mb-4" />
        <p className="text-sm font-medium">در حال بارگذاری اطلاعات پروژه...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-[var(--error)] mb-4" />
        <p className="text-lg font-semibold" style={{ color: "var(--error)" }}>پروژه مورد نظر یافت نشد.</p>
        <Button onClick={() => router.push("/dashboard/projects")} className="mt-4 rounded-2xl">بازگشت به لیست پروژه‌ها</Button>
      </div>
    );
  }

  // منطق نمایش محتوای هر تب به صورت داینامیک
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <ProjectOverviewPanel project={project} />;
      case "contracts":
        return <ProjectContractsPanel projectId={projectId} />;
      // سایر Caseها را به همین صورت اضافه کنید
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
            <HardDrive className="h-12 w-12 opacity-20 mb-4" />
            <p>این بخش در حال اتصال به ماژول مربوطه می‌باشد.</p>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 text-right" style={{ direction: "rtl" }}>
      <ProjectDetailHeader title={project.title} code={project.code} status={project.status} />

      {/* سیستم تب‌بندی */}
      <div className="rounded-3xl p-2 shadow-sm" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition-all duration-200"
                style={isActive ? {
                  background: "var(--brand-soft)",
                  color: "var(--brand-hover)",
                  border: "1px solid var(--brand)",
                  boxShadow: "0 4px 14px rgba(245, 183, 0, 0.12)",
                } : {
                  color: "var(--text-secondary)",
                  border: "1px solid transparent",
                }}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* محتوای تب‌ها (صدا زدن تابع رندر) */}
      <div className="rounded-3xl p-6 shadow-sm min-h-[400px]" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {renderTabContent()}
      </div>
    </div>
  );
}
