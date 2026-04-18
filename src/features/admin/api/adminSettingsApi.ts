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
  /** `holidays` テーブルの定休日（YYYY-MM-DD） */
  holidays: string[]
}

function parseHolidayDates(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const out: string[] = []
  for (const x of raw) {
    if (typeof x === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x)) {
      out.push(x)
      continue
    }
    if (x && typeof x === "object") {
      const o = x as Record<string, unknown>
      const d = o.date ?? o.holiday_date ?? o.holidayDate
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) out.push(d)
    }
  }
  return [...new Set(out)]
}

/**
 * `GET /api/admin/settings` — `business_hours`（曜日ごとの営業時間）と `holidays`（定休日 YYYY-MM-DD）を含む。
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
    return { business_hours: [], holidays: [] }
  }
  const o = data as Record<string, unknown>
  const holidays = parseHolidayDates(o.holidays ?? o.holidayDates)
  const raw = o.business_hours ?? o.businessHours
  if (!Array.isArray(raw)) {
    return { business_hours: [], holidays }
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
  return { business_hours, holidays }
}
