"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api from "../components/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [nationalId, setNationalId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api";

  const LOGIN_PATH = process.env.NEXT_PUBLIC_LOGIN_PATH || "/accounts/login/";

  const buildLoginUrl = () => {
    const path = LOGIN_PATH.startsWith("/") ? LOGIN_PATH : `/${LOGIN_PATH}`;

    return `${path}`;
  };

  const normalizeNationalId = (value: string) => {
    return value.replace(/\D/g, "").slice(0, 10);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const cleanedNationalId = normalizeNationalId(nationalId);

    if (cleanedNationalId.length !== 10) {
      setError("کد ملی باید دقیقاً ۱۰ رقم باشد");
      return;
    }

    if (!password.trim()) {
      setError("رمز عبور الزامی است");
      return;
    }

    const loginUrl = buildLoginUrl();

    try {
      setIsLoading(true);

      const res = await api.post(loginUrl, {
        national_id: cleanedNationalId,
        password: password.trim(),
      });

      let data: any = null;

      try {
        data = await res.data;
      } catch {
        data = null;
      }

      if (res.status !== 200) {
        const backendMessage =
          data?.detail ||
          data?.error ||
          data?.message ||
          data?.non_field_errors?.[0] ||
          "کد ملی یا رمز عبور نادرست است";

        setError(backendMessage);
        return;
      }

      const accessToken = data?.access;
      const refreshToken = data?.refresh;
      const user_national_id = data?.user.national_id;
      const first_name = data?.user.first_name;
      const last_name = data?.user.last_name;

      if (!accessToken || !refreshToken) {
        setError("پاسخ سرور ناقص است؛ توکن‌ها دریافت نشدند");
        return;
      }

      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
      localStorage.setItem("user_national_id", user_national_id);
      localStorage.setItem("first_name", first_name);
      localStorage.setItem("last_name", last_name);
      window.dispatchEvent(new Event("storage"));

      router.push("/dashboard");
    } catch (err) {
      console.error("LOGIN_ERROR =>", err);
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, var(--brand-soft), var(--background))",
        color: "var(--text-primary)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "40px 32px",
          boxShadow: "0 20px 40px -15px rgba(0,0,0,0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{ margin: "0 0 8px 0", fontSize: "24px", fontWeight: 800 }}
          >
            ورود به سامانه ولتک
          </h1>

          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            مدیریت یکپارچه شرکت‌های مشاور مهندسی برق
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          {/* national id */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="national_id">کد ملی</label>

            <input
              id="national_id"
              type="text"
              inputMode="numeric"
              maxLength={10}
              value={nationalId}
              onChange={(e) =>
                setNationalId(normalizeNationalId(e.target.value))
              }
              onFocus={() => setIsFocused("national_id")}
              onBlur={() => setIsFocused(null)}
              style={{
                height: "46px",
                borderRadius: "10px",
                border:
                  isFocused === "national_id"
                    ? "1px solid var(--brand)"
                    : "1px solid var(--border)",
                padding: "0 16px",
                direction: "ltr",
              }}
            />
          </div>

          {/* password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="password">رمز عبور</label>

            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setIsFocused("password")}
                onBlur={() => setIsFocused(null)}
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "10px",
                  border:
                    isFocused === "password"
                      ? "1px solid var(--brand)"
                      : "1px solid var(--border)",
                  padding: "0 40px 0 16px",
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: "18px",
                }}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C7 20 2.73 16.11 1 12c.73-1.74 1.86-3.41 3.32-4.84" />
                    <path d="M10.58 10.58A3 3 0 0 0 12 15a3 3 0 0 0 2.42-4.42" />
                    <path d="M1 1l22 22" />
                    <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 9.27 3.89 11 8a10.94 10.94 0 0 1-2.16 3.19" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div
              style={{
                borderRadius: "8px",
                padding: "10px 14px",
                background: "rgba(220,38,38,0.05)",
                border: "1px solid var(--error)",
                color: "var(--error)",
                fontSize: "12px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              height: "46px",
              border: "none",
              borderRadius: "10px",
              background: "var(--brand)",
              color: "#fff",
              fontWeight: 700,
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? "در حال بررسی..." : "ورود"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "13px" }}>
          حساب کاربری ندارید؟
          <Link
            href="/signup"
            style={{
              marginRight: "6px",
              color: "var(--brand)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            ثبت نام
          </Link>
        </div>
      </div>
    </main>
  );
}
