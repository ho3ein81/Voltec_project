"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import api from "@/app/components/lib/api";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, X, Check, XCircle } from "lucide-react";


// --- ثابت‌ها ---
const COMPANY_TYPE_LABELS: Record<string, string> = {
  public_joint_stock: "سهامی عام",
  private_joint_stock: "سهامی خاص",
  llc: "مسئولیت محدود",
  limited_liability: "مسئولیت محدود",
  solidarity: "تضامنی",
  proportional: "نسبی",
  mixed_joint_stock: "مختلط سهامی",
  mixed_non_joint_stock: "مختلط غیرسهامی",
  cooperative: "تعاونی",
};

type CompanyRequest = {
  first_name: string;
  last_name: string;
  company_name: string;
  national_id: string;
  registration_number: string;
  description: string;
  type_company: string;
  province_name: string;
  city_name: string;
  status: string;
  created_at: string;
  reject_reason: string | null;
};

export default function EditCompanyRequestPage() {
  const params = useParams();
  const companyId = params.id as string;
  
  const API_ENDPOINT = `/approvals/company-registration-request/moderators/${companyId}/`;
  const router = useRouter();

  const [form, setForm] = useState<CompanyRequest>({
    first_name: "",
    last_name: "",
    company_name: "",
    national_id: "",
    registration_number: "",
    description: "",
    type_company: "",
    province_name: "",
    city_name: "",
    status: "",
    created_at: "",
    reject_reason: null,
  });

  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const response = await api.get(API_ENDPOINT);
        const data = response.data;

        setForm({
          first_name: data.requester_first_name || "",
          last_name: data.requester_last_name || "",
          company_name: data.company_name || "",
          national_id: data.company_national_id || "",
          registration_number: data.company_registration_number || "",
          description: data.company_description || "",
          type_company: data.type_company || "",
          province_name: data.company_province_name || "",
          city_name: data.company_city_name || "",
          status: data.status || "",
          created_at: data.created_at || "",
          reject_reason: data.reject_reason || null,
        });
      } catch (error) {
        console.error("خطا در دریافت اطلاعات درخواست:", error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      initData();
    }
  }, [companyId]);

  // عملیات تایید درخواست
  const handleApprove = async () => {
  setActionPending(true);
  try {
    await api.patch(API_ENDPOINT, { operator: "approve" });
    alert("درخواست ثبت شرکت با موفقیت تایید شد.");
    router.push("/admin/company-registration/list");
  } catch (error: any) {
    console.error("Approve error:", error.response?.data || error);
    alert(
      "خطا در تایید درخواست: " +
        (error.response?.data?.detail || JSON.stringify(error.response?.data) || "مشکلی رخ داده است")
    );
  } finally {
    setActionPending(false);
  }
};


  const handleRejectSubmit = async () => {
  if (!rejectReasonInput.trim()) {
    alert("لطفاً علت رد درخواست را وارد کنید.");
    return;
  }

  setActionPending(true);
  try {
    await api.patch(API_ENDPOINT, {
      operator: "reject",
      reject_reason: rejectReasonInput.trim(),
    });
    alert("درخواست ثبت شرکت رد شد.");
    setShowRejectModal(false);
    router.push("/admin/company-registration/list");
  } catch (error: any) {
    console.error("Reject error details:", error.response?.data || error);
    alert(
      "خطا در اعمال تغییرات: " +
        (error.response?.data?.detail || JSON.stringify(error.response?.data) || "مشکلی رخ داده است")
    );
  } finally {
    setActionPending(false);
  }
};


  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved" || s === "تایید شده") return "تایید شده";
    if (s === "rejected" || s === "رد شده" || s === "تایید نشده") return "رد شده";
    if (s === "pending" || s === "در حال بررسی") return "در حال بررسی";
    return status || "نامشخص";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-soft)]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-6 py-4 text-sm text-[var(--text-secondary)] shadow-sm">
          در حال بارگذاری اطلاعات...
        </div>
      </div>
    );
  }

  const isPending = form.status.toLowerCase() === "pending" || form.status === "در حال بررسی";

  return (
    <div className="min-h-screen bg-[var(--surface-soft)] px-4 py-8 md:px-8" dir="rtl">
      <div className="mx-auto w-full max-w-4xl">
        <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          
          {/* Header */}
          <div className="border-b border-[var(--border)] bg-gradient-to-b from-white to-[var(--surface-soft)] px-6 py-5 md:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] md:text-2xl">
                  بررسی درخواست ثبت شرکت
                </h1>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  شناسه درخواست: <span className="font-medium">{companyId}</span>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  وضعیت: {getStatusLabel(form.status)}
                </span>
                <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {form.created_at
                    ? new Date(form.created_at).toLocaleDateString("fa-IR")
                    : "تاریخ نامشخص"}
                </span>
              </div>
            </div>

            {/* {form.reject_reason && (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <span className="font-semibold">دلیل رد قبلی:</span> {form.reject_reason}
              </div>
            )} */}
          </div>

          {/* Details */}
          <div className="px-6 py-6 md:px-8 md:py-8">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  متقاضی ثبت
                </label>
                <div className="flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text-primary)] shadow-sm">
                  {form.first_name || form.last_name ? `${form.first_name} ${form.last_name}` : "-"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  نام شرکت
                </label>
                <div className="flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text-primary)] shadow-sm">
                  {form.company_name || "-"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  شناسه ملی
                </label>
                <div className="flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text-primary)] shadow-sm">
                  {form.national_id || "-"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  شماره ثبت
                </label>
                <div className="flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text-primary)] shadow-sm">
                  {form.registration_number || "-"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  نوع شرکت
                </label>
                <div className="flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text-primary)] shadow-sm">
                  {COMPANY_TYPE_LABELS[form.type_company] || form.type_company || "-"}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">
                  موقعیت (استان / شهر)
                </label>
                <div className="flex h-11 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 text-sm text-[var(--text-primary)] shadow-sm">
                  {form.province_name || form.city_name ? `${form.province_name}، ${form.city_name}` : "-"}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label className="text-sm font-medium text-[var(--text-secondary)]">
                توضیحات درخواست
              </label>
              <div className="w-full min-h-[120px] rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)] shadow-sm whitespace-pre-wrap">
                {form.description || "توضیحاتی ثبت نشده است."}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between border-t border-[var(--border)] pt-6">
              <Button
                type="button"
                onClick={() => router.push("/admin/company-registration/list")}
                className="h-11 rounded-xl bg-[var(--brand)] px-6 text-sm font-semibold text-black shadow-md transition-all duration-200 hover:bg-[var(--brand-hover)] hover:shadow-lg"
              >
                بازگشت به لیست
              </Button>

              {isPending && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  {/* دکمه رد درخواست */}
                  <Button
                    type="button"
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionPending}
                    className="group h-11 px-6 rounded-xl border border-red-200/60 bg-red-50/50 hover:bg-red-600 hover:border-red-600 text-sm font-semibold text-red-600 hover:text-white shadow-sm shadow-red-500/5 hover:shadow-md hover:shadow-red-500/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <X size={16} className="transition-transform duration-300 group-hover:rotate-90" />
                    <span>رد درخواست</span>
                  </Button>

                  {/* دکمه تایید درخواست */}
                  <Button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionPending}
                    className="group h-11 px-6 rounded-xl bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-sm font-bold text-[#111] shadow-md shadow-amber-500/10 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Check size={16} className="transition-transform duration-300 group-hover:scale-110" />
                    <span>{actionPending ? "در حال تایید..." : "تایید درخواست"}</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl" dir="rtl">
            <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
              علت رد درخواست ثبت شرکت
            </h3>
            <p className="mb-4 text-sm text-[var(--text-secondary)]">
              علت رد درخواست را جهت اطلاع متقاضی بنویسید:
            </p>

            <textarea
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              placeholder="مثلاً: مغایرت اطلاعات با مدارک ارسالی یا نقص در پرونده ثبتی..."
              className="min-h-32 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] text-[var(--text-primary)]"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <Button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReasonInput("");
                }}
                className="h-10 rounded-lg border border-[var(--border)] bg-transparent px-4 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-soft)]"
              >
                انصراف
              </Button>

              <Button
                type="button"
                disabled={!rejectReasonInput.trim() || actionPending}
                onClick={handleRejectSubmit}
                className="h-10 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                تایید و رد درخواست
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
