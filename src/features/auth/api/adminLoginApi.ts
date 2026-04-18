import { ADMIN_AUTH_PATHS } from "@/constants/adminApi"
import { apiFetch } from "@/lib/api"

export type AdminLoginResult = "ok" | "unauthorized" | "error"

/**
 * Struct `auth.login` — 成功時 Set-Cookie で access_token（HttpOnly, SameSite=Lax, 8h）
 */
export async function postAdminLogin(payload: {
  email: string
  password: string
}): Promise<AdminLoginResult> {
  try {
    const res = await apiFetch(ADMIN_AUTH_PATHS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: payload.email.trim(),
        password: payload.password,
      }),
    })
    if (res.ok) return "ok"
    if (res.status === 401) return "unauthorized"
    return "error"
  } catch {
    return "error"
  }
}
