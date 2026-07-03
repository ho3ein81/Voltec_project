"use client";

import { useEffect, useState } from "react";
import {
ShieldAlert,
Building2,
Check,
Trash2,
Plus,
Calendar,
Users2,
Clock,
RefreshCw,
MapPin,
Tag,
Share2,
ChevronDown
} from "lucide-react";
import { Listbox } from "@headlessui/react";



import {
getInviteCodes,
createInviteCode,
deleteInviteCode,
} from "@/app/components/lib/invite";

import { useCompany } from "@/app/components/company/company-provider";

import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { SectionTitle } from "@/app/components/ui/section-title";
import { useToast } from "@/app/components/ui/use-toast";

// =============================
// Interfaces
// =============================

interface InviteCode {
id: number;
max_uses: number;
used_count: number;
expired_at: string | null;
usage?: string;
token: string;
created_at: string;
is_active?: boolean;
}

// =============================
// Helper Functions
// =============================

const getCompanyName = (company: any): string => {
if (!company) return "شرکت بدون نام";

return (
company.company_name?.trim() ||
company.title?.trim() ||
company.name?.trim() ||
`شرکت #${company.id}`
);
};

// =============================
// States Components
// =============================

function ForbiddenState() {
return (
<div className="flex items-center justify-center py-24 animate-in fade-in zoom-in-95 duration-200">
  <div
    className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-sm">
    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[var(--error)]">
      <ShieldAlert size={28} strokeWidth={1.5} />
    </div>

    <h2 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
      عدم دسترسی
    </h2>

    <p className="mb-6 text-sm leading-relaxed text-[var(--text-muted)]">
      این بخش و مدیریت کدهای دعوت فقط برای مدیر ارشد یا مالک سازمان
      در دسترس است.
    </p>

  </div>
</div>
);
}

function NoCompanyState() {
return (
<div className="flex items-center justify-center py-24 animate-in fade-in zoom-in-95 duration-200">
  <div
    className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-sm">
    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 text-gray-500">
      <Building2 size={28} strokeWidth={1.5} />
    </div>

    <h2 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
      سازمانی یافت نشد
    </h2>

    <p className="mb-6 text-sm leading-relaxed text-[var(--text-muted)]">
      شما هنوز عضو یا سازنده‌ی هیچ شرکتی در سامانه نیستید.
      ابتدا باید یک شرکت ثبت کنید.
    </p>

    <Button onClick={()=>
      (window.location.href =
      "/admin/company-registration/create")
      }
      className="h-11 rounded-xl bg-[var(--brand)] px-5 text-black hover:bg-[var(--brand-hover)]"
      >
      ایجاد و ثبت شرکت جدید
    </Button>
  </div>
</div>
);
}

function NoAccessToAnyCompanyState() {
return (
<div className="flex items-center justify-center py-24">
  <div
    className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-10 text-center shadow-sm">
    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[var(--error)]">
      <ShieldAlert size={28} strokeWidth={1.5} />
    </div>

    <h2 className="mb-2 text-xl font-bold text-[var(--text-primary)]">
      دسترسی مدیریتی یافت نشد
    </h2>

    <p className="mb-6 text-sm leading-relaxed text-[var(--text-muted)]">
      شما عضو شرکت‌هایی هستید، اما در هیچ‌کدام دسترسی مدیریت دعوت‌نامه ندارید.
    </p>

    <Button onClick={()=>
      (window.location.href =
      "/admin/company-registration/create")
      }
      className="h-11 rounded-xl bg-[var(--brand)] px-5 text-black hover:bg-[var(--brand-hover)]"
      >
      ثبت شرکت جدید
    </Button>
  </div>
</div>
);
}


function EmptyState() {
return (
<div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)]/50 py-16 text-center">
  <div className="mb-4 text-4xl">📨</div>

  <h3 className="mb-1 font-semibold text-[var(--text-primary)]">
    کد دعوتی ساخته نشده است
  </h3>

  <p className="text-sm text-[var(--text-muted)]">
    برای ورود اعضا به این شرکت، اولین کد دعوت را از پنل سمت راست بسازید.
  </p>
</div>
);
}

// =============================
// Main Page
// =============================

