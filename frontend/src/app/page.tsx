import Link from "next/link";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-20 px-6 py-16">

        {/* Hero Section */}
        <section className="flex flex-col items-center text-center space-y-6">
          <Badge variant="brand">VOLTEC Platform</Badge>

          <h1 className="text-4xl font-black tracking-tight text-[var(--text-primary)] md:text-6xl">
            سامانه مدیریت یکپارچه مهندسی برق
          </h1>

          <p className="max-w-3xl text-base leading-8 text-[var(--text-secondary)] md:text-lg">
            VOLTEC یک بستر جامع برای مدیریت پروژه‌ها، قراردادها،
            صورت‌وضعیت‌ها، اسناد فنی، فرآیندهای مالی و گزارش‌های مدیریتی
            در شرکت‌های مهندسی برق است.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link href="/dashboard">
              <Button size="lg">ورود به پنل مدیریتی</Button>
            </Link>

                   <Link href="/login">
            <Button variant="secondary" size="lg">ایجاد حساب کاربری</Button>
          </Link>

           <Link href="/company-registration">
  <Button size="lg">ثبت شرکت ها</Button>
</Link>


            <Button variant="secondary" size="lg">
              مشاهده مستندات
            </Button>

       
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-6">
            <Badge variant="success">Next.js 15</Badge>
            <Badge variant="dark">Tailwind v4</Badge>
            <Badge variant="warning">Enterprise Ready</Badge>
          </div>
        </section>

        {/* Features */}
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          <Card>
            <CardHeader>
              <CardTitle>مدیریت پروژه</CardTitle>
              <CardDescription>
                ثبت، دسته‌بندی و پایش وضعیت پروژه‌های اجرایی و توسعه‌ای.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--text-muted)]">
              کنترل کامل بر پیشرفت فنی، مالی و زمانی پروژه‌ها.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>قرارداد و مالی</CardTitle>
              <CardDescription>
                مدیریت قراردادها، الحاقیه‌ها و گردش مالی پروژه‌ها.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--text-muted)]">
              کنترل مطالبات، پرداخت‌ها و صورت‌وضعیت‌ها به صورت یکپارچه.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>گزارش‌های مدیریتی</CardTitle>
              <CardDescription>
                داشبوردهای تحلیلی و شاخص‌های کلیدی عملکرد.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-[var(--text-muted)]">
              تصمیم‌گیری دقیق بر اساس داده‌های واقعی و لحظه‌ای.
            </CardContent>
          </Card>

        </section>

        {/* Footer */}
        <section className="border-t border-[var(--border)] pt-8 text-center text-sm text-[var(--text-muted)]">
          © {new Date().getFullYear()} VOLTEC Engineering Management System
        </section>

      </div>
    </main>
  );
}
