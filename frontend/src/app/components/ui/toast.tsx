"use client"

import * as React from "react"

export interface ToastProps {
  id: string
  title?: string
}

interface ToastContextType {
  toasts: ToastProps[]
  addToast: (toast: ToastProps) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function useToastContext() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToastContext must be used within ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const addToast = (toast: ToastProps) => {
    setToasts((prev) => [...prev, toast])

    setTimeout(() => {
      removeToast(toast.id)
    }, 3000)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function ToastViewport({
  className,
}: {
  className?: string
}) {
  const { toasts } = useToastContext()

  return (
    <div className={className}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-sm text-sm text-[var(--text-primary)]"
        >
          {toast.title}
        </div>
      ))}
    </div>
  )
}
