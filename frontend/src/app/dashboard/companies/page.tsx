"use client";

import { useState, useEffect } from "react";
import { useCompany } from "@/app/components/company/company-provider";
import api from "@/app/components/lib/api";
import { useToast } from "@/app/components/ui/use-toast";

import {
  Building2,
  Check,
  ArrowLeftRight,
  LogOut,
  ShieldAlert,
  User,
  X,
  Users,
  Shield,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";

interface Member {
  id: number;
  user_first_name: string | null;
  user_last_name: string | null;
  user_national_id: string;
  access_level: string;
}

interface TargetCompany {
  id: number;
  name: string;
}

export default function MyCompaniesPage() {
  const {
    companies,
    activeCompany,
    setActiveCompany,
    refreshCompanies,
    loading,
  } = useCompany();

  const { toast } = useToast();

  const [leavingId, setLeavingId] = useState<number | null>(null);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [transferring, setTransferring] = useState(false);

  const [targetCompany, setTargetCompany] = useState<TargetCompany | null>(null);

  // وضعیت برای نگهداری تعداد اعضای هر شرکت به صورت کلید-مقدار (companyId -> count)
  const [membersCountMap, setMembersCountMap] = useState<Record<number, number>>({});
  const [loadingCounts, setLoadingCounts] = useState<Record<number, boolean>>({});

  // دریافت تنبل (Lazy Fetch) تعداد اعضای شرکت‌ها پس از بارگذاری لیست شرکت‌ها
  useEffect(() => {
    if (companies && companies.length > 0) {
      companies.forEach((company: any) => {
        const companyId = company.id;
        // اگر قبلاً تعداد اعضا دریافت شده باشد یا در حال دریافت باشد، دوباره درخواست نزن
        if (membersCountMap[companyId] !== undefined || loadingCounts[companyId]) {
          return;
        }
        fetchCompanyMembersCount(companyId);
      });
    }
  }, [companies]);

  const fetchCompanyMembersCount = async (companyId: number) => {
    setLoadingCounts((prev) => ({ ...prev, [companyId]: true }));
    try {
      const response = await api.get(`/tenants/members/${companyId}/`);
      const list = normalizeMembersResponse(response.data);
      setMembersCountMap((prev) => ({ ...prev, [companyId]: list.length }));
    } catch (error) {
      console.error(`Error fetching members count for company ${companyId}:`, error);
    } finally {
      setLoadingCounts((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  const getCompanyName = (company: any) => {
    return company?.company_name || company?.name || "شرکت بدون نام";
  };

  // استخراج و نرمال‌سازی نقش کاربر از فیلدهای مختلف پاسخ API
  const getUserRoleLabel = (company: any) => {
    const raw =
      company?.access_level ??
      company?.role ??
      company?.membership_role ??
      company?.user_role;

    if (!raw) return null;

    const value = String(raw).toLowerCase().trim();

    if (value === "owner" || value === "مدیرعامل" || value.includes("مالک")) {
      return "مدیرعامل";
    }
    if (value === "admin" || value === "administrator" || value.includes("مدیر")) {
      return "مدیر سیستم";
    }
    if (value === "staff" || value === "employee" || value.includes("کارمند") || value.includes("عضو")) {
      return "کارمند / عضو";
    }
    
    return raw; // در صورت عدم تطبیق، مقدار اصلی را برگردان
  };

  const getErrorMessage = (error: any): string => {
    const data = error?.response?.data;
    if (!data) return "";
    if (typeof data === "string") return data;

    if (data.access_level && Array.isArray(data.access_level)) {
      return `خطا در نقش: ${data.access_level[0]}`;
    }

    return (
      data?.error ||
      data?.detail ||
      data?.message ||
      data?.non_field_errors?.[0] ||
      ""
    );
  };

  const isOwnerLeaveError = (error: any): boolean => {
    const status = error?.response?.status;
    const msg = getErrorMessage(error);

    return (
      status === 400 &&
      (
        msg.includes("مدیرعامل") ||
        msg.includes("امکان خروج") ||
        msg.toLowerCase().includes("owner")
      )
    );
  };

  const isOwnerAccessLevel = (accessLevel?: string | null): boolean => {
    if (!accessLevel) return false;
    const normalized = accessLevel.trim().toLowerCase();
    return (
      normalized === "owner" ||
      normalized === "مدیرعامل" ||
      normalized.includes("مدیرعامل") ||
      normalized.includes("مالک")
    );
  };

  const normalizeMembersResponse = (data: any): Member[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.members)) return data.members;
    return [];
  };

  const getMemberFullName = (member: Member): string => {
    const firstName = member.user_first_name?.trim() || "";
    const lastName = member.user_last_name?.trim() || "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "کاربر بدون نام";
  };

  const closeTransferModal = () => {
    if (transferring) return;
    setShowTransferModal(false);
    setTargetCompany(null);
    setMembers([]);
    setSelectedMemberId(null);
  };

  const handleSwitchCompany = async (company: any) => {
    try {
      await setActiveCompany(company);
      toast({
        title: `شرکت فعال تغییر یافت: ${getCompanyName(company)}`
      });
    } catch (err) {
      toast({
        title: "خطا در تغییر شرکت فعال"
      });
    }
  };

  const fetchMembers = async (joinId: number) => {
    setLoadingMembers(true);
    try {
      const response = await api.get(`/tenants/members/${joinId}/`);
      const list = normalizeMembersResponse(response.data);

      const eligibleMembers = list.filter(
        (member) => !isOwnerAccessLevel(member.access_level)
      );
      setMembers(eligibleMembers);
    } catch (error: any) {
      toast({
        title: getErrorMessage(error) || "خطا در دریافت اعضا"
      });
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleLeaveCompany = async (joinId: number, companyName: string) => {
    setLeavingId(joinId);
    try {
      await api.post(`/tenants/left/${joinId}/`);
      toast({
        title: "خروج با موفقیت انجام شد"
      });
      await refreshCompanies();
    } catch (error: any) {
      if (isOwnerLeaveError(error)) {
        setTargetCompany({ id: joinId, name: companyName });
        setShowTransferModal(true);
        await fetchMembers(joinId);
        return;
      }
      toast({
        title: getErrorMessage(error) || "خطا در خروج"
      });
    } finally {
      setLeavingId(null);
    }
  };

  const handleTransferAndLeave = async () => {
    if (!targetCompany || !selectedMemberId) return;

    setTransferring(true);
    try {
      await api.patch(
        `/tenants/members/${targetCompany.id}/${selectedMemberId}/`,
        { access_level: "owner" }
      );

      toast({
        title: "مدیریت واگذار شد"
      });

      await api.post(`/tenants/left/${targetCompany.id}/`);

      toast({
        title: "خروج با موفقیت انجام شد"
      });

      setShowTransferModal(false);
      await refreshCompanies();
    } catch (error: any) {
      toast({
        title: getErrorMessage(error) || "خطا در عملیات"
      });
    } finally {
      setTransferring(false);
      setLeavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">لیست شرکت‌های من</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">تغییر شرکت فعال یا خروج از سازمان</p>
      </div>

      <div className="space-y-4">
        {companies.map((company: any) => {
          const isActive = activeCompany?.id === company.id;
          const name = getCompanyName(company);
          const isLeaving = leavingId === company.id;
          const roleLabel = getUserRoleLabel(company);
          
          const membersCount = membersCountMap[company.id];
          const isCountLoading = loadingCounts[company.id];

          return (
            <Card key={company.id} className={`p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between transition-colors ${isActive ? "border-[var(--brand)] bg-[var(--brand-soft)]/10" : "hover:border-[var(--brand-soft)]"}`}>
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-[var(--brand)] text-white" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"}`}>
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{name}</span>
                    {/* نمایش نقش با Badge آبی و استایل مدرن */}
                    {roleLabel && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-400/20">
                        <Shield className="h-3 w-3" />
                        {roleLabel}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400 flex-wrap">
                    <span>شناسه عضویت: {company.id}</span>
                    
                    {/* نمایش تعداد اعضا */}
                    <span className="flex items-center gap-1.5 border-r pr-4 border-zinc-200 dark:border-zinc-800">
                      <Users className="h-3.5 w-3.5 text-zinc-400" />
                      {isCountLoading ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-zinc-400 border-t-transparent inline-block" />
                      ) : (
                        <span>
                          {membersCount !== undefined ? `${membersCount} عضو` : "در حال دریافت..."}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" size="sm" onClick={() => handleLeaveCompany(company.id, name)} disabled={isLeaving} className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20">
                  {isLeaving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent" /> : <LogOut className="h-4 w-4" />}
                  خروج
                </Button>
                {isActive ? (
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center dark:bg-emerald-950/30 dark:text-emerald-400">
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => handleSwitchCompany(company)}>
                    <ArrowLeftRight className="h-4 w-4" />
                    سوییچ
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <h3 className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-500">
                <ShieldAlert className="h-5 w-5" /> انتقال مدیریت
              </h3>
              <button onClick={closeTransferModal} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <p className="mb-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                شما مدیرعامل <strong>{targetCompany?.name}</strong> هستید. لطفاً جانشین خود را انتخاب کنید:
              </p>

              {loadingMembers ? (
                <div className="flex justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
                </div>
              ) : members.length === 0 ? (
                <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-6 text-center dark:bg-red-950/20 text-red-600 text-sm">
                  عضوی برای جایگزینی یافت نشد.
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => setSelectedMemberId(member.id)}
                      className={`w-full rounded-lg border p-3 text-right transition-all ${
                        selectedMemberId === member.id
                          ? "border-[var(--brand)] bg-[var(--brand-soft)]/10 ring-1 ring-[var(--brand)]"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <User className="h-4 w-4 text-zinc-600" />
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold">
                              {getMemberFullName(member)}
                            </div>
                            <div className="text-xs text-zinc-500">
                              کد ملی: {member.user_national_id}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`h-4 w-4 rounded-full border ${
                            selectedMemberId === member.id
                              ? "border-[var(--brand)] bg-[var(--brand)]"
                              : "border-zinc-300"
                          }`}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-3 border-t pt-4 dark:border-zinc-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={closeTransferModal}
                disabled={transferring}
              >
                انصراف
              </Button>

              <Button
                size="sm"
                disabled={!selectedMemberId || transferring}
                onClick={handleTransferAndLeave}
                className="bg-red-500 text-white hover:bg-red-600"
              >
                {transferring ? "در حال واگذاری..." : "واگذاری و خروج"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
