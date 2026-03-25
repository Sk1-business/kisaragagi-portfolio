import { API_BASE } from "@/lib/apiBase"
import { notifyUnauthorizedCustomerApi } from "@/lib/customerSession"

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  signal?: AbortSignal
}

interface ErrorResponse {
  detail?: string | { msg?: string }[]
  message?: string
}

export class ApiClientError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiClientError"
    this.status = status
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ErrorResponse
    if (typeof data.detail === "string") return data.detail
    if (Array.isArray(data.detail) && data.detail[0]?.msg) return data.detail[0].msg
    if (data.message) return data.message
  } catch {
    // Ignore parse errors and fallback to default message.
  }

  if (response.status === 401) return "再ログインが必要です。"
  if (response.status === 409) return "予約枠が競合しました。別の時間を選択してください。"
  if (response.status === 422) return "入力内容に不備があります。"
  return "通信に失敗しました。しばらくしてから再度お試しください。"
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET"
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  })

  if (!response.ok) {
    if (response.status === 401) {
      notifyUnauthorizedCustomerApi(path)
    }
    const message = await parseErrorMessage(response)
    throw new ApiClientError(message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
