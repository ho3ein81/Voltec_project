export type UserRole = "MODERATOR" | "MEMBER" | "SUPPORTER";

export interface Profile {
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  national_id: string;
  phone: string;
  date_of_birth?: string;
  shenasname_number?: string;
  father_name?: string;
  attachment?: string;
  date_joined: string;
  last_login?: string;
  profile: Profile;
}
