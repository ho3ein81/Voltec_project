"use client";

import {Card} from "@/app/components/ui/card";

type InviteStatus = "active" | "expired" | "accepted";

type InviteItem = {
  id: number;
  email: string;
  role: string;
  expiresAt: string;
  status: InviteStatus;
};

const invites: InviteItem[] = [
  {
    id: 1,
    email: "sara@voltec.ir",
    role: "عضو تیم",
    expiresAt: "۱۴۰۵/۰۴/۱۲ - ۱۸:۳۰",
    status: "active",
  },
  {
    id: 2,
    email: "ali@voltec.ir",
    role: "مدیر",
    expiresAt: "۱۴۰۵/۰۴/۱۰ - ۱۰:۰۰",
    status: "accepted",
  },
  {
    id: 3,
    email: "support@voltec.ir",
    role: "مشاهده‌گر",
    expiresAt: "۱۴۰۵/۰۴/۰۵ - ۰۹:۱۵",
    status: "expired",
  },
];

function getStatusBadge(status: InviteStatus) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-medium text-[var(--surface-dark)]">
          فعال
        </span>
      );

    case "accepted":
      return (
        <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-[var(--success)]">
          استفاده‌شده
        </span>
      );

    case "expired":
      return (
        <span className="inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-[var(--error)]">
          منقضی‌شده
        </span>
      );

    default:
      return null;
  }
}

export default function InviteList() {
  return (
    <Card className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="space-y-5 p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            دعوت‌نامه‌ها
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            وضعیت دعوت‌های ایجادشده و زمان انقضای آن‌ها را مشاهده کنید.
          </p>
        </div>

        <div className="space-y-3">
          {invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-col gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {invite.email}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span>نقش: {invite.role}</span>
                  <span className="text-[var(--border)]">•</span>
                  <span>انقضا: {invite.expiresAt}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(invite.status)}

                <button
                  type="button"
                  className="h-10 rounded-xl border border-[var(--border)] px-4 text-sm font-medium text-[var(--text-primary)] transition hover:bg-white"
                >
                  کپی لینک
                </button>

                <button
                  type="button"
                  className="h-10 rounded-xl border border-red-200 px-4 text-sm font-medium text-[var(--error)] transition hover:bg-red-50"
                >
                  لغو
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
