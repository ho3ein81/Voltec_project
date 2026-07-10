"use client";

import React from "react";
import { Card, CardContent } from "@/app/components/ui/card";
import { User, Coins, Calendar } from "lucide-react";
import { APIProjectDetail } from "../page"; // Import کردن تایپ از فایل اصلی

interface Props {
  project: APIProjectDetail;
}

export default function ProjectOverviewPanel({ project }: Props) {
  const ownerFullName = project.owner_first_name 
    ? `${project.owner_first_name} ${project.owner_last_name || ""}`.trim() 
    : "تعیین نشده";

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="rounded-2xl shadow-none border-[var(--border)] bg-transparent">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="rounded-2xl p-3 bg-[rgba(37,99,235,0.08)] text-[var(--info)]">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">مدیریت و کارفرما</p>
            <p className="mt-1 font-semibold text-[var(--text-primary)]">{ownerFullName}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">کارفرما: {project.employer}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-none border-[var(--border)] bg-transparent">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="rounded-2xl p-3 bg-[rgba(22,163,74,0.08)] text-[var(--success)]">
            <Coins className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-[var(--text-muted)]">بودجه و هزینه‌کرد</p>
            <p className="mt-1 font-semibold text-[var(--text-primary)]">
              {Number(project.budget).toLocaleString("fa-IR")} ریال
            </p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              هزینه‌کرد واقعی: {Number(project.incurred_cost).toLocaleString("fa-IR")} ریال
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-none border-[var(--border)] bg-transparent">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="rounded-2xl p-3 bg-[rgba(245,158,11,0.08)] text-[var(--brand-hover)]">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-[var(--text-muted)]">زمان تحویل و پیشرفت</p>
            <p className="mt-1 font-semibold text-[var(--text-primary)]">
              {project.delivery_time ? new Date(project.delivery_time).toLocaleDateString("fa-IR") : "نامشخص"}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 rounded-full bg-[var(--surface-soft)]">
                <div 
                  className="h-1.5 rounded-full bg-[var(--info)] transition-all" 
                  style={{ width: `${project.progress}%` }} 
                />
              </div>
              <span className="text-xs font-bold text-[var(--info)]">{project.progress}٪</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
