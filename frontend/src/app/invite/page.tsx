"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ScanSearch, Sparkles, ArrowLeft, ShieldCheck } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { searchInviteCode, joinToCompany } from "@/app/components/lib/invite";

type InvitePreviewResponse = {
  company: {
    name: string;
    type_company?: string;
    province?: string;
    city?: string;
    status?: string;
  };
  company_id: number;
  search_id: number;
  success?: string;
  token?: {
    token: string;
  };
  role?: string;
  logo?: string | null;
};

export default function InvitePage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [preview, setPreview] = useState<InvitePreviewResponse | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const isBusy = isChecking || isJoining;
  const trimmedCode = useMemo(() => code.trim(), [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!trimmedCode) {
      setError("لطفاً کد دعوت را وارد کنید.");
      setSuccess("");
      setPreview(null);
      return;
    }

    setIsChecking(true);
    setError("");
    setSuccess("");
    setPreview(null);

    try {
      const data = await searchInviteCode(trimmedCode);
      setPreview(data);
      setSuccess(data?.success || "دعوت معتبر است. اطلاعات شرکت را بررسی کنید.");
    } catch (err: any) {
      setPreview(null);
      setSuccess("");
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "کد دعوت معتبر نیست یا منقضی شده است."
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleJoin = async () => {
    if (!preview) return;

    setIsJoining(true);
    setError("");
    setSuccess("");

    try {
      const data = await joinToCompany(
        preview.company_id,
        preview.search_id,
        preview.token?.token
      );

      setSuccess(data?.message || "با موفقیت به شرکت اضافه شدید. در حال انتقال...");

      setTimeout(() => {
        router.replace("/dashboard");
      }, 1000);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "خطا در عضویت در شرکت."
      );
    } finally {
      setIsJoining(false);
    }
  };

  const handleReset = () => {
    setPreview(null);
    setError("");
    setSuccess("");
    setCode("");
  };

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[var(--surface-soft)] font-sans antialiased text-[var(--text-primary)]">
      
      {/* ۱. گرادینت نرم پس‌زمینه لایت‌مود با هاله‌های ملایم زرد برند */}
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_top_right,rgba(245,183,0,0.08),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(245,183,0,0.03),transparent_40%),linear-gradient(to_bottom,var(--background),var(--surface-soft))]" />

      {/* ۲. شبکه خطوط گرید ظریف خاکستری برای القای حس مهندسی و تمیزی */}
      <div className="absolute inset-0 -z-10 opacity-[0.4] [background-image:linear-gradient(to_right,rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.03)_1px,transparent_1px)] [background-size:40px_40px]" />

      {/* ۳. اورب نوری زرد/طلایی بسیار ملایم در پشت کارت */}
      <div className="absolute left-[5%] top-[10%] -z-10 h-[380px] w-[380px] rounded-full bg-[var(--brand)]/10 blur-[130px] animate-pulse" />

      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12 md:px-8">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.2fr_460px]">
          
          {/* بخش توضیحات برندینگ (سمت راست دسکتاپ - هماهنگ با RTL) */}
          <div className="hidden lg:block space-y-8 order-last">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] shadow-sm backdrop-blur-md">
              <Sparkles className="h-4.5 w-4.5 text-[var(--brand)]" />
              <span>سامانه هوشمند مدیریت اعضا</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-black leading-[1.3] text-[var(--text-primary)] xl:text-5xl">
                به فضای کاری خود
                <span className="block mt-2 bg-gradient-to-r from-[var(--brand-hover)] to-[var(--brand)] bg-clip-text text-transparent">
                  متصل شوید
                </span>
              </h1>

              <p className="max-w-md text-base leading-8 text-[var(--text-secondary)]">
                با استفاده از کد دعوتی که از مدیر سامانه یا شرکت دریافت کرده‌اید، می‌توانید مستقیماً و به صورت کاملاً امن عضو فضای سازمانی خود شوید.
              </p>
            </div>

            {/* کارت‌های ویژگی کوچک لایت‌مود */}
            <div className="grid max-w-md grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm hover:shadow-md transition-shadow">
                <ShieldCheck className="mb-3.5 h-6 w-6 text-[var(--success)]" />
                <h3 className="mb-1.5 font-bold text-[var(--text-primary)]">تأیید اصالت</h3>
                <p className="text-xs leading-5 text-[var(--text-muted)]">
                  بررسی آنی و زنده اعتبار دعوت‌نامه
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm hover:shadow-md transition-shadow">
                <Building2 className="mb-3.5 h-6 w-6 text-[var(--brand)]" />
                <h3 className="mb-1.5 font-bold text-[var(--text-primary)]">دسترسی سریع</h3>
                <p className="text-xs leading-5 text-[var(--text-muted)]">
                  اتصال خودکار به منابع تخصیص‌یافته
                </p>
              </div>
            </div>
          </div>

          {/* کارت فرم تعاملی با افکت Frosted Glass لایت‌مود و سایه نرم و عمیق */}
          <Card className="relative w-full overflow-hidden rounded-[30px] border border-white/80 bg-white/70 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.06)] backdrop-blur-xl md:p-8">
            
            {/* لبه بالایی درخشان */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand)]/30 to-transparent" />

            {/* هدر کارت */}
            <div className="mb-8 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-[var(--text-primary)]">
                  ورود با کد دعوت
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  کد دریافتی از سازمان را در کادر زیر وارد کنید.
                </p>
              </div>

              <div className="hidden h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)] shadow-sm sm:flex">
                <ScanSearch className="h-5.5 w-5.5 text-[var(--brand-hover)]" />
              </div>
            </div>

            {/* حالت ۱: فرم دریافت کد دعوت */}
            {!preview ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[var(--text-secondary)]">
                    شناسه یا کد دعوت
                  </label>

                  <Input
                    placeholder="مثال: VOLTEC-INVITE-2026"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    dir="ltr"
                    className="h-12 rounded-2xl border-[var(--border)] bg-[var(--surface)] text-center font-mono text-base tracking-wider text-[var(--text-primary)] placeholder:text-[var(--text-muted)]/50 focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand)]/10"
                    disabled={isBusy}
                  />
                </div>

                {error && (
                  <div className="rounded-2xl border border-[var(--error)]/20 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-[var(--error)] shadow-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-[var(--success)]/20 bg-green-50 px-4 py-3 text-sm font-semibold leading-6 text-[var(--success)] shadow-sm">
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-base font-bold text-[var(--surface-dark)] shadow-sm transition-all hover:scale-[1.01]"
                  disabled={isBusy || !trimmedCode}
                >
                  {isChecking ? "در حال بررسی شناسه..." : "بررسی و ادامه"}
                </Button>
              </form>
            ) : (
              /* حالت ۲: پیش‌نمایش شرکت یافته شده و تایید نهایی */
              <div className="space-y-6">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-xl font-black text-[var(--brand-hover)] border border-[var(--brand)]/10">
                      {preview.company?.name ? preview.company.name.charAt(0) : "🏢"}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-xs font-bold tracking-wider text-[var(--brand-hover)]">
                        پیش‌نمایش دعوت‌نامه
                      </p>

                      <h3 className="truncate text-lg font-bold text-[var(--text-primary)]">
                        {preview.company?.name}
                      </h3>

                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {preview.role && (
                          <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text-secondary)]">
                            نقش: {preview.role}
                          </span>
                        )}
                        {preview.company?.city && (
                          <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--text-muted)]">
                            {preview.company.city}
                          </span>
                        )}
                        {preview.company?.type_company && (
                          <span className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 py-0.5 text-xs text-[var(--text-muted)]">
                            {preview.company.type_company}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-[var(--error)]/20 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-[var(--error)] shadow-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border border-[var(--success)]/20 bg-green-50 px-4 py-3 text-sm font-semibold leading-6 text-[var(--success)] shadow-sm">
                    {success}
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    type="button"
                    size="lg"
                    className="h-12 w-full rounded-2xl bg-[var(--success)] hover:bg-[var(--success)]/90 text-base font-bold text-white shadow-sm transition-all hover:scale-[1.01]"
                    onClick={handleJoin}
                    disabled={isBusy}
                  >
                    {isJoining ? "در حال عضویت..." : "تأیید و ورود به شرکت"}
                  </Button>

                  <Button
                    type="button"
                    className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
                    onClick={handleReset}
                    disabled={isBusy}
                  >
                    <ArrowLeft className="ml-2 h-4 w-4" />
                    تغییر و ثبت مجدد کد
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
