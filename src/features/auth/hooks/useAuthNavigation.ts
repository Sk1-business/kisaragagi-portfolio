import { useNavigate } from "react-router-dom"

import { submitMockAuth } from "@/features/auth/api/mockAuthApi"
import type { AuthFormValues } from "@/features/auth/types/auth"
import { ROUTES } from "@/constants/routes"
import type { AuthAudience, AuthMode, UserRole } from "@/types"

const REDIRECT_BY_ROLE: Record<UserRole, string> = {
  CUSTOMER: ROUTES.userHome,
  ADMIN: ROUTES.adminHome,
  STAFF: ROUTES.adminHome,
}

export function useAuthNavigation(audience: AuthAudience, mode: AuthMode) {
  const navigate = useNavigate()

  async function submit(values: AuthFormValues) {
    const result = await submitMockAuth(audience, mode, values)

    if (!result.ok) {
      return false
    }

    navigate(REDIRECT_BY_ROLE[result.role])
    return true
  }

  return { submit }
}
