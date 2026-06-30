"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "../components/lib/api";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    national_id: "",
    phone: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState<string | null>(null);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

  const SIGNUP_PATH =
    process.env.NEXT_PUBLIC_SIGNUP_PATH ?? "/accounts/signup/";

  const handleChange = (field: string, value: string) => {
    setForm({
      ...form,
      [field]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^\d{10}$/.test(form.national_id)) {
      setError("کد ملی باید دقیقاً ۱۰ رقم باشد");
      return;
    }

    if (!/^09\d{9}$/.test(form.phone)) {
      setError("شماره موبایل معتبر نیست");
      return;
    }

    if (form.password.length < 6) {
      setError("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }

    if (form.password !== form.confirm_password) {
      setError("رمز عبور و تکرار آن یکسان نیست");
      return;
    }

    try {
      setIsLoading(true);

      const res = await api.post(`${SIGNUP_PATH}`, form);

      let data: any = null;

      try {
        data = await res.data;
      } catch {
        data = null;
      }

      if (res.status !== 200 && res.status !== 201) {

        const backendError =
          data?.error || data?.detail || data?.message || "خطا در ثبت نام";

        setError(backendError);
        return;
      }

      router.push("/login");
    } catch (err) {
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
        fontFamily: "inherit",
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
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2)",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              background: "var(--brand)",
              margin: "0 auto 16px auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "24px",
              fontWeight: "900",
            }}
          >
            V
          </div>

          <h1
            style={{
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: 800,
            }}
          >
            ثبت نام در سامانه ولتک
          </h1>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          {[
            { name: "first_name", label: "نام" },
            { name: "last_name", label: "نام خانوادگی" },
            { name: "national_id", label: "کد ملی" },
            { name: "phone", label: "شماره موبایل" },
            { name: "email", label: "ایمیل" },
          ].map((field) => (
            <div
              key={field.name}
              style={{ display: "flex", flexDirection: "column", gap: "6px" }}
            >
              <label style={{ fontSize: "13px" }}>{field.label}</label>

              <input
                type="text"
                value={(form as any)[field.name]}
                onChange={(e) => handleChange(field.name, e.target.value)}
                onFocus={() => setIsFocused(field.name)}
                onBlur={() => setIsFocused(null)}
                style={{
                  height: "46px",
                  borderRadius: "10px",
                  border:
                    isFocused === field.name
                      ? "1px solid var(--brand)"
                      : "1px solid var(--border)",
                  padding: "0 16px",
                  background: "var(--surface-soft)",
                }}
              />
            </div>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px" }}>رمز عبور</label>

            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
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

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "13px" }}>تکرار رمز عبور</label>

            <div style={{ position: "relative" }}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.confirm_password}
                onChange={(e) =>
                  handleChange("confirm_password", e.target.value)
                }
                onFocus={() => setIsFocused("confirm_password")}
                onBlur={() => setIsFocused(null)}
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "10px",
                  border:
                    isFocused === "confirm_password"
                      ? "1px solid var(--brand)"
                      : "1px solid var(--border)",
                  padding: "0 40px 0 16px",
                }}
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {showConfirmPassword ? (
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
                padding: "10px",
                background: "rgba(220, 38, 38, 0.05)",
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
            {isLoading ? "در حال ثبت نام..." : "ایجاد حساب"}
          </button>
        </form>
      </div>
    </main>
  );
}
