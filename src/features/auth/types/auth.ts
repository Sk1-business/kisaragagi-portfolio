import type { AuthAudience, AuthMode, UserRole } from "@/types"

export type Gender = "male" | "female" | "not_specified"

export interface AuthFormValues {
  email: string
  password: string
  signupRole?: UserRole
  name?: string
  phone?: string
  shopSlug?: string
  gender?: Gender
  birthDate?: string
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
