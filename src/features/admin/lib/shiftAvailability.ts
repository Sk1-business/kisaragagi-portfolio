import type { Staff } from "@/features/admin/types/staff"

/** 表示用の開始・終了時刻（HH:mm） */
export interface AvailabilitySlot {
  start: string
  end: string
}

/**
 * その日の担当可能時間を返す。休みの日は null。
 * デモ用に曜日・担当者ごとにパターンを分けている。API 連携時はここを差し替える。
 */
export function getStaffAvailabilityForDay(
  staff: Staff,
  day: Date,
): AvailabilitySlot | null {
  const wd = day.getDay()
  if (wd === 0) return null

  if (wd === 6) {
    return { start: "10:00", end: "17:00" }
  }

  if (staff.id === "st_001") {
    return { start: "09:00", end: "18:00" }
  }
  if (staff.id === "st_002") {
    return { start: "10:00", end: "19:00" }
  }
  if (staff.id === "st_003") {
    return { start: "11:00", end: "20:00" }
  }

  return { start: "10:00", end: "19:00" }
}
