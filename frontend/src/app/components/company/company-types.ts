// src/app/components/company/company-types.ts

export type Company = {
  id: number
  company_name: string
  type_company: string
  status: string
  company_created_at: string
  access_level: string
  department: string
}

/**
 * شرکت‌هایی که کاربر عضو آن‌هاست
 */
export type JoinCompany = {
  id: number
  company_name: string
  type_company: string
  status: string
  company_created_at: string
  access_level: string
  department: string
}

/**
 * آیتم‌های response از API
 */
export type MyCompaniesResponseItem = {
  id: number
  company_name: string
  type_company: string
  status: string
  company_created_at: string
  access_level: string
  department: string
}
