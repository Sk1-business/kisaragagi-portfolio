import type { AuthAudience, AuthMode, UserRole } from "@/types"

export interface AuthFormValues {
  email: string
  password: string
  signupRole?: UserRole
}

export interface AuthFormCardProps {
  audience: AuthAudience
  mode: AuthMode
}

export type AuthSubmitResult =
  | { ok: true }
  | { ok: false; reason?: "unauthorized" | "generic" }

export interface MockUser {
  id: string
  email: string
  password_hash: string
  line_user_id: string | null
  role: UserRole
}
