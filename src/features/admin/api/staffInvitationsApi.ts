import { ADMIN_STAFF_INVITATIONS_PATH } from "@/constants/adminApi"
import { apiFetch } from "@/lib/api"

export type StaffInvitationResult =
  | { kind: "ok"; adminId: string; email: string }
  | { kind: "unauthorized" }
  | { kind: "duplicate"; message: string }
  | { kind: "validation"; message: string }
  | { kind: "error"; message: string }

function readableDetail(raw: unknown): string {
  if (!raw || typeof raw !== "object") return ""
  const detail = (raw as { detail?: unknown; message?: unknown }).detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail)) {
    for (const item of detail) {
      if (item && typeof item === "object") {
        const msg = (item as { msg?: unknown }).msg
        if (typeof msg === "string" && msg.trim()) return msg
      }
    }
  }
  const message = (raw as { message?: unknown }).message
  return typeof message === "string" ? message : ""
}

function pickAdminId(raw: unknown): string {
  if (!raw || typeof raw !== "object") return ""
  const o = raw as Record<string, unknown>
  const value = o.admin_id ?? o.adminId
  return typeof value === "string" ? value.trim() : ""
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

export async function postStaffInvitation(payload: {
  email: string
  name: string
  initialPassword: string
}): Promise<StaffInvitationResult> {
  const email = payload.email.trim().toLowerCase()
  try {
    const res = await apiFetch(ADMIN_STAFF_INVITATIONS_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name: payload.name.trim(),
        initial_password: payload.initialPassword,
      }),
    })
    const data = await parseJson(res)
    const message = readableDetail(data)

    if (res.status === 401) return { kind: "unauthorized" }
    if (res.ok) {
      const adminId = pickAdminId(data)
      if (adminId) return { kind: "ok", adminId, email }
      return { kind: "error", message: "サーバーからスタッフIDを取得できませんでした" }
    }
    if (res.status === 409) {
      return {
        kind: "duplicate",
        message: message || "このメールアドレスは既に登録されています",
      }
    }
    if (res.status === 400 || res.status === 422) {
      return { kind: "validation", message: message || "入力内容に誤りがあります" }
    }
    return { kind: "error", message: message || "スタッフ招待メールの送信に失敗しました" }
  } catch {
    return { kind: "error", message: "通信に失敗しました" }
  }
}
