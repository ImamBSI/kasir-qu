import type { UserRole } from "@/types";

export interface ManagedUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserManagerActionResult {
  ok: boolean;
  error?: string;
}
