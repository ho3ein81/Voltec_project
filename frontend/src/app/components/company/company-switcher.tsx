"use client";

import { useEffect, useRef, useState } from "react";
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Plus, 
  KeyRound 
} from "lucide-react";
import { useRouter } from "next/navigation";

import { useCompany } from "./company-provider";
import type {
  JoinCompany,
  MyCompaniesResponseItem,
} from "./company-types";

import api from "@/app/components/lib/api";

// =============================
// Helper Function
// =============================
const getCompanyName = (company: any): string => {
  if (!company) return "انتخاب شرکت";
  return (
    company.company_name?.trim() ||
    company.title?.trim() ||
    company.name?.trim() ||
    `شرکت #${company.id}`
  );
};

export default function CompanySwitcher() {
  const router = useRouter();
  const { companies, activeCompany, setActiveCompany } = useCompany();

  const [open, setOpen] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const switchCompany = async (item: MyCompaniesResponseItem) => {
    if (activeCompany?.id === item.id) {
      setOpen(false);
      return;
    }

    try {
      setLoadingId(item.id);
      await api.post(`/tenants/${item.id}/`);
      setActiveCompany(item as JoinCompany);
      setOpen(false);
    } catch (error) {
      console.error("Switch company error:", error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleJoinWithCode = () => {
    setOpen(false);
    // انتقال به روت پذیرش کد دعوت در پروژه
    router.push("/invite");
  };

  const handleCreateCompany = () => {
    setOpen(false);
    // انتقال به صفحه ثبت شرکت جدید
    router.push("/admin/company-registration/create");
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="
          flex items-center gap-2
          rounded-full border border-[var(--border)]
          bg-[var(--surface)] px-3.5 py-2
          text-sm font-semibold text-[var(--text-primary)]
          shadow-sm transition duration-200
          hover:bg-[var(--surface-soft)]
        "
      >
        <Building2 className="h-4 w-4 text-[var(--brand)]" />

        <span className="max-w-[140px] truncate">
          {getCompanyName(activeCompany)}
        </span>

        <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
      </button>

      {open && (
        <div
          className="
            absolute left-0 md:right-0 mt-2 w-72
            overflow-hidden rounded-2xl
            border border-[var(--border)]
            bg-[var(--surface)] shadow-lg
            z-50 animate-in fade-in slide-in-from-top-2 duration-150
          "
        >
          {/* Header */}
          <div className="border-b border-[var(--border)] px-4 py-3 bg-[var(--surface-soft)]/50">
            <div className="text-sm font-bold text-[var(--text-primary)]">
              شرکت‌های من
            </div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">
              جهت تغییر شرکت فعال روی آن کلیک کنید
            </div>
          </div>

          {/* List */}
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {companies.length === 0 ? (
              <div className="px-3 py-8 text-center text-xs text-[var(--text-muted)]">
                شرکتی یافت نشد
              </div>
            ) : (
              companies.map((item) => {
                const isActive = activeCompany?.id === item.id;
                const isLoading = loadingId === item.id;
                const companyName = getCompanyName(item);

                return (
                  <button
                    key={item.id}
                    disabled={isLoading}
                    onClick={() => switchCompany(item)}
                    className="
                      flex w-full items-center
                      justify-between rounded-xl
                      px-3 py-2 text-right
                      transition duration-150
                      hover:bg-[var(--surface-soft)]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex h-9 w-9
                          items-center justify-center
                          rounded-xl bg-[var(--surface-soft)]
                          border border-[var(--border)]
                        "
                      >
                        <Building2 className="h-4 w-4 text-[var(--text-muted)]" />
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-[var(--text-primary)]">
                          {companyName}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {item.access_level || "عضو ساده"}
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <Check className="h-4 w-4 text-[var(--brand)]" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--border)]" />

          {/* Action Footer */}
          <div className="p-2 bg-[var(--surface-soft)]/30 space-y-1">
            <button
              onClick={handleJoinWithCode}
              className="
                flex w-full items-center gap-2 rounded-xl
                px-3 py-2 text-right text-xs font-semibold
                text-[var(--text-primary)] transition duration-150
                hover:bg-[var(--surface-soft)]
              "
            >
              <KeyRound className="h-4 w-4 text-[var(--text-muted)]" />
              <span>پیوستن با کد دعوت</span>
            </button>

            <button
              onClick={handleCreateCompany}
              className="
                flex w-full items-center gap-2 rounded-xl
                px-3 py-2 text-right text-xs font-semibold
                text-[var(--text-primary)] transition duration-150
                hover:bg-[var(--surface-soft)]
              "
            >
              <Plus className="h-4 w-4 text-[var(--text-muted)]" />
              <span>ایجاد شرکت جدید</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
