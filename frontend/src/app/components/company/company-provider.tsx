
"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

import type {
  JoinCompany,
  MyCompaniesResponseItem,
} from "./company-types"

import {
  clearActiveCompany,
  getActiveCompany,
  saveActiveCompany,
} from "./company-storage"

import api from "@/app/components/lib/api"

type PaginatedCompaniesResponse = {
  count: number
  next: string | null
  previous: string | null
  results: MyCompaniesResponseItem[]
}

type CompanyContextType = {
  companies: MyCompaniesResponseItem[]
  activeCompany: JoinCompany | null
  setActiveCompany: (company: JoinCompany | null) => void
  refreshCompanies: () => Promise<void>
  loading: boolean
}

const CompanyContext = createContext<CompanyContextType | undefined>(
  undefined
)

export function CompanyProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [companies, setCompanies] = useState<MyCompaniesResponseItem[]>([])

  const [activeCompany, setActiveCompanyState] =
    useState<JoinCompany | null>(null)

  const [loading, setLoading] = useState(true)

  const setActiveCompany = (company: JoinCompany | null) => {
    setActiveCompanyState(company)

    if (company) {
      saveActiveCompany(company)
    } else {
      clearActiveCompany()
    }
  }

  const refreshCompanies = async () => {
    setLoading(true)

    try {
      const res = await api.get("/tenants/")

      // ✅ API paginated response
      const data: PaginatedCompaniesResponse = res.data

      // ✅ فقط آرایه شرکت‌ها
      const companiesList = data.results || []

      setCompanies(companiesList)

      const cachedCompany = getActiveCompany()

      // ✅ اگر شرکت cache شده وجود داشت
      if (cachedCompany) {
        const exists = companiesList.find(
          (item) => item.id === cachedCompany.id
        )

        if (exists) {
          setActiveCompanyState(exists as JoinCompany)
        } else if (companiesList.length > 0) {
          // ✅ اگر cache invalid بود اولین شرکت را انتخاب کن
          const firstCompany = companiesList[0]

          setActiveCompanyState(firstCompany as JoinCompany)

          saveActiveCompany(firstCompany as JoinCompany)
        } else {
          setActiveCompanyState(null)
        }
      }

      // ✅ اگر cache وجود نداشت
      else if (companiesList.length > 0) {
        const firstCompany = companiesList[0]

        setActiveCompanyState(firstCompany as JoinCompany)

        saveActiveCompany(firstCompany as JoinCompany)
      }

      // ✅ اگر هیچ شرکتی نبود
      else {
        setActiveCompanyState(null)
      }
    } catch (error) {
      console.error("Company load error:", error)

      setCompanies([])
      setActiveCompanyState(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshCompanies()
  }, [])

  const value = useMemo(
    () => ({
      companies,
      activeCompany,
      setActiveCompany,
      refreshCompanies,
      loading,
    }),
    [companies, activeCompany, loading]
  )

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const ctx = useContext(CompanyContext)

  if (!ctx) {
    throw new Error(
      "useCompany must be used inside CompanyProvider"
    )
  }

  return ctx
}
