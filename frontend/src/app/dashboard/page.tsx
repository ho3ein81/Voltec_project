"use client";

import Link from "next/link";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

type ProjectStatus = "active" | "pending" | "completed" | "suspended";

type MonthlyTrend = {
  month: string;
  income: number;
  expense: number;
};

function getStatusMeta(status: ProjectStatus) {
  switch (status) {
    case "active":
      return {
        label: "فعال",
        className:
          "border-[color:var(--success)]/30 bg-[color:var(--success)]/15 text-[color:var(--success)]",
      };

    case "pending":
      return {
        label: "در انتظار",
        className:
          "border-[color:var(--warning)]/30 bg-[color:var(--warning)]/15 text-[color:var(--warning)]",
      };

    case "completed":
      return {
        label: "تکمیل‌شده",
        className:
          "border-[color:var(--info)]/30 bg-[color:var(--info)]/15 text-[color:var(--info)]",
      };

    case "suspended":
      return {
        label: "معلق",
        className:
          "border-[color:var(--error)]/30 bg-[color:var(--error)]/15 text-[color:var(--error)]",
      };

    default:
      return {
        label: status,
        className:
          "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--text-secondary)]",
      };
  }
}

const monthlyTrends: MonthlyTrend[] = [
  { month: "فروردین", income: 65, expense: 45 },
  { month: "اردیبهشت", income: 70, expense: 50 },
  { month: "خرداد", income: 85, expense: 40 },
  { month: "تیر", income: 60, expense: 55 },
  { month: "مرداد", income: 90, expense: 60 },
  { month: "شهریور", income: 75, expense: 45 },
  { month: "مهر", income: 80, expense: 65 },
  { month: "آبان", income: 50, expense: 40 },
  { month: "آذر", income: 95, expense: 50 },
  { month: "دی", income: 70, expense: 60 },
  { month: "بهمن", income: 85, expense: 40 },
  { month: "اسفند", income: 100, expense: 30 },
];

const priorityProjects = [
  {
    title: "نیروگاه مپنا فاز ۲",
    status: "suspended" as ProjectStatus,
    date: "۲۸ تیر",
    progress: 85,
  },
  {
    title: "پست برق خوزستان",
    status: "pending" as ProjectStatus,
    date: "۵ مرداد",
    progress: 40,
  },
  {
    title: "خط انتقال نیرو ۴۰۰kv",
    status: "active" as ProjectStatus,
    date: "۱۲ مرداد",
    progress: 15,
  },
];

function createLinePoints(data: MonthlyTrend[], key: "income" | "expense") {
  const maxValue = 100;
  const width = 100;
  const height = 56;

  return data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - (item[key] / maxValue) * height;

      return `${x},${y}`;
    })
    .join(" ");
}

function getTrendSummary(data: MonthlyTrend[]) {
  const totalIncome = data.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = data.reduce((sum, item) => sum + item.expense, 0);
  const lastMonth = data[data.length - 1];

  return {
    totalIncome,
    totalExpense,
    lastMonth,
    balance: totalIncome - totalExpense,
  };
}

function MobileFinancialLineChart({ data }: { data: MonthlyTrend[] }) {
  const incomePoints = createLinePoints(data, "income");
  const expensePoints = createLinePoints(data, "expense");
  const summary = getTrendSummary(data);

  return (
    <div className="md:hidden space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[color:var(--success)]/10 bg-[color:var(--success)]/5 p-3">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-[color:var(--success)]">
            <ArrowUpRight className="h-3.5 w-3.5" />
            درآمد سالانه
          </div>
          <p className="text-lg font-bold text-[var(--text-primary)]">
            {summary.totalIncome}
            <span className="mr-1 text-xs font-normal text-[var(--text-muted)]">
              واحد
            </span>
          </p>
        </div>

        <div className="rounded-xl border border-[color:var(--error)]/10 bg-[color:var(--error)]/5 p-3">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-[color:var(--error)]">
            <ArrowDownRight className="h-3.5 w-3.5" />
            هزینه سالانه
          </div>
          <p className="text-lg font-bold text-[var(--text-primary)]">
            {summary.totalExpense}
            <span className="mr-1 text-xs font-normal text-[var(--text-muted)]">
              واحد
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              روند مالی سالانه
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              نمایش فشرده مخصوص موبایل
            </p>
          </div>

          <div className="shrink-0 text-left">
            <p className="text-xs text-[var(--text-muted)]">آخرین ماه</p>
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {summary.lastMonth.month}
            </p>
          </div>
        </div>

        <div className="relative h-28 overflow-hidden rounded-xl bg-[var(--surface-soft)] px-3 py-4">
          <svg
            viewBox="0 0 100 56"
            preserveAspectRatio="none"
            className="h-full w-full overflow-visible"
            role="img"
            aria-label="نمودار خطی درآمد و هزینه ماهانه"
          >
            <line
              x1="0"
              y1="14"
              x2="100"
              y2="14"
              stroke="var(--border)"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1="28"
              x2="100"
              y2="28"
              stroke="var(--border)"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1="0"
              y1="42"
              x2="100"
              y2="42"
              stroke="var(--border)"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />

            <polyline
              points={incomePoints}
              fill="none"
              stroke="var(--success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />

            <polyline
              points={expensePoints}
              fill="none"
              stroke="var(--error)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                درآمد
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--error)]" />
              <span className="text-xs text-[var(--text-secondary)]">
                هزینه
              </span>
            </div>
          </div>

          <p className="text-xs font-medium text-[var(--text-muted)]">
            فروردین تا اسفند
          </p>
        </div>
      </div>
    </div>
  );
}

