const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""

interface RegisterPayload {
  email: string
  password: string
  name: string
  phone?: string
}

interface RegisterResponse {
  message: string
  customer_id: string
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
}

interface LoginResponse {
  message: string
  customer_id: string
  name: string
}

export async function loginCustomer(payload: LoginPayload): Promise<
  | { ok: true; data: LoginResponse }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
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
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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

export async function logoutCustomer(): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    })
  } catch {
    // ログアウト失敗でもトップへ遷移させる
  }
}

export async function getLineLoginUrl(): Promise<
  | { ok: true; url: string }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/line/url`)
    if (res.ok) {
      const data = (await res.json()) as { url: string }
      return { ok: true, url: data.url }
    }
    return { ok: false, error: "LINE認証URLの取得に失敗しました" }
  } catch {
    return { ok: false, error: "サーバーに接続できませんでした" }
  }
}

export async function lineCallback(code: string): Promise<
  | { ok: true; data: { message: string; customer_id: string; name: string } }
  | { ok: false; error: string }
> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/line/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    })

    if (res.ok) {
      const data = (await res.json()) as { message: string; customer_id: string; name: string }
      return { ok: true, data }
    }

    const errorBody = await res.json().catch(() => null)
    const message = parseErrorDetail(errorBody) || "LINE認証に失敗しました"
    return { ok: false, error: message }
  } catch {
    return { ok: false, error: "サーバーに接続できませんでした" }
  }
}
