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
    const message =
      (errorBody as { detail?: string } | null)?.detail ??
      `登録に失敗しました (${res.status})`
    return { ok: false, error: message }
  } catch {
    return { ok: false, error: "サーバーに接続できませんでした" }
  }
}
