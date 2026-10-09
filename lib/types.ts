export type UserRole = "user" | "admin";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  cash_balance: number;
  created_at: string;
}
