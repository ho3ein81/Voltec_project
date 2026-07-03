"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";

import type { JoinCompany, MyCompaniesResponseItem } from "./company-types";

import {
  clearActiveCompany,
  getActiveCompany,
  saveActiveCompany,
} from "./company-storage";

import api from "@/app/components/lib/api";

type PaginatedCompaniesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MyCompaniesResponseItem[];
};

type CompanyContextType = {
  companies: MyCompaniesResponseItem[];
  activeCompany: JoinCompany | null;
  setActiveCompany: (company: JoinCompany | null) => void;
  refreshCompanies: () => Promise<void>;
  loading: boolean;
};

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<MyCompaniesResponseItem[]>([]);
  const [activeCompany, setActiveCompanyState] = useState<JoinCompany | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  const setActiveCompany = (company: JoinCompany | null) => {
    setActiveCompanyState(company);

    if (company) {
      saveActiveCompany(company);
    } else {
      clearActiveCompany();
    }
  };

  const refreshCompanies = useCallback(async () => {
    if (typeof window === "undefined") return;

    const accessToken = localStorage.getItem("access_token");

    // ✅ اگر لاگین نیست اصلا درخواست نزن
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/tenants/");
      const data: PaginatedCompaniesResponse = res.data;

      const companiesList = data.results || [];

      setCompanies(companiesList);

      const cachedCompany = getActiveCompany();

      if (cachedCompany) {
        const exists = companiesList.find((c) => c.id === cachedCompany.id);

        if (exists) {
          setActiveCompanyState(exists as JoinCompany);
          return;
        }
      }

      if (companiesList.length > 0) {
        const first = companiesList[0];

        setActiveCompanyState(first as JoinCompany);
        saveActiveCompany(first as JoinCompany);
      } else {
        setActiveCompanyState(null);
      }
    } catch (error) {
      console.error("Company load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // اجرا روی اولین mount
    refreshCompanies();
  }, []);

  // اجرا هنگام تغییر access_token
  useEffect(() => {
    const handler = () => {
      const token = localStorage.getItem("access_token");

      if (token) {
        // اگر توکن جدید آمده، یعنی login انجام شده → شرکت‌ها را refresh کن
        refreshCompanies();
      } else {
        // اگر توکن پاک شده → logout → state را پاک کن
        setCompanies([]);
        setActiveCompanyState(null);
      }
    };

    // وقتی در همین tab مقدار localStorage تغییر کند manually trigger نمی‌شود
    // پس حتماً در login باید این را dispatch کنی:
    // window.dispatchEvent(new Event("storage"))
    window.addEventListener("storage", handler);

    return () => window.removeEventListener("storage", handler);
  }, [refreshCompanies]);

  const value = useMemo(
    () => ({
      companies,
      activeCompany,
      setActiveCompany,
      refreshCompanies,
      loading,
    }),
    [companies, activeCompany, loading, refreshCompanies],
  );

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);

  if (!ctx) {
    throw new Error("useCompany must be used inside CompanyProvider");
  }

  return ctx;
}
