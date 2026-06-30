"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  JoinCompany,
  MyCompaniesResponseItem,
} from "./company-types";

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
  const [activeCompany, setActiveCompanyState] = useState<JoinCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const setActiveCompany = (company: JoinCompany | null) => {
    setActiveCompanyState(company);

    if (company) {
      saveActiveCompany(company);
    } else {
      clearActiveCompany();
    }
  };

  const refreshCompanies = async () => {
    // اگر در کلاینت نیستیم، اجرا نشود
    if (typeof window === "undefined") return;

    setLoading(true);
    try {
      const res = await api.get("/tenants/");
      const data: PaginatedCompaniesResponse = res.data;
      const companiesList = data.results || [];

      setCompanies(companiesList);

      const cachedCompany = getActiveCompany();

      if (cachedCompany) {
        const exists = companiesList.find((item) => item.id === cachedCompany.id);

        if (exists) {
          setActiveCompanyState(exists as JoinCompany);
        } else if (companiesList.length > 0) {
          const firstCompany = companiesList[0];
          setActiveCompanyState(firstCompany as JoinCompany);
          saveActiveCompany(firstCompany as JoinCompany);
        } else {
          setActiveCompanyState(null);
        }
      } else if (companiesList.length > 0) {
        const firstCompany = companiesList[0];
        setActiveCompanyState(firstCompany as JoinCompany);
        saveActiveCompany(firstCompany as JoinCompany);
      } else {
        setActiveCompanyState(null);
      }
    } catch (error) {
      console.error("Company load error:", error);
      setCompanies([]);
      setActiveCompanyState(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    refreshCompanies();
  }, []);

  const value = useMemo(
    () => ({
      companies,
      activeCompany,
      setActiveCompany,
      refreshCompanies,
      // اگر هنوز مونت نشده باشد، لودینگ را true برگردان تا UI در حالت SSR به مشکل نخورد
      loading: !isMounted || loading,
    }),
    [companies, activeCompany, loading, isMounted]
  );

  return (
    <CompanyContext.Provider value={value}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const ctx = useContext(CompanyContext);

  if (!ctx) {
    throw new Error("useCompany must be used inside CompanyProvider");
  }

  return ctx;
}
