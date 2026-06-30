"use client";

import { useEffect, useState } from "react";
import { ShieldAlert , Building2 } from "lucide-react";
import {
  createInviteCode,
  deleteInviteCode,
} from "@/app/components/lib/invite";

import api from "@/app/components/lib/api";

import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { SectionTitle } from "@/app/components/ui/section-title";
import { useToast } from "@/app/components/ui/use-toast";

interface InviteCode {
  id: number;
  token: string;
  expired_at: string | null;
  created_at: string;
  max_uses: number;
  used_count: number;
}

function ForbiddenState() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-full max-w-md text-center rounded-2xl border p-10 bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[var(--error)] text-2xl">
          <ShieldAlert size={28} strokeWidth={1.5} />
        </div>

        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          دسترسی ندارید
        </h2>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
          این بخش فقط برای مدیر شرکت در دسترس است.
        </p>

        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--brand)] text-black hover:bg-[var(--brand-hover)] transition"
        >
          بازگشت
        </button>
      </div>
    </div>
  );
}

function NoCompanyState() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-full max-w-md text-center rounded-2xl border p-10 bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <div className="text-3xl mb-4"><div className="flex justify-center mb-4">
  <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-gray-100">
    <Building2 className="w-8 h-8 text-gray-600" />
  </div>
</div>
</div>

        <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
          وارد گروهی نشده‌اید
        </h2>

        <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
          شما هنوز وارد گروهی نشده‌اید یا گروهی نساخته‌اید.
        </p>

       <Button
  onClick={() =>
    (window.location.href = "/admin/company-registration/create")
  }
>
  ایجاد گروه
</Button>

      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="text-3xl mb-3">📨</div>

      <h3 className="font-semibold text-[var(--text-primary)] mb-1">
        هنوز کد دعوتی ایجاد نشده
      </h3>

      <p className="text-sm text-[var(--text-muted)]">
        برای دعوت اعضای تیم یک کد دعوت بسازید
      </p>
    </div>
  );
}

function InviteStatus(invite: InviteCode) {
  const now = new Date();

  if (invite.expired_at && new Date(invite.expired_at) < now) {
    return (
      <span className="text-xs px-2 py-1 rounded-md bg-red-50 text-red-600">
        منقضی
      </span>
    );
  }

  if (invite.used_count >= invite.max_uses) {
    return (
      <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-600">
        تکمیل شده
      </span>
    );
  }

  return (
    <span className="text-xs px-2 py-1 rounded-md bg-green-50 text-green-600">
      فعال
    </span>
  );
}

export default function TeamPage() {
  const { toast } = useToast();

  const [joinId, setJoinId] = useState<number | null>(null);
  const [invites, setInvites] = useState<InviteCode[]>([]);
  const [expireDate, setExpireDate] = useState("");
  const [maxUses, setMaxUses] = useState(1);

  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [companyLoaded, setCompanyLoaded] = useState(false);
  const [noCompany, setNoCompany] = useState(false);

  const loadJoinCompany = async () => {
    try {
      const res = await api.get("/tenants/");
      const companies = res.data.results || [];

      if (companies.length > 0) {
        setJoinId(companies[0].id);
      } else {
        setNoCompany(true);
      }
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setForbidden(true);
      }
    } finally {
      setCompanyLoaded(true);
    }
  };

  const loadInvites = async (joinId: number) => {
    try {
      const res = await api.get(`/tenants/company-invite/${joinId}/`);
      setInvites(res.data.results || []);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setForbidden(true);
      }
    }
  };

  useEffect(() => {
    loadJoinCompany();
  }, []);

  useEffect(() => {
    if (!joinId) return;
    loadInvites(joinId);
  }, [joinId]);

  const handleCreate = async () => {
    if (!joinId) return;

    if (!expireDate) {
      toast({
        title: "تاریخ انقضا را وارد کنید",
      });
      return;
    }

    try {
      setLoading(true);

      await createInviteCode(joinId, {
        expired_at: expireDate,
        max_uses: maxUses,
      });

      toast({
        title: "کد دعوت ساخته شد",
      });

      setExpireDate("");
      setMaxUses(1);

      await loadInvites(joinId);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setForbidden(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (codeId: number) => {
    if (!joinId) return;

    try {
      await deleteInviteCode(joinId, codeId);

      toast({
        title: "کد دعوت حذف شد",
      });

      await loadInvites(joinId);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        setForbidden(true);
      }
    }
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);

    toast({
      title: "کد دعوت کپی شد",
    });
  };

  if (forbidden) return <ForbiddenState />;

  if (!companyLoaded) {
    return <div className="p-6">در حال بارگذاری...</div>;
  }

  if (noCompany) {
    return <NoCompanyState />;
  }

  return (
    <div className="space-y-8">
      <SectionTitle title="مدیریت کدهای دعوت" />

      <Card className="p-6 space-y-4">
        <Input
          type="date"
          value={expireDate}
          onChange={(e) => setExpireDate(e.target.value)}
        />

        <Input
          type="number"
          value={maxUses}
          onChange={(e) => setMaxUses(Number(e.target.value))}
          placeholder="حداکثر تعداد استفاده"
        />

        <Button onClick={handleCreate} disabled={loading}>
          {loading ? "در حال ساخت..." : "ایجاد کد دعوت"}
        </Button>
      </Card>

      <Card className="p-6 border border-[var(--border)] rounded-2xl bg-[var(--surface)]">
        <h3 className="mb-6 text-lg font-semibold text-[var(--text-primary)]">
          کدهای دعوت
        </h3>

        {invites.length === 0 && <EmptyState />}

        <div className="space-y-2">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="group flex items-center justify-between rounded-xl px-4 py-3 transition hover:bg-[var(--surface-soft)]"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[15px] font-semibold tracking-wide">
                    {invite.token}
                  </span>

                  <InviteStatus {...invite} />

                  <button
                    onClick={() => handleCopy(invite.token)}
                    className="opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--brand)] transition text-sm"
                  >
                    کپی
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>
                    {new Date(invite.created_at).toLocaleDateString("fa-IR")}
                  </span>

                  <span className="opacity-40">•</span>

                  <span>
                    {invite.expired_at
                      ? new Date(invite.expired_at).toLocaleDateString("fa-IR")
                      : "بدون انقضا"}
                  </span>

                  <span className="opacity-40">•</span>

                  <span>
                    {invite.used_count}/{invite.max_uses}
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                className="text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-red-50 transition"
                onClick={() => handleDelete(invite.id)}
              >
                حذف
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
