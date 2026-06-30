"use client"

import { useEffect, useRef, useState } from "react"
import { Building2, ChevronDown, Check } from "lucide-react"

import { useCompany } from "./company-provider"
import type {
  JoinCompany,
  MyCompaniesResponseItem,
} from "./company-types"

import api from "@/app/components/lib/api"

export default function CompanySwitcher() {
  const { companies, activeCompany, setActiveCompany } = useCompany()

  const [open, setOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", onClickOutside)

    return () => {
      document.removeEventListener("mousedown", onClickOutside)
    }
  }, [])

  const switchCompany = async (
    item: MyCompaniesResponseItem
  ) => {
    if (activeCompany?.id === item.id) {
      setOpen(false)
      return
    }

    try {
      setLoadingId(item.id)

      /*
        تمام auth توسط axios interceptor
        داخل api.ts مدیریت می‌شود
      */
      await api.post(`/tenants/${item.id}/`)

      setActiveCompany(item as JoinCompany)

      setOpen(false)
    } catch (error) {
      console.error("Switch company error:", error)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="
          flex items-center gap-2
          rounded-full border border-zinc-200
          bg-white px-3 py-2
          text-sm font-medium text-zinc-900
          shadow-sm transition
          hover:bg-zinc-50
        "
      >
        <Building2 className="h-4 w-4 text-emerald-600" />

        <span className="max-w-[140px] truncate">
          {activeCompany?.company_name || "انتخاب شرکت"}
        </span>

        <ChevronDown className="h-4 w-4 text-zinc-500" />
      </button>

      {open && (
        <div
          className="
            absolute right-0 mt-2 w-72
            overflow-hidden rounded-2xl
            border border-zinc-200
            bg-white shadow-lg
            z-50
          "
        >
          <div className="border-b border-zinc-100 px-4 py-3">
            <div className="text-sm font-semibold text-zinc-900">
              شرکت‌های من
            </div>

            <div className="text-xs text-zinc-500">
              برای سوییچ روی یکی بزن
            </div>
          </div>

          <div className="max-h-72 overflow-auto p-2">
            {companies.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-zinc-500">
                شرکتی یافت نشد
              </div>
            ) : (
              companies.map((item) => {
                const isActive =
                  activeCompany?.id === item.id

                const isLoading =
                  loadingId === item.id

                return (
                  <button
                    key={item.id}
                    disabled={isLoading}
                    onClick={() => switchCompany(item)}
                    className="
                      flex w-full items-center
                      justify-between rounded-xl
                      px-3 py-2 text-right
                      transition
                      hover:bg-zinc-100
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex h-9 w-9
                          items-center justify-center
                          rounded-xl bg-zinc-100
                        "
                      >
                        <Building2 className="h-4 w-4 text-zinc-700" />
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-medium text-zinc-900">
                          {item.company_name}
                        </div>

                        <div className="text-xs text-zinc-500">
                          {item.access_level || "Member"}
                        </div>
                      </div>
                    </div>

                    {isActive ? (
                      <Check className="h-4 w-4 text-emerald-600" />
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
