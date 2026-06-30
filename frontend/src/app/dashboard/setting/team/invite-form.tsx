"use client";

import { useState } from "react";
import {Card} from "@/app/components/ui/card";
import {Button} from "@/app/components/ui/button";
import {Input} from "@/app/components/ui/input";
import ExpirationPicker from "./expiration-picker";

export default function InviteForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [expiresAt, setExpiresAt] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = {
      email,
      role,
      expired_at: expiresAt || null,
    };

    console.log("Invite payload:", payload);

    // TODO: connect to API
    // await createInvite(payload)

    setEmail("");
    setRole("member");
    setExpiresAt("");
  };

  return (
    <Card className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="space-y-6 p-6">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            ایجاد دعوت‌نامه
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            ایمیل، نقش و زمان انقضای دعوت را مشخص کنید.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="invite-email"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                ایمیل همکار
              </label>
              <Input
                id="invite-email"
                type="email"
                placeholder="example@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl border-[var(--border)] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
              />
            </div>

            <div>
              <label
                htmlFor="invite-role"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                نقش
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]"
              >
                <option value="member">عضو تیم</option>
                <option value="manager">مدیر</option>
                <option value="viewer">مشاهده‌گر</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="invite-expiration"
                className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
              >
                زمان انقضا
              </label>
              <ExpirationPicker value={expiresAt} onChange={setExpiresAt} />
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <Button
              type="submit"
              className="h-11 rounded-xl bg-[var(--brand)] px-5 font-medium text-[var(--surface-dark)] transition hover:bg-[var(--brand-hover)]"
            >
              ایجاد دعوت‌نامه
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
