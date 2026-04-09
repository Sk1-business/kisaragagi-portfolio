import { ADMIN_MENUS_LIST_PATH } from "@/constants/adminApi"
import { apiFetch } from "@/lib/api"

export interface AdminMenu {
  menu_id: string
  name: string
  /** 分。API の `duration_minutes` 等から取得 */
  duration_minutes?: number
}

function parseDurationMinutes(r: Record<string, unknown>): number | undefined {
  const raw =
    r.duration_minutes ??
    r.durationMinutes ??
    r.service_duration_minutes ??
    r.serviceDurationMinutes ??
    r.duration_min ??
    r.duration
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) {
    return Math.round(raw)
  }
  if (typeof raw === "string" && /^\d+$/.test(raw.trim())) {
    const n = Number(raw.trim())
    if (n > 0) return n
  }
  return undefined
}

function mapRow(o: unknown): AdminMenu | null {
  if (!o || typeof o !== "object") return null
  const r = o as Record<string, unknown>
  const id = String(r.menu_id ?? r.id ?? "").trim()
  const name = String(r.name ?? r.menu_name ?? "").trim()
  if (!id || !name) return null
  const duration_minutes = parseDurationMinutes(r)
  return duration_minutes !== undefined
    ? { menu_id: id, name, duration_minutes }
    : { menu_id: id, name }
}

/**
 * `GET /api/admin/menus`（要ログイン Cookie）
 * レスポンスは配列、または `{ items: [...] }` を想定。
 */
export async function fetchAdminMenus(): Promise<AdminMenu[]> {
  const res = await apiFetch(ADMIN_MENUS_LIST_PATH, { method: "GET" })
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED")
  }
  if (!res.ok) {
    throw new Error("FETCH_FAILED")
  }
  const data = (await res.json()) as unknown
  const rows: unknown[] = Array.isArray(data)
    ? data
    : data &&
        typeof data === "object" &&
        Array.isArray((data as { items?: unknown[] }).items)
      ? (data as { items: unknown[] }).items
      : []
  const out: AdminMenu[] = []
  for (const row of rows) {
    const m = mapRow(row)
    if (m) out.push(m)
  }
  return out
}
