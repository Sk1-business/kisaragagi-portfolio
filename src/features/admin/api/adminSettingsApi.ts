import { ADMIN_SETTINGS_PATH } from "@/constants/adminApi"
import { apiFetch } from "@/lib/api"

/** `GET /api/admin/settings` の `business_hours` の1行（`day_of_week`: 0=月…6=日） */
export type BusinessHoursItem = {
  day_of_week: number
  start_time: string
  end_time: string
  is_closed: boolean
}

export type AdminSettingsOut = {
  business_hours: BusinessHoursItem[]
}

/**
 * `GET /api/admin/settings` — `business_hours`（`business_hours` テーブル）を含む。
 */
export async function fetchAdminSettings(): Promise<AdminSettingsOut> {
  const res = await apiFetch(ADMIN_SETTINGS_PATH, { method: "GET" })
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED")
  }
  if (!res.ok) {
    throw new Error("FETCH_FAILED")
  }
  const data = (await res.json()) as unknown
  if (!data || typeof data !== "object") {
    return { business_hours: [] }
  }
  const o = data as Record<string, unknown>
  const raw = o.business_hours ?? o.businessHours
  if (!Array.isArray(raw)) {
    return { business_hours: [] }
  }
  const business_hours: BusinessHoursItem[] = []
  for (const row of raw) {
    if (!row || typeof row !== "object") continue
    const r = row as Record<string, unknown>
    const dow = r.day_of_week ?? r.dayOfWeek
    const st = r.start_time ?? r.startTime
    const et = r.end_time ?? r.endTime
    const closed = r.is_closed ?? r.isClosed
    if (typeof dow !== "number" || typeof st !== "string" || typeof et !== "string") continue
    business_hours.push({
      day_of_week: dow,
      start_time: String(st).slice(0, 5),
      end_time: String(et).slice(0, 5),
      is_closed: Boolean(closed),
    })
  }
  return { business_hours }
}
