"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { SectionTitle } from "@/app/components/ui/section-title";
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

      setSuccess(
        data?.message || "با موفقیت به شرکت اضافه شدید. در حال انتقال..."
      );

      // redirect امن
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
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <Card className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <SectionTitle
          title="ورود با کد دعوت"
          description="کد دعوتی که از مدیر شرکت دریافت کرده‌اید را وارد کنید."
        />

        {!preview ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="کد دعوت"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-11"
                disabled={isBusy}
              />

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              {success && (
                <p className="text-sm text-emerald-600">{success}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isBusy || !trimmedCode}
            >
              {isChecking ? "در حال بررسی..." : "ادامه"}
            </Button>
          </form>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white/60 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--muted)] text-sm font-bold text-gray-700">
                  {preview.company?.name?.slice(0, 1)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">
                    دعوت به شرکت
                  </p>

                  <h3 className="truncate text-base font-semibold text-gray-900">
                    {preview.company?.name}
                  </h3>

                  {preview.role && (
                    <p className="mt-1 text-sm text-gray-500">
                      نقش: {preview.role}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {success && (
              <p className="text-sm text-emerald-600">{success}</p>
            )}

            <Button
              type="button"
              size="lg"
              className="w-full"
              onClick={handleJoin}
              disabled={isBusy}
            >
              {isJoining ? "در حال عضویت..." : "عضویت در شرکت"}
            </Button>

            <Button
              type="button"
              className="w-full"
              onClick={handleReset}
              disabled={isBusy}
            >
              تغییر کد
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
