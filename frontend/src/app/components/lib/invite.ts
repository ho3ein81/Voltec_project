import api from "./api";

// =============================
// Types
// =============================

export interface InviteCode {
  id: number;
  code: string;
  expired_at: string;
  max_uses: number;
  uses: number;
  is_active: boolean;
}

export interface InvitePreview {
  company_id: number;
  search_id: number;

  company: {
    name: string;
    type_company?: string;
    province?: string;
    city?: string;
    status?: string;
  };

  success?: string;

  token?: {
    token: string;
  };
}

// =============================
// Owner - Invite Codes
// =============================

// لیست کدهای دعوت
export const getInviteCodes = async (joinId: number): Promise<InviteCode[]> => {
  try {
    const res = await api.get(`/tenants/company-invite/${joinId}/`);
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 403) {
      throw new Error("FORBIDDEN");
    }
    throw error;
  }
};

// ساخت کد دعوت
export const createInviteCode = async (
  joinId: number,
  data: {
    expired_at: string;
    max_uses: number;
  }
): Promise<InviteCode> => {
  try {
    const res = await api.post(`/tenants/company-invite/${joinId}/`, data);
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 403) {
      throw new Error("FORBIDDEN");
    }
    throw error;
  }
};

// حذف کد دعوت
export const deleteInviteCode = async (
  joinId: number,
  codeId: number
) => {
  try {
    const res = await api.delete(`/tenants/company-invite/${joinId}/${codeId}/`);
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 403) {
      throw new Error("FORBIDDEN");
    }
    throw error;
  }
};

// ویرایش کد دعوت
export const updateInviteCode = async (
  joinId: number,
  codeId: number,
  data: Partial<{
    expired_at: string;
    max_uses: number;
    is_active: boolean;
  }>
): Promise<InviteCode> => {
  try {
    const res = await api.patch(
      `/tenants/company-invite/${joinId}/${codeId}/`,
      data
    );
    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 403) {
      throw new Error("FORBIDDEN");
    }
    throw error;
  }
};

// =============================
// User - Search & Join
// =============================

// بررسی کد دعوت (Preview)
export const searchInviteCode = async (
  code: string
): Promise<InvitePreview> => {
  try {
    const res = await api.post(`/tenants/company-invite/search/`, { code });

    const raw = res.data;

    return {
      company_id: raw.company_id,
      search_id: raw.search_id,

      company: {
        name: raw.company?.name,
        type_company: raw.company?.type_company,
        province: raw.company?.province,
        city: raw.company?.city,
        status: raw.company?.status,
      },

      success: raw.success,
      token: raw.token,
    };
  } catch (error: any) {
    if (error?.response?.status === 403) {
      throw new Error("FORBIDDEN");
    }
    throw error;
  }
};

// عضویت در شرکت
export const joinToCompany = async (
  companyId: number,
  searchId: number,
  inviteToken?: string
) => {
  try {
    const res = await api.post(
      `/tenants/company-invite/join/${companyId}/${searchId}/`,
      {
        token: inviteToken,
      }
    );

    return res.data;
  } catch (error: any) {
    if (error?.response?.status === 403) {
      throw new Error("FORBIDDEN");
    }
    throw error;
  }
};
