import mockUsers from "@/features/auth/api/mockUsers.json"
import { AUTH_AUDIENCE_ALLOWED_ROLES } from "@/features/auth/constants"
import type { AuthFormValues } from "@/features/auth/types/auth"
import type { MockUser } from "@/features/auth/types/auth"
import type { AuthAudience, AuthMode, UserRole } from "@/types"

export async function submitMockAuth(
  audience: AuthAudience,
  mode: AuthMode,
  payload: AuthFormValues,
) {
  const normalizedEmail = payload.email.trim().toLowerCase()
  const normalizedPassword = payload.password.trim()

  if (!normalizedEmail || !normalizedPassword) {
    return Promise.resolve({ ok: false as const })
  }

  if (mode === "login") {
    const allowedRoles = AUTH_AUDIENCE_ALLOWED_ROLES[audience]
    const existingUser = (mockUsers as MockUser[]).find(
      (user) =>
        user.email.toLowerCase() === normalizedEmail &&
        user.password_hash === normalizedPassword &&
        allowedRoles.includes(user.role),
    )

    if (!existingUser) {
      return Promise.resolve({ ok: false as const })
    }

    return Promise.resolve({
      ok: true as const,
      role: existingUser.role,
      mode,
      email: existingUser.email,
    })
  }

  const signupRole: UserRole = payload.signupRole ?? "CUSTOMER"
  const allowedSignupRoles = AUTH_AUDIENCE_ALLOWED_ROLES[audience]

  if (!allowedSignupRoles.includes(signupRole)) {
    return Promise.resolve({ ok: false as const })
  }

  const pseudoId = `u_${Date.now().toString().slice(-6)}`
  const newUser: MockUser = {
    id: pseudoId,
    email: normalizedEmail,
    password_hash: normalizedPassword,
    line_user_id: null,
    role: signupRole,
  }

  return Promise.resolve({
    ok: true as const,
    role: newUser.role,
    mode,
    email: normalizedEmail,
  })
}
