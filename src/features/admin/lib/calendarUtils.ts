import type { Reservation } from "@/features/admin/types/reservation"

const JST_OFFSET_MS = 9 * 60 * 60 * 1000

export function toLocalDate(iso: string): Date {
  const d = new Date(iso)
  return new Date(d.getTime() + d.getTimezoneOffset() * 60 * 1000 + JST_OFFSET_MS)
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7)
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}

export function startOfWeek(d: Date): Date {
  const x = new Date(d)
  const day = x.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return startOfDay(addDays(x, diff))
}

export function startOfMonth(d: Date): Date {
  const x = new Date(d)
  x.setDate(1)
  return startOfDay(x)
}

export function endOfMonth(d: Date): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + 1)
  x.setDate(0)
  return endOfDay(x)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isInRange(date: Date, start: Date, end: Date): boolean {
  const t = date.getTime()
  return t >= start.getTime() && t <= end.getTime()
}

/** 日付を YYYY-MM-DD 形式にする（ローカル日付） */
export function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** 指定タイムゾーンにおける暦日の YYYY-MM-DD（例: 日本時間の「今日」） */
export function getDateKeyInTimeZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d)
}

/** ISO 日時を指定タイムゾーンの暦日キーに変換 */
export function getIsoDateKeyInTimeZone(iso: string, timeZone: string): string {
  return getDateKeyInTimeZone(new Date(iso), timeZone)
}

/** 予約の startAt から日付部分 YYYY-MM-DD を取得（ISO の日付をそのまま使用） */
function getReservationDateKey(startAt: string): string {
  return startAt.slice(0, 10)
}

export function getReservationsForDay(reservations: Reservation[], day: Date): Reservation[] {
  const dayKey = toDateKey(day)
  return reservations.filter((r) => {
    if (r.status === "CANCELLED") return false
    return getReservationDateKey(r.startAt) === dayKey
  })
}

export function getReservationsInRange(
  reservations: Reservation[],
  rangeStart: Date,
  rangeEnd: Date,
): Reservation[] {
  const startKey = toDateKey(rangeStart)
  const endKey = toDateKey(rangeEnd)
  return reservations.filter((r) => {
    if (r.status === "CANCELLED") return false
    const key = getReservationDateKey(r.startAt)
    return key >= startKey && key <= endKey
  })
}

export function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false })
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)}-${formatTime(endIso)}`
}

export function formatDateJa(d: Date): string {
  return d.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

/** 日本語の日付表示（指定タイムゾーンの暦日。ダッシュボードの「本日」表記用） */
export function formatDateJaInTimeZone(d: Date, timeZone: string): string {
  return d.toLocaleDateString("ja-JP", {
    timeZone,
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

export const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]
