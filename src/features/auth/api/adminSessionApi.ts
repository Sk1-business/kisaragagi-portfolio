import { ADMIN_AUTH_PATHS } from "@/constants/adminApi"
import { apiFetch } from "@/lib/api"

export type AdminSessionResult = "ok" | "unauthorized" | "error"

/**
 * Struct `auth.get_me` — 200 で認証済み、401 で未認証。
 */
export async function fetchAdminSession(): Promise<AdminSessionResult> {
  try {
    const res = await apiFetch(ADMIN_AUTH_PATHS.me, { method: "GET" })
    if (res.ok) return "ok"
    if (res.status === 401) return "unauthorized"
    return "error"
  } catch {
    return "error"
  }
}
