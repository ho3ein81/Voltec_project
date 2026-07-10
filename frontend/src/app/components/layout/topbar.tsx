"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, Building2, KeyRound, UserRound, LogOut } from "lucide-react";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import CompanySwitcher from "../company/company-switcher";

export function Topbar() {
  const router = useRouter();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fullname, setFullname] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  // ✅ همگام‌سازی وضعیت کاربر از localStorage
  const syncUserState = () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("access_token");
    const firstName = localStorage.getItem("first_name");
    const lastName = localStorage.getItem("last_name");
    const storedCompany = localStorage.getItem("company_name");

    const name = [firstName, lastName].filter(Boolean).join(" ").trim();

    setIsAuthenticated(Boolean(token));
    setFullname(name || null);
    setCompanyName(storedCompany || null);
  };

  // ✅ اجرا هنگام mount
  useEffect(() => {
    syncUserState();

    window.addEventListener("storage", syncUserState);
    return () => {
      window.removeEventListener("storage", syncUserState);
    };
  }, []);

  // ✅ بستن منو هنگام کلیک بیرون
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ✅ خروج
  const handleLogout = () => {
    if (typeof window === "undefined") return;

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_national_id");
    localStorage.removeItem("first_name");
    localStorage.removeItem("last_name");
    localStorage.removeItem("company_name");

    setIsAuthenticated(false);
    setFullname(null);
    setCompanyName(null);
    setOpenMenu(false);

    // router.push("/login");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6 relative z-[200]">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-[var(--text-primary)]">
          داشبورد
        </h1>

        <Badge variant="info">سیستم فعال</Badge>
        <div className="flex items-center gap-3">
          <CompanySwitcher />
        </div>

        {isAuthenticated && companyName && (
          <Badge className="bg-[var(--brand-soft)] text-black border border-[var(--brand)] font-medium px-2.5 py-0.5 rounded-md text-xs">
            🏢 {companyName}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" className="p-2">
          <Bell size={18} className="text-gray-600" />
        </Button>

        {isAuthenticated && fullname ? (
          <div className="flex items-center gap-3">
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setOpenMenu(!openMenu)}
                className="flex min-w-[160px] items-center justify-between gap-2 text-sm font-medium text-[var(--text-primary)] hover:text-[var(--brand)] transition"
              >
                <span className="truncate">{fullname}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${openMenu ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {openMenu && (
                <div
                  className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] backdrop-blur-md"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <ul className="py-2 text-sm">
                    <li className="px-2">
                      <Link
                        href="/dashboard/projects/user-list"
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium transition-all duration-200"
                        style={{ color: "var(--text-primary)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--brand-soft)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <Building2
                          size={18}
                          strokeWidth={2.25}
                          color="currentColor"
                        />
                        <span>ثبت شرکت‌های من</span>
                      </Link>
                    </li>

                    <li className="px-2">
                      <Link
                        href="/dashboard/setting/team"
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium transition-all duration-200"
                        style={{ color: "var(--text-primary)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--brand-soft)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <KeyRound
                          size={18}
                          strokeWidth={2.25}
                          color="currentColor"
                        />
                        <span>مدیریت کد دعوت</span>
                      </Link>
                    </li>

                    <li className="px-2">
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 font-medium transition-all duration-200"
                        style={{ color: "var(--text-primary)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--brand-soft)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <UserRound
                          size={18}
                          strokeWidth={2.25}
                          color="currentColor"
                        />
                        <span>پروفایل</span>
                      </Link>
                    </li>

                    <div
                      className="my-1.5 h-px"
                      style={{ backgroundColor: "var(--border)" }}
                    />

                    <li className="px-2">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-right font-medium transition-all duration-200"
                        style={{ color: "var(--error)" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--brand-soft)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <LogOut
                          size={18}
                          strokeWidth={2.25}
                          color="currentColor"
                        />
                        <span>خروج</span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>

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
            <Button variant="secondary">ورود | ثبت نام</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
