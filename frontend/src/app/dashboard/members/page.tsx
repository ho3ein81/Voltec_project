"use client";

import { useEffect, useState } from "react";
import api from "@/app/components/lib/api";
import { useCompany } from "@/app/components/company/company-provider";
import { useToast } from "@/app/components/ui/use-toast";

import {
  Users,
  UserRound,
  ShieldCheck,
  CreditCard,
  CalendarDays,
  Loader2,
  UserMinus,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";

type Member = {
  id: number;
  user_first_name: string;
  user_last_name: string;
  user_national_id: string;
  access_level: string;
  department: string | null;
  created_at: string;
};

export default function MembersPage() {
  const { activeCompany } = useCompany();
  const { toast } = useToast();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kickLoadingId, setKickLoadingId] = useState<number | null>(null);

  const currentUserRole = activeCompany?.access_level;
  const isCurrentUserOwner =
    currentUserRole === "owner" ||
    currentUserRole === "مدیرعامل" ||
    currentUserRole === "مدیر عامل";

  const fetchMembers = async () => {
    if (!activeCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.get(`/tenants/members/${activeCompany.id}/`);

      let list: Member[] = [];

      if (Array.isArray(res.data)) {
        list = res.data;
      } else if (Array.isArray(res.data?.results)) {
        list = res.data.results;
      } else if (Array.isArray(res.data?.members)) {
        list = res.data.members;
      }

      setMembers(list);
    } catch (err) {
      console.error("Error fetching members:", err);
      setError("خطا در دریافت لیست اعضای شرکت");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [activeCompany?.id]);

  const handleKickMember = async (memberId: number, memberName: string) => {
    if (!activeCompany?.id) return;

    if (!window.confirm(`آیا از حذف ${memberName} از شرکت مطمئن هستید؟`)) return;

    try {
      setKickLoadingId(memberId);

      await api.delete(`/tenants/members/${activeCompany.id}/${memberId}/`);

      toast({
        title: `کاربر ${memberName} حذف شد.`,
      });

      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch (err) {
      console.error("Error kicking member:", err);
      toast({
        title: "خطا در حذف عضو",
      });
    } finally {
      setKickLoadingId(null);
    }
  };

  const getFullName = (m: Member) => {
    const fn = m.user_first_name?.trim() || "";
    const ln = m.user_last_name?.trim() || "";
    return `${fn} ${ln}`.trim() || "بدون نام";
  };

  const getBadgeStyle = (role: string) => {
    switch (role) {
      case "مدیرعامل":
      case "owner":
        return "bg-blue-500/10 text-blue-600 border-blue-200";
      case "مدیر":
      case "manager":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "کارمند":
      case "employee":
        return "bg-slate-500/10 text-slate-600 border-slate-200";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const formatDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString("fa-IR");
    } catch {
      return "نامشخص";
    }
  };

  return (
    <div className="p-6 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      
      <Card className="rounded-2xl border-[var(--border)] bg-[var(--surface)] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-[var(--text-primary)]">
            <Users className="h-5 w-5 text-[var(--brand)]" />
            مدیریت اعضا
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-muted)]">
            اعضای شرکت{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              {activeCompany?.company_name || "شرکت فعال"}
            </span>
          </p>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <Card className="rounded-2xl border-[var(--border)] bg-[var(--surface)] shadow-none">
          <CardHeader className="border-b border-[var(--border)] pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
              <UserRound className="h-4 w-4 text-[var(--brand)]" />
              لیست اعضا ({members.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-[var(--border)]">
              {members.map((member) => {
                const name = getFullName(member);
                const isSelf = member.access_level === activeCompany?.access_level;

                return (
                  <div
                    key={member.id}
                    className="flex flex-col gap-4 px-6 py-5 hover:bg-[var(--surface-soft)] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-[var(--brand-soft)] p-2 text-[var(--brand)]">
                        <ShieldCheck className="h-5 w-5" />
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[var(--text-primary)] sm:text-base">
                          {name}
                        </p>

                        <div className="flex flex-col gap-1 text-xs text-[var(--text-muted)] sm:text-sm">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5" />
                            <span>کد ملی: {member.user_national_id}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            <span>تاریخ عضویت: {formatDate(member.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* دکمه حذف –– فقط همین بخش تغییر کرده */}
                    <div className="flex items-center gap-3">
                      
                      {isCurrentUserOwner && !isSelf ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleKickMember(member.id, name)}
                          disabled={kickLoadingId === member.id}
                          className="
                            h-9 w-9 p-0 rounded-xl
                            text-red-500
                            hover:text-red-600 
                            hover:bg-red-500/10
                            flex items-center justify-center
                            transition-all
                          "
                        >
                          {kickLoadingId === member.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-5 w-5" />
                          )}
                        </Button>
                      ) : null}

                      <Badge
                        className={`border px-3 py-1 text-xs font-medium ${getBadgeStyle(
                          member.access_level
                        )}`}
                      >
                        {member.access_level}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
