"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  const hideSidebar = pathname.startsWith("/dashboard/projects/create");

  return (
    <div className="flex min-h-screen bg-[var(--background)]">

      {!hideSidebar && <Sidebar />}

      <div className="flex flex-1 flex-col">
        <Topbar />

        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>

    </div>
  );
}
