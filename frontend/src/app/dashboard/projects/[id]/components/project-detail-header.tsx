"use client";

import React from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { ArrowRight, Settings } from "lucide-react";
import Link from "next/link";

interface HeaderProps {
  title: string;
  code: string;
  status: string;
}

export default function ProjectDetailHeader({ title, code, status }: HeaderProps) {
  // هماهنگ‌سازی رنگ نشانگر وضعیت پروژه
  const getStatusColor = (statusText: string) => {
    switch (statusText) {
      case "active":
      case "فعال":
      case "در حال اجرا":
        return "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200";
      case "suspended":
      case "متوقف":
        return "bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200";
      default:
        return "bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl border border-gray-100 bg-white p-6 shadow-sm dir-rtl text-right" style={{ direction: "rtl" }}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/projects" 
            className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-50 rounded-xl"
            title="بازگشت به لیست پروژه‌ها"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <Badge className={`${getStatusColor(status)} hover:bg-transparent border`}>
            {status === "active" ? "در حال اجرا" : status}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mr-8">کد پروژه: {code}</p>
      </div>

      <div className="flex items-center gap-2 mr-auto sm:mr-0">
        <Button  className="rounded-2xl gap-2 text-gray-600 border-gray-200">
          <Settings className="h-4 w-4" />
          <span>تنظیمات پروژه</span>
        </Button>
      </div>
    </div>
  );
}