export default function TeamPage() {
const { toast } = useToast();

const {
companies,
activeCompany,
setActiveCompany,
} = useCompany();

const [invites, setInvites] = useState<InviteCode[]>([]);

  const [expireDate, setExpireDate] =
  useState<DateObject | null>(null);

    const [maxUses, setMaxUses] = useState(5);

    const [loading, setLoading] = useState(false);
    const [fetchingInvites, setFetchingInvites] = useState(false);
    const [forbidden, setForbidden] = useState(false);


    const [lastAccessibleCompany, setLastAccessibleCompany] =
    useState<any | null>(null);

      const [copiedId, setCopiedId] = useState<number | null>(null);

        // =============================
        // Load Invites
        // =============================

        const loadInvites = async (companyId: number) => {
        setFetchingInvites(true);
        setForbidden(false);

        try {
        const data = await getInviteCodes(companyId);

        setInvites(
        Array.isArray(data)
        ? data
        : (data as any).results || []
        );

        // ✅ ذخیره آخرین شرکت مجاز
        const currentCompany = companies.find(
        (c) => c.id === companyId
        );

        if (currentCompany) {
        setLastAccessibleCompany(currentCompany);
        }


        } catch (error: any) {
        if (
        error?.message === "FORBIDDEN" ||
        error?.response?.status === 403
        ) {
        setForbidden(true);
        setInvites([]);



        }
        } finally {
        setFetchingInvites(false);
        }
        };



        useEffect(() => {
        if (!activeCompany?.id) return;

        loadInvites(activeCompany.id);
        }, [activeCompany?.id]);

        const activeCompanyDisplayName =
        getCompanyName(activeCompany);

        // =============================
        // Create Invite
        // =============================

        const handleCreate = async () => {
        if (!activeCompany?.id) return;

        if (!expireDate) {
        toast({
        title: "لطفاً تاریخ انقضا را مشخص کنید.",
        });

        return;
        }

        try {
        setLoading(true);

        const formattedDate =
        expireDate.toDate().toISOString();

        await createInviteCode(activeCompany.id, {
        expired_at: formattedDate,
        max_uses: maxUses,
        });

        toast({
        title: `کد دعوت با موفقیت برای شرکت «${activeCompanyDisplayName}» ثبت شد.`,
        });

        setExpireDate(null);
        setMaxUses(5);

        await loadInvites(activeCompany.id);
        } catch (error: any) {
        toast({
        title:
        "امکان صدور کد دعوت برای این سطح دسترسی وجود ندارد.",
        });
        } finally {
        setLoading(false);
        }
        };

        // =============================
        // Delete Invite
        // =============================

        const handleDelete = async (codeId: number) => {
        if (!activeCompany?.id) return;

        try {
        await deleteInviteCode(
        activeCompany.id,
        codeId
        );

        toast({
        title: "کد دعوت با موفقیت حذف شد",
        });

        await loadInvites(activeCompany.id);
        } catch (error: any) {
        toast({
        title:
        "کد دعوت حذف نشد. وضعیت دسترسی خود را بررسی کنید.",
        });
        }
        };

        // =============================
        // Copy Invite Link
        // =============================

        const handleCopy = (
        tokenText: string,
        inviteId: number
        ) => {

        navigator.clipboard.writeText(tokenText);

        setCopiedId(inviteId);

        toast({
        title: "لینک عضویت اختصاصی کپی شد",
        });

        setTimeout(() => {
        setCopiedId(null);
        }, 2000);
        };

        // =============================
        // States
        // =============================

        if (companies.length === 0) {
        return
        <NoCompanyState />;

        }






        // =============================
        // Render
        // =============================

        return (
        <div className="mx-auto max-w-6xl space-y-8 p-2 md:p-4">
          {/* Header */}
          <div
            className="flex flex-col gap-4 border-b border-[var(--border)] pb-6 md:flex-row md:items-center md:justify-between z-999">
            <SectionTitle title="مدیریت دعوت‌نامه‌های همکاران"
              description="ایجاد لینک‌های عضویت پویا و کدهای اختصاصی برای هر شرکت به طور جداگانه" />

            {/* Company Switcher */}
            {companies.length > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm min-w-[260px] max-w-[320px] transition-all duration-200 hover:border-[var(--brand)]">
  {/* بخش آیکن شرکت با پس‌زمینه ملایم برند */}
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--surface-dark)]">
    <Building2 className="h-5 w-5" />
  </div>

  <div className="flex flex-col flex-1 min-w-0 pl-1">
    <span className="text-[10px] font-bold text-[var(--text-muted)] select-none">
      شرکت فعال جهت مدیریت
    </span>

    <Listbox
      value={activeCompany}
      onChange={(company) => setActiveCompany(company)}
    >
      <div className="relative w-full mt-0.5">
        {/* Button */}
        <Listbox.Button
          className="
            h-8 w-full
            rounded-md
            pl-8 pr-1
            text-sm font-bold
            text-[var(--text-primary)]
            cursor-pointer
            flex items-center
            justify-between
            transition-all duration-200
            hover:text-[var(--brand-hover)]
            focus:outline-none
          "
        >
          {/* جلوگیری از به هم ریختن متن در نام‌های طولانی با truncate */}
          <span className="truncate">{getCompanyName(activeCompany)}</span>
          <ChevronDown className="absolute left-1 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)] transition-transform duration-200" />
        </Listbox.Button>

        {/* Options (دراپ‌داون بازشونده) */}
          <Listbox.Options
  className="
    absolute 
    top-full 
    left-0 
    mt-1 
    z-30
    w-full
    min-w-[231px]
    rounded-lg
    border border-[var(--border)]
    bg-[var(--surface)]
    shadow-lg
    py-1
    max-h-64 overflow-y-auto
    animate-in fade-in slide-in-from-top-1
    focus:outline-none
  "
>

          {companies.map((company) => {
            const isSelected = activeCompany?.id === company.id;
            return (
              <Listbox.Option
                key={company.id}
                value={company}
                className={({ active }) => `
                  px-3 py-2
                  text-xs font-semibold
                  cursor-pointer
                  select-none
                  transition-all duration-150
                  flex items-center justify-between
                  ${
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--surface-dark)]"
                      : "text-[var(--text-primary)] hover:bg-[var(--surface-soft)]"
                  }
                `}
              >
                <span className="truncate">{getCompanyName(company)}</span>
                
                {/* یک دایره‌ی بسیار ظریف زرد در صورت انتخاب بودن آن شرکت */}
                {isSelected && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)] shrink-0" />
                )}
              </Listbox.Option>
            );
          })}
        </Listbox.Options>
      </div>
    </Listbox>
  </div>
