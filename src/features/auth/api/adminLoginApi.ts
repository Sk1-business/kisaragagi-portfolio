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

const ADMIN_SIGNUP_PROBE_PATH = ADMIN_AUTH_PATHS.signup

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

/**
 * `POST /api/admin/signup` の本実装。
 * バックエンド: `app/api/admin/auth.py::signup`
 *
 * - 成功時: Set-Cookie で `access_token` が発行され、以降の `/api/admin/...` が認証通る
 * - 副作用: `salons` / `salon_profiles`(slug+timezone のみ) / `admin_users`(owner) / `trainers` に INSERT
 * - `salon_slug` 省略時はサーバーが一意の slug を自動採番する
 */
export type AdminSignupSubmitResult =
  | { kind: "ok" }
  | { kind: "duplicate_email"; message?: string }
  | { kind: "duplicate_slug"; message?: string }
  | { kind: "validation"; message?: string }
  | { kind: "error"; status?: number; message?: string }

function detailLooksLikeSlugConflict(detail: string): boolean {
  return /slug|スラッグ|予約ページURL|予約ページ url/i.test(detail)
}

export async function postAdminSignup(payload: {
  email: string
  password: string
  name: string
  salon_name: string
  /** 省略時は API がサロン名などから一意の slug を自動採番 */
  salon_slug?: string
}): Promise<AdminSignupSubmitResult> {
  try {
    const body: Record<string, unknown> = {
      email: payload.email.trim(),
      password: payload.password,
      name: payload.name.trim(),
      role: "ADMIN",
      salon_name: payload.salon_name.trim(),
    }
    const slug = payload.salon_slug?.trim().toLowerCase()
    if (slug) {
      body.salon_slug = slug
    }
    const res = await apiFetch(ADMIN_AUTH_PATHS.signup, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    let detailString: string | undefined
    try {
      const data = (await res.clone().json()) as { detail?: unknown } | null
      detailString = readableDetail(data?.detail)
    } catch {
      // 非 JSON レスポンスでも fallthrough
    }

    if (res.ok) return { kind: "ok" }
    if (res.status === 409) {
      if (detailString && detailLooksLikeSlugConflict(detailString)) {
        return { kind: "duplicate_slug", message: detailString }
      }
      return { kind: "duplicate_email", message: detailString }
    }
    if (res.status === 400 || res.status === 422) {
      return { kind: "validation", message: detailString }
    }
    return { kind: "error", status: res.status, message: detailString }
  } catch {
    return { kind: "error" }
  }
}
