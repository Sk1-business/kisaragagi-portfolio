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

/** `PUT /api/admin/settings/business-hours` のリクエストアイテム。 */
export type BusinessHoursUpdateItem = BusinessHoursItem

export type BusinessHoursUpdateResult =
  | { kind: "ok" }
  | { kind: "unauthorized" }
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

/**
 * `PUT /api/admin/settings/business-hours` — 曜日ごとの営業時間を一括 upsert。
 * バックエンド: `app/api/admin/settings.py::update_business_hours`
 *
 * 仕様メモ:
 * - `hours` は7曜日（月〜日）分すべてを送るのが想定
 * - 既存があれば UPDATE、無ければ INSERT
 */
export async function putBusinessHours(
  hours: BusinessHoursUpdateItem[],
): Promise<BusinessHoursUpdateResult> {
  try {
    const res = await apiFetch(`${ADMIN_SETTINGS_PATH}/business-hours`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours }),
    })
    if (res.ok) return { kind: "ok" }
    if (res.status === 401) return { kind: "unauthorized" }
    let detailString: string | undefined
    try {
      const data = (await res.clone().json()) as { detail?: unknown } | null
      detailString = readableDetail(data?.detail)
    } catch {
      // non-JSON body
    }
    return { kind: "error", status: res.status, message: detailString }
  } catch {
    return { kind: "error" }
  }
}

export type HolidayCreateInput = {
  /** YYYY-MM-DD */
  date: string
  description?: string | null
}

export type HolidayCreated = {
  id: string
  date: string
  description: string | null
}

export type HolidayCreateResult =
  | { kind: "ok"; holiday: HolidayCreated }
  | { kind: "unauthorized" }
  | { kind: "error"; status?: number; message?: string }

/**
 * `POST /api/admin/settings/holidays` — 個別の休業日を1件作成。
 * バックエンド: `app/api/admin/settings.py::create_holiday`
 */
export async function postHoliday(
  input: HolidayCreateInput,
): Promise<HolidayCreateResult> {
  try {
    const res = await apiFetch(`${ADMIN_SETTINGS_PATH}/holidays`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: input.date,
        description: input.description?.trim() ? input.description.trim() : null,
      }),
    })
    let detailString: string | undefined
    try {
      const data = (await res.clone().json()) as
        | { detail?: unknown; id?: unknown; date?: unknown; description?: unknown }
        | null
      detailString = readableDetail(data?.detail)
      if (res.ok && data) {
        const id = typeof data.id === "string" ? data.id : ""
        const date = typeof data.date === "string" ? data.date.slice(0, 10) : input.date
        const description =
          typeof data.description === "string" ? data.description : null
        return { kind: "ok", holiday: { id, date, description } }
      }
    } catch {
      // non-JSON body
    }
    if (res.status === 401) return { kind: "unauthorized" }
    return { kind: "error", status: res.status, message: detailString }
  } catch {
    return { kind: "error" }
  }
}