</div>

           
            )}
          </div>

          {/* Active Company */}
          {activeCompany && (
          <div
            className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--surface-soft)] to-[var(--surface)] p-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--brand-soft)] text-lg font-bold text-[var(--surface-dark)] shadow-inner">
                {activeCompanyDisplayName.substring(0, 2)}
              </div>

              <div>
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {activeCompanyDisplayName}
                </h4>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                  {(activeCompany as any).type_company && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    {(activeCompany as any).type_company}
                  </span>
                  )}

                  {(activeCompany as any).province && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {(activeCompany as any).province}،
                    {(activeCompany as any).city}
                  </span>
                  )}
                </div>
              </div>
            </div>

            <div
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1.5 text-xs text-[var(--text-muted)]">
              شناسه شرکت:
              <span className="mr-1 font-mono font-semibold">
                {activeCompany.id}
              </span>
            </div>
          </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {forbidden && (
            <div className="lg:col-span-3">
              {lastAccessibleCompany ? (
              <>
                <ForbiddenState />

                <div className="mt-4 flex justify-center">
                  <Button onClick={()=> {
                    setActiveCompany(lastAccessibleCompany as any);
                    setForbidden(false);
                    }}
                    className="h-11 rounded-xl bg-[var(--brand)] px-5 text-black hover:bg-[var(--brand-hover)]"
                    >
                    بازگشت به آخرین شرکت مجاز
                  </Button>
                </div>
              </>
              ) : (
              <NoAccessToAnyCompanyState />
              )}
            </div>
            )}



            {/* Create Invite */}
            {!forbidden && (
            <Card
              className="h-fit rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:col-span-1">
              <div className="mb-6 space-y-1">
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  صدور کد دعوت جدید
                </h3>

                <p className="text-xs leading-relaxed text-[var(--text-muted)]">
                  تعیین تاریخ انقضا و حداکثر سقف استفاده از این کد دعوت اختصاصی.
                </p>
              </div>

              <div className="space-y-4">
                {/* Date Picker */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                    <Calendar className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    تاریخ انقضای دعوت
                  </label>

                  <div className="relative w-full">
                    <DatePicker value={expireDate} onChange={setExpireDate} calendar={persian} locale={persian_fa}
                      format="YYYY/MM/DD HH:mm" // غیرفعال کردن روزهای گذشته (از امروز به قبل) minDate={new Date()}
                      portal fixMainPosition={true} scrollSensitive={false} calendarPosition="bottom-right" inputClass="
                     flex h-11 w-full rounded-xl
                     border border-[var(--border)]
                     bg-[var(--surface)]
                     px-3 py-2
                     text-sm text-[var(--text-primary)]
                     placeholder:text-[var(--text-muted)]
                     focus:outline-none
                     focus:border-[var(--brand)]
                     focus:ring-2
                     focus:ring-[var(--brand-soft)]
                     transition-all duration-200
                   " containerClassName="w-full" placeholder="انتخاب تاریخ و زمان..." />

                  </div>
                </div>

                {/* Max Uses */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                    <Users2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    حداکثر دفعات استفاده مجاز
                  </label>

                  <Input type="number" min={1} max={500} value={maxUses} onChange={(e)=>
                  setMaxUses(Number(e.target.value))
                  }
                  className="
                  h-11 rounded-xl
                  border-[var(--border)]
                  bg-[var(--surface)]
                  text-[var(--text-primary)]
                  focus:border-[var(--brand)]
                  focus:ring-2
                  focus:ring-[var(--brand-soft)]
                  "
                  />
                </div>

                {/* Submit */}
                <Button onClick={handleCreate} disabled={loading}
                  className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-[var(--surface-dark)] transition hover:bg-[var(--brand-hover)]">
                  {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    در حال صدور...
                  </>
                  ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    ساخت کد و لینک دعوت
                  </>
                  )}
                </Button>
              </div>
            </Card>
            )}

            {/* Invite List */}
            {!forbidden && (
            <Card className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">
                    کدهای دعوت صادر شده
                  </h3>

                  <p className="text-xs text-[var(--text-muted)]">
                    مدیریت و پایش کدهای فعال برای شرکت{" "}
                    {activeCompanyDisplayName}
                  </p>
                </div>

                {fetchingInvites && (
                <RefreshCw className="h-4 w-4 animate-spin text-[var(--text-muted)]" />
                )}
              </div>

              {invites.length === 0 &&
              !fetchingInvites ? (
              <EmptyState />
              ) : (
              <div className="divide-y divide-[var(--border)]">
                {invites.map((invite) => {
                const now = new Date();

                const isExpired =
                invite.expired_at &&
                new Date(invite.expired_at) < now; const isLimitReached=invite.used_count>=
                  invite.max_uses;

                  const isActive =
                  invite.is_active !== false &&
                  !isExpired &&
                  !isLimitReached;

                  return (
                  <div key={invite.id}
                    className="group flex flex-col gap-4 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="select-all rounded border border-[var(--border)] bg-[var(--surface-soft)] px-2.5 py-1 font-mono text-sm font-bold tracking-wider text-[var(--text-primary)]">
                          {invite.token}
                        </span>

                        {isActive ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-[var(--success)]">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--success)]" />
                          فعال و معتبر
                        </span>
                        ) : isExpired ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-[var(--error)]">
                          منقضی شده
                        </span>
                        ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold text-gray-500">
                          ظرفیت تکمیل
                        </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Users2 className="h-3.5 w-3.5" />
                          میزان استفاده:
                          {invite.used_count}
                          از
                          {invite.max_uses}
                          کاربر
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          تاریخ انقضا:
                          {invite.expired_at
                          ? new Date(
                          invite.expired_at
                          ).toLocaleDateString(
                          "fa-IR"
                          )
                          : "بدون محدودیت"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={()=>
                        handleCopy(
                        invite.token,
                        invite.id
                        )
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[var(--border)]
                        bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--text-primary)] shadow-sm
                        transition-all hover:border-[var(--brand)] hover:text-[var(--brand)]"
                        >
                        {copiedId === invite.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                          کپی شد!
                        </>
                        ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                          اشتراک‌گذاری
                        </>
                        )}
                      </button>

                      <button onClick={()=>
                        handleDelete(invite.id)
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-100
                        bg-red-50 text-[var(--error)] transition-all hover:border-red-200 hover:bg-red-100"
                        title="لغو و حذف کد"
                        >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  );
                  })}
              </div>
              )}
            </Card>
            )}
          </div>
        </div>
        );
        }