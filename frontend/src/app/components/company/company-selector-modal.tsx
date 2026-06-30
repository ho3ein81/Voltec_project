"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Building2,
  Check,
  Loader2,
  Plus,
  UserPlus,
} from "lucide-react"

import { useCompany } from "./company-provider"
import type {
  JoinCompany,
  MyCompaniesResponseItem,
} from "./company-types"

export default function CompanySelectorModal() {
  const {
    companies,
    activeCompany,
    setActiveCompany,
    loading,
  } = useCompany()

  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] =
    useState<number | null>(null)

  useEffect(() => {
    if (!loading && (!activeCompany || !companies?.length)) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [loading, activeCompany, companies])

  const selectCompany = async (
    item: MyCompaniesResponseItem
  ) => {
    setSelectedId(item.id)

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/tenants/select-company/${item.id}/`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      )

      if (!res.ok) {
        setSelectedId(null)
        return
      }

      setActiveCompany(item as JoinCompany)
      setOpen(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSelectedId(null)
    }
  }

  if (!open) return null

  const hasCompanies =
    Array.isArray(companies) && companies.length > 0

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl">
        
        {/* Header */}
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-emerald-400" />

            <h2 className="text-lg font-semibold">
              انتخاب شرکت
            </h2>
          </div>

          <p className="text-sm text-zinc-400">
            برای ادامه وارد یکی از شرکت‌های خودت شو
          </p>
        </div>

        {/* Companies */}
        <div className="space-y-2">
          {hasCompanies ? (
            companies.map((item) => {
              const isActive =
                activeCompany?.id === item.id

              const isLoading =
                selectedId === item.id

              return (
                <button
                  key={item.id}
                  onClick={() => selectCompany(item)}
                  disabled={isLoading}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-right transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <div className="flex items-center gap-3">
                    
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Building2 className="h-5 w-5" />
                    </div>

                    <div className="text-right">
                      <div className="font-medium text-white">
                        {item.company_name}
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-xs text-zinc-400">
                        <span>
                          {item.access_level}
                        </span>

                        <span className="text-zinc-600">
                          •
                        </span>

                        <span
                          className={
                            item.status === "فعال"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />
                    ) : isActive ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : null}
                  </div>
                </button>
              )
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
              
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                <Building2 className="h-7 w-7" />
              </div>

              <h3 className="mb-2 text-base font-semibold text-white">
                هیچ شرکتی یافت نشد
              </h3>

              <p className="mx-auto mb-6 max-w-sm text-sm leading-6 text-zinc-400">
                برای شروع، شرکت خودت را ثبت کن
                یا با کد دعوت وارد یک شرکت شو.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                
                {/* Register Company */}
                <Link
                  href="/"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-medium text-black transition hover:bg-emerald-400"
                >
                  <Plus className="h-4 w-4" />

                  <span>ثبت شرکت</span>
                </Link>

                {/* Invite Code */}
                <Link
                  href="/invite"
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <UserPlus className="h-4 w-4" />

                  <span>ورود با کد دعوت</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
