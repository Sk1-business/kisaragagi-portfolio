import { useNavigate } from "react-router-dom"

import { registerCustomer } from "@/features/auth/api/customerAuthApi"
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

  async function submit(values: AuthFormValues): Promise<{ ok: true } | { ok: false; error?: string }> {
    if (audience === "CUSTOMER_PORTAL" && mode === "signup") {
      const name = values.name ?? values.email
      const result = await registerCustomer({
        email: values.email,
        password: values.password,
        name,
        phone: values.phone,
      })

      if (!result.ok) {
        return { ok: false, error: result.error }
      }

      navigate(REDIRECT_BY_ROLE.CUSTOMER)
      return { ok: true }
    }

    const result = await submitMockAuth(audience, mode, values)

    if (!result.ok) {
      return { ok: false }
    }

    navigate(REDIRECT_BY_ROLE[result.role])
    return { ok: true }
  }

  return { submit }
}
