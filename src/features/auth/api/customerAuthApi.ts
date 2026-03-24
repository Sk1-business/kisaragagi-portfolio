import { API_BASE } from "@/lib/apiBase"
import { clearCustomerPortalClientCaches } from "@/lib/customerSession"
import { buildSalonApiPath, persistShopSlug, resolveShopSlug } from "@/lib/shopSlug"

interface RegisterPayload {
  email: string
  password: string
  name: string
  phone?: string
  shopSlug?: string
}

interface RegisterResponse {
  message: string
  user_id: string
  name: string
}

interface ValidationErrorItem {
  loc: (string | number)[]
  msg: string
  type: string
}

const FIELD_LABELS: Record<string, string> = {
  email: "メールアドレス",
  password: "パスワード",
  name: "お名前",
  phone: "電話番号",
}

const MSG_PATTERNS: [RegExp, string][] = [
  [/string should have at least (\d+) characters/i, "$1文字以上で入力してください"],
  [/value is not a valid email address/i, "正しい形式で入力してください"],
  [/field required/i, "入力必須です"],
  [/string type expected/i, "文字列で入力してください"],
]

function translateMsg(msg: string): string {
  for (const [pattern, replacement] of MSG_PATTERNS) {
    if (pattern.test(msg)) {
      return msg.replace(pattern, replacement)
    }
  }
  return msg
}

function parseErrorDetail(body: unknown): string {
  if (!body || typeof body !== "object") return ""

  const obj = body as Record<string, unknown>

  if (typeof obj.detail === "string") {
    return obj.detail
  }

  if (Array.isArray(obj.detail)) {
    const items = obj.detail as ValidationErrorItem[]
    return items
      .map((item) => {
        const rawField = item.loc.filter((s) => s !== "body").join(".")
        const field = FIELD_LABELS[rawField] ?? rawField
        const msg = translateMsg(item.msg)
        return field ? `${field}: ${msg}` : msg
      })
      .join("\n")
  }

  return ""
}

interface LoginPayload {
  email: string
  password: string
  shopSlug?: string
}

interface LoginResponse {
  message: string
  user_id: string
  name: string
}

export async function loginCustomer(payload: LoginPayload): Promise<
  | { ok: true; data: LoginResponse }
  | { ok: false; error: string }
> {
  const shopSlug = resolveShopSlug(payload.shopSlug)
  if (!shopSlug) {
    return { ok: false, error: "店舗情報が見つかりません。店舗ページからアクセスしてください。" }
  }
  try {
    const res = await fetch(`${API_BASE}${buildSalonApiPath(shopSlug, "/auth/login")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    })

    if (res.ok) {
      const data = (await res.json()) as LoginResponse
      return { ok: true, data }
    }

    const errorBody = await res.json().catch(() => null)
    const message = parseErrorDetail(errorBody) || "ログインに失敗しました"
    return { ok: false, error: message }
  } catch {
    return { ok: false, error: "サーバーに接続できませんでした" }
  }
}

export async function registerCustomer(payload: RegisterPayload): Promise<
  | { ok: true; data: RegisterResponse }
  | { ok: false; error: string }
> {
  const shopSlug = resolveShopSlug(payload.shopSlug)
  if (!shopSlug) {
    return { ok: false, error: "店舗情報が見つかりません。店舗ページからアクセスしてください。" }
  }
  try {
    const res = await fetch(`${API_BASE}${buildSalonApiPath(shopSlug, "/auth/register")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        name: payload.name,
        phone: payload.phone,
      }),
    })

    if (res.ok) {
      const data = (await res.json()) as RegisterResponse
      return { ok: true, data }
    }

    const errorBody = await res.json().catch(() => null)
    const message = parseErrorDetail(errorBody) || `登録に失敗しました (${res.status})`
    return { ok: false, error: message }
  } catch {
    return { ok: false, error: "サーバーに接続できませんでした" }
  }
}

/** Cookie ベースのセッションが有効か（apiRequest は使わず 401 時のグローバル処理と干渉しない） */
export async function checkCustomerSessionAlive(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    })
    return res.ok
  } catch {
    return false
  }
}

export async function logoutCustomer(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
  } catch {
    // ログアウト失敗でもクライアント側は掃除する
  } finally {
    clearCustomerPortalClientCaches()
  }
}

export async function getLineLoginUrl(inputShopSlug?: string): Promise<
  | { ok: true; url: string }
  | { ok: false; error: string }
> {
  const shopSlug = resolveShopSlug(inputShopSlug)
  if (!shopSlug) {
    return { ok: false, error: "店舗情報が見つかりません。店舗ページからアクセスしてください。" }
  }
  try {
    persistShopSlug(shopSlug)
    const res = await fetch(`${API_BASE}${buildSalonApiPath(shopSlug, "/auth/line/url")}`, {
      credentials: "include",
    })
    if (res.ok) {
      const data = (await res.json()) as { url: string }
      return { ok: true, url: data.url }
    }
    return { ok: false, error: "LINE認証URLの取得に失敗しました" }
  } catch {
    return { ok: false, error: "サーバーに接続できませんでした" }
  }
}

export async function lineCallback(code: string, state?: string): Promise<
  | { ok: true; data: { message: string; user_id: string; name: string } }
  | { ok: false; error: string }
> {
  const shopSlug = resolveShopSlug()
  if (!shopSlug) {
    return { ok: false, error: "店舗情報が見つかりません。再度ログインしてください。" }
  }
  try {
    const res = await fetch(`${API_BASE}${buildSalonApiPath(shopSlug, "/auth/line/callback")}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, state }),
    })

    if (res.ok) {
      const data = (await res.json()) as { message: string; user_id: string; name: string }
      return { ok: true, data }
    }

    const errorBody = await res.json().catch(() => null)
    const message = parseErrorDetail(errorBody) || "LINE認証に失敗しました"
    return { ok: false, error: message }
  } catch {
    return { ok: false, error: "サーバーに接続できませんでした" }
  }
}