function DesktopFinancialBarChart({ data }: { data: MonthlyTrend[] }) {
  return (
    <div className="hidden md:block">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          روند جریان مالی
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
            <span className="text-xs text-[var(--text-muted)]">درآمد</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--error)]" />
            <span className="text-xs text-[var(--text-muted)]">هزینه</span>
          </div>
        </div>
      </div>

      <div className="flex h-32 items-end justify-between gap-2 px-2">
        {data.map((item) => (
          <div
            key={item.month}
            className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
          >
            <div className="flex h-24 w-full items-end justify-center gap-1">
              <div
                title={`درآمد ${item.month}: ${item.income} واحد`}
                style={{ height: `${item.income}%` }}
                className="w-2.5 rounded-t-md bg-[var(--success)] transition-all duration-200 group-hover:brightness-110"
              />

              <div
                title={`هزینه ${item.month}: ${item.expense} واحد`}
                style={{ height: `${item.expense}%` }}
                className="w-2.5 rounded-t-md bg-[var(--error)] transition-all duration-200 group-hover:brightness-110"
              />
            </div>

            <span className="text-xs font-medium text-[var(--text-muted)]">
              {item.month.slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 bg-[var(--background)] p-4 text-[var(--foreground)] sm:p-6 md:p-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
            داشبورد
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)] md:text-base">
            خلاصه وضعیت عملیاتی و مالی Voltec
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1 rounded-2xl border-[var(--border)] bg-[var(--surface)] shadow-none lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
              <Wallet className="h-5 w-5 text-[var(--brand)]" />
              وضعیت مالی
            </CardTitle>

            <Button
              variant="ghost"
              size="sm"
              className="text-[var(--text-secondary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-hover)]"
            >
              مشاهده گزارش
            </Button>
          </CardHeader>

          <CardContent className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
              <div className="space-y-3">
                <p className="text-sm text-[var(--text-muted)]">
                  بودجه تخصیص‌یافته
                </p>

                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  ۴۵,۲۳۰,۰۰۰,۰۰۰
                  <span className="mr-2 text-sm font-normal text-[var(--text-muted)]">
                    ریال
                  </span>
                </h3>

                <div className="space-y-2">
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-soft)]">
                    <div className="h-full w-[65%] rounded-full bg-[var(--brand)]" />
                  </div>

                  <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                    <span>مصرف‌شده از بودجه</span>
                    <span className="font-medium text-[var(--text-secondary)]">
                      ۶۵٪
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:flex md:gap-4">
                <div className="rounded-xl border border-[color:var(--success)]/10 bg-[var(--surface-soft)] p-4 md:flex-1">
                  <div className="mb-2 flex items-center gap-1 text-xs font-medium text-[color:var(--success)]">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    درآمد
                  </div>

                  <p className="font-semibold text-[var(--text-primary)]">
                    ۱۲.۴ میلیارد
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    ریال
                  </p>
                </div>

                <div className="rounded-xl border border-[color:var(--error)]/10 bg-[var(--surface-soft)] p-4 md:flex-1">
                  <div className="mb-2 flex items-center gap-1 text-xs font-medium text-[color:var(--error)]">
                    <ArrowDownRight className="h-3.5 w-3.5" />
                    هزینه
                  </div>

                  <p className="font-semibold text-[var(--text-primary)]">
                    ۸.۱ میلیارد
                  </p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    ریال
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-6">
              <MobileFinancialLineChart data={monthlyTrends} />
              <DesktopFinancialBarChart data={monthlyTrends} />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 rounded-2xl border-[var(--border)] bg-[var(--surface)] shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
              <Users className="h-5 w-5 text-[var(--brand)]" />
              تیم عملیاتی
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-[var(--surface-soft)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  ۱۲
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  تیم فنی
                </p>
              </div>

              <div className="rounded-xl bg-[var(--surface-soft)] p-4 text-center">
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  ۴
                </p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  بخش اداری
                </p>
              </div>
            </div>

           <Button
              variant="secondary" // تغییر از outline به secondary که در پروژه تعریف شده است
  className="w-full border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-hover)] transition-colors"
>
  مدیریت اعضا
</Button>

          </CardContent>
        </Card>

        <Card className="col-span-1 overflow-hidden rounded-2xl border-none bg-[var(--surface-dark)] text-[var(--text-on-dark)] shadow-2xl lg:col-span-3">
          <CardHeader className="border-b border-white/10 pb-4">
            <CardTitle className="flex items-center justify-between gap-4 text-base font-semibold">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-[var(--brand)]" />
                پروژه‌های با اولویت بالا
              </div>

              <Badge className="border-none bg-[var(--brand)]/10 text-[var(--brand)] hover:bg-[var(--brand)]/15">
                ۳ مورد فعال
              </Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="flex flex-col divide-y divide-white/10 md:flex-row md:divide-x md:divide-x-reverse md:divide-y-0">
              {priorityProjects.map((project, index) => {
                const statusMeta = getStatusMeta(project.status);

                return (
                  <Link
                    key={project.title}
                    href={`/dashboard/projects/${index}`}
                    className="group flex-1 p-5 transition-all duration-200 hover:bg-white/[0.04] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-inset md:p-6"
                  >
                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-bold text-[var(--text-on-dark)] transition-colors group-hover:text-[var(--brand)]">
                          {project.title}
                        </h4>

                        <p className="mt-1 text-xs text-white/55">
                          سررسید: {project.date}
                        </p>
                      </div>

                      <div
                        className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-white/60">پیشرفت</span>
                        <span className="font-mono font-semibold text-[var(--brand)]">
                          {project.progress}%
                        </span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-[var(--brand)]"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
