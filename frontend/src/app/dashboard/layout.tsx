"use client";

import { AppShell } from "../components/layout/app-shell";
import { CompanyProvider } from "../components/company/company-provider";
import  CompanySelectorModal  from "../components/company/company-selector-modal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyProvider>
      <AppShell>
        {children}
        <CompanySelectorModal />
      </AppShell>
    </CompanyProvider>
  );
}
