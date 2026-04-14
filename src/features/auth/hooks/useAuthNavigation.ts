import { useNavigate } from "react-router-dom"

import { loginCustomer, registerCustomer } from "@/features/auth/api/customerAuthApi"
import { submitMockAuth } from "@/features/auth/api/mockAuthApi"
import type { AuthFormValues } from "@/features/auth/types/auth"
import { ROUTES } from "@/constants/routes"
import type { AuthAudience, AuthMode, UserRole } from "@/types"

const REDIRECT_BY_ROLE: Record<UserRole, string> = {
  CUSTOMER: ROUTES.userHome,
  ADMIN: ROUTES.adminHome,
  STAFF: ROUTES.adminHome,
}

export interface RegisteredInfo {
  name: string
  email: string
  phone?: string
}

export type SubmitResult =
  | { ok: true; registered?: RegisteredInfo }
  | { ok: false; error?: string }

export function useAuthNavigation(audience: AuthAudience, mode: AuthMode) {
  const navigate = useNavigate()

  async function submit(values: AuthFormValues): Promise<SubmitResult> {
    if (audience === "CUSTOMER_PORTAL" && mode === "signup") {
      const name = values.name ?? values.email
      const result = await registerCustomer({
        email: values.email,
        password: values.password,
        name,
        phone: values.phone,
        shopSlug: values.shopSlug,
        gender: values.gender,
        birthDate: values.birthDate,
      })

      if (!result.ok) {
        return { ok: false, error: result.error }
      }

      return {
        ok: true,
        registered: {
          name: result.data.name,
          email: values.email,
          phone: values.phone,
        },
      }
    }

    if (audience === "CUSTOMER_PORTAL" && mode === "login") {
      const result = await loginCustomer({
        email: values.email,
        password: values.password,
        shopSlug: values.shopSlug,
      })

      if (!result.ok) {
        return { ok: false, error: result.error }
      }

      navigate(REDIRECT_BY_ROLE.CUSTOMER, { replace: true })
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
