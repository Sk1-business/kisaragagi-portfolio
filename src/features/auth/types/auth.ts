import type { AuthAudience, AuthMode, UserRole } from "@/types"

export interface AuthFormValues {
  email: string
  password: string
  signupRole?: UserRole
  name?: string
  phone?: string
}

export interface AuthFormCardProps {
  audience: AuthAudience
  mode: AuthMode
}

export interface MockUser {
  id: string
  email: string
  password_hash: string
  line_user_id: string | null
  role: UserRole
}
