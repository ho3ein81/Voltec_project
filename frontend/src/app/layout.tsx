import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { CompanyProvider } from "@/app/components/company/company-provider"; 

import { ToastProvider, ToastViewport } from "@/app/components/ui/toast";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
});

export const metadata: Metadata = {
  title: "VOLTEC",
  description: "VOLTEC Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazirmatn.variable} font-sans antialiased`}>
       <CompanyProvider>
        <ToastProvider>
          {children}

          <ToastViewport
           className="
  fixed bottom-4 left-1/2 -translate-x-1/2 z-[100]
  flex w-full max-w-[380px] flex-col gap-2
"

          />
        </ToastProvider>
</CompanyProvider>
        
      </body>
    </html>
  );
}
