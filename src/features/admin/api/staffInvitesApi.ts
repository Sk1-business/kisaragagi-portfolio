import { apiFetch } from "@/lib/api"
import { parseAdminApiErrorDetail } from "@/features/admin/api/reservationsApi"

export interface AdminStaffInviteOut {
  invite_id: string
  email: string
  role: string
  token: string
  signup_url: string
  expires_at: string
  used_at?: string | null
}

export async function postAdminStaffInvite(email: string): Promise<AdminStaffInviteOut> {
  const res = await apiFetch("/api/admin/staff-invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  })
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED")
  }
  if (!res.ok) {
    const detail = await parseAdminApiErrorDetail(res)
    throw new Error(detail ?? "スタッフ招待の作成に失敗しました。")
  }
  return (await res.json()) as AdminStaffInviteOut
}
