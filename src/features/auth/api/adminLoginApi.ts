import { ADMIN_AUTH_PATHS } from "@/constants/adminApi"
import { apiFetch } from "@/lib/api"
import { API_BASE } from "@/lib/apiBase"
import type { UserRole } from "@/types"

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

export async function postAdminSignup(payload: {
  email: string
  password: string
  name: string
  role: Exclude<UserRole, "CUSTOMER">
  salonName?: string
  salonSlug?: string
  shopSlug?: string
  inviteToken?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/admin/signup`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: payload.email.trim(),
        password: payload.password,
        name: payload.name.trim(),
        role: payload.role,
        salon_name: payload.salonName?.trim() || undefined,
        salon_slug: payload.salonSlug?.trim().toLowerCase() || undefined,
        shop_slug: payload.shopSlug?.trim().toLowerCase() || undefined,
        invite_token: payload.inviteToken?.trim() || undefined,
      }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      return { ok: false, error: parseAdminSignupError(body, response.status) }
    }
    return { ok: true }
  } catch {
    return { ok: false, error: "登録に失敗しました。" }
  }
}

function parseAdminSignupError(body: unknown, status: number): string {
  if (!body || typeof body !== "object") {
    return status === 409 ? "すでに登録済みの情報があります。" : "登録内容を確認してください。"
  }
  const detail = (body as { detail?: unknown }).detail
  if (typeof detail === "string" && detail.trim()) return detail
  if (!Array.isArray(detail)) return "登録内容を確認してください。"

  const messages = detail
    .map((item) => {
      if (!item || typeof item !== "object") return ""
      const record = item as { loc?: unknown[]; type?: string; msg?: string }
      const field = record.loc?.filter((segment) => segment !== "body").at(-1)
      const fieldName = typeof field === "string" ? adminSignupFieldLabel(field) : "入力項目"
      const type = record.type ?? ""
      if (type.includes("string_pattern_mismatch")) {
        return `${fieldName}は、小文字英数字とハイフンのみで入力してください。先頭と末尾は小文字英数字にしてください。`
      }
      if (type.includes("string_too_short")) return `${fieldName}を入力してください。`
      if (type.includes("missing")) return `${fieldName}を入力してください。`
      if (type.includes("value_error")) return `${fieldName}の形式を確認してください。`
      return `${fieldName}の入力内容を確認してください。`
    })
    .filter(Boolean)

  return messages.length ? messages.join("\n") : "登録内容を確認してください。"
}

function adminSignupFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    email: "メールアドレス",
    password: "パスワード",
    name: "氏名",
    role: "ロール",
    salon_name: "サロン名",
    salon_slug: "予約ページURL slug",
    shop_slug: "所属サロン slug",
    invite_token: "招待トークン",
  }
  return labels[field] ?? "入力項目"
}
