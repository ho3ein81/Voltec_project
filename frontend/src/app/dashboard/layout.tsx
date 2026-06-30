// src/app/dashboard/layout.tsx
"use client";

import { AppShell } from "../components/layout/app-shell";
import CompanySelectorModal from "../components/company/company-selector-modal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // دیگر نیازی به CompanyProvider اینجا نیست چون در RootLayout است
  return (
    <AppShell>
      {children}
      <CompanySelectorModal />
    </AppShell>
  );
}
