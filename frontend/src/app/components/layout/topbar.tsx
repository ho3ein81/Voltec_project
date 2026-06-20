"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

export function Topbar() {
  const router = useRouter();
  const [nationalId, setNationalId] = useState<string | null>(null);
  const [fullname, setFullname] = useState<string | null>(null);

  useEffect(() => {
    const storedId = localStorage.getItem("user_national_id");
    const first_name = localStorage.getItem("first_name");
    const last_name = localStorage.getItem("last_name");
    setNationalId(storedId);
    setFullname(first_name + " " + last_name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_national_id");
    localStorage.removeItem("first_name");
    localStorage.removeItem("last_name");

    setNationalId(null);
    setFullname(null);

    router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-[var(--text-primary)]">
          داشبورد
        </h1>

        <Badge variant="info">سیستم فعال</Badge>
      </div>

      <div className="flex items-center gap-3">
        {/* <div className="hidden w-64 md:block">
          <Input placeholder="جستجو..." />
        </div> */}

        <Button variant="ghost" className="p-2">
          <Bell size={18} className="text-gray-600" />
        </Button>

        {fullname ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {fullname}
            </span>

            <Button
              variant="secondary"
              onClick={handleLogout}
              className="border border-red-200 text-red-600 hover:bg-red-50"
            >
              خروج
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button variant="secondary">حساب کاربری</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
