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

/** `POST /api/admin/logout` — Cookie の access_token を削除（失敗しても無視） */
export async function postAdminLogout(): Promise<void> {
  try {
    await apiFetch(ADMIN_AUTH_PATHS.logout, { method: "POST" })
  } catch {
    // 未ログイン・通信失敗でもログイン画面へ戻せるよう握りつぶす
  }
}

const ADMIN_SIGNUP_PROBE_PATH = "/api/admin/signup" as const

export type AdminEmailCheckResult =
  | { kind: "available" }
  | { kind: "taken"; message?: string }
  | { kind: "error"; status?: number; message?: string }

function readableDetail(detail: unknown): string | undefined {
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    for (const item of detail) {
      if (item && typeof item === "object") {
        const m = (item as { msg?: unknown }).msg
        if (typeof m === "string" && m.trim()) return m
      }
    }
  }
  return undefined
}

function detailLooksLikeDuplicate(detail: string): boolean {
  const t = detail.trim()
  if (!t) return false
  if (/(既に|すでに).*(登録|使用)/.test(t)) return true
  if (/重複|登録済/.test(t)) return true
  const lower = t.toLowerCase()
  return lower.includes("duplicate") || lower.includes("already") || lower.includes("exists")
}

function detailLooksLikeMissingSalon(detail: string): boolean {
  return /サロン名|salon_name|slug|サロン|予約ページ/i.test(detail)
}

/**
 * 入力されたメールアドレスが `admin_users` に既に登録済みか確認する。
 *
 * バックエンドに専用 API が無いので、`POST /api/admin/signup` を
 * 「`role=ADMIN` だけ送って `salon_name`/`salon_slug` を意図的に欠落させた」
 * ペイロードで叩いて判別する：
 *  - 重複時 → 409 (`ConflictError("このメールアドレスは既に登録されています")`)
 *  - 未登録 → 400 (`BadRequestError("管理者登録にはサロン名が必要です")`)
 *
 * 重要: バックエンドの存在チェックは salon の INSERT より前に走るため、
 * `salons` テーブルの未マイグレーションカラム由来の 500 を踏まずに済む。
 */
export async function checkAdminEmailExists(email: string): Promise<AdminEmailCheckResult> {
  const trimmed = email.trim()
  if (!trimmed) return { kind: "error", message: "メールアドレスが空です。" }
  try {
    const res = await apiFetch(ADMIN_SIGNUP_PROBE_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: trimmed,
        password: "probe-password-1234",
        name: "probe",
        role: "ADMIN",
      }),
    })

    let detailString: string | undefined
    try {
      const data = (await res.clone().json()) as { detail?: unknown } | null
      detailString = readableDetail(data?.detail)
    } catch {
      // JSON でなければ detail なしで進める
    }

    if (res.status === 409) return { kind: "taken", message: detailString }
    if (res.status === 400) {
      if (detailString && detailLooksLikeDuplicate(detailString)) {
        return { kind: "taken", message: detailString }
      }
      if (detailString && detailLooksLikeMissingSalon(detailString)) {
        return { kind: "available" }
      }
      return { kind: "error", status: 400, message: detailString }
    }
    if (res.ok) {
      // 想定外: 200 が返ったら、サロン情報無しで登録できた = 既存仕様外。
      // 安全側に倒して取得済みとして扱わない。
      return { kind: "error", status: res.status, message: detailString }
    }
    return { kind: "error", status: res.status, message: detailString }
  } catch {
    return { kind: "error" }
  }
}
