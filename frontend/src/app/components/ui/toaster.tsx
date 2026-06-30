"use client"

import { ToastProvider, ToastViewport } from "@/app/components/ui/toast"

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport className="fixed bottom-4 left-4 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 sm:left-auto sm:right-4 sm:top-auto sm:flex-col md:max-w-[420px]" />
    </ToastProvider>
  )
}
