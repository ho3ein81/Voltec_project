// src/app/components/company/company-storage.ts

import type { JoinCompany } from "./company-types"

const KEY = "active_company"

export function saveActiveCompany(company: JoinCompany) {
  if (typeof window === "undefined") return
  localStorage.setItem(KEY, JSON.stringify(company))
}

export function getActiveCompany(): JoinCompany | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw) as JoinCompany
  } catch {
    return null
  }
}

export function clearActiveCompany() {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEY)
}
