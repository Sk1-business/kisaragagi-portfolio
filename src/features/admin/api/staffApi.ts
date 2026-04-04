import type { Reservation } from "@/features/admin/types/reservation"
import type { Staff } from "@/features/admin/types/staff"

export const DEFAULT_STAFF: Staff[] = [
  { id: "st_001", name: "担当者A", color: "#3b82f6" },
  { id: "st_002", name: "担当者B", color: "#22c55e" },
  { id: "st_003", name: "担当者C", color: "#f59e0b" },
]

export function cloneDefaultStaff(): Staff[] {
  return DEFAULT_STAFF.map((s) => ({ ...s }))
}

/** 名前が既存スタッフと重複するか（前後空白除き・新規・編集の重複判定） */
export function isStaffNameTaken(
  staffList: Staff[],
  name: string,
  excludeStaffId?: string,
): boolean {
  const n = name.trim()
  if (!n) return false
  return staffList.some(
    (s) => s.id !== excludeStaffId && s.name.trim() === n,
  )
}

export async function fetchStaffList(): Promise<Staff[]> {
  await new Promise((r) => setTimeout(r, 100))
  return cloneDefaultStaff()
}

export function getStaffById(id: string, list: Staff[]): Staff | undefined {
  return list.find((s) => s.id === id)
}

/**
 * 予約の担当表示名。アクティブなスタッフ一覧にいればその名前、
 * 無効化などで一覧にいない場合は API の `trainer_name`（`Reservation.trainerName`）を使う。
 */
export function getReservationAssigneeDisplayName(
  r: Reservation,
  staffList: Staff[],
): string {
  const staff = getStaffById(r.assigneeId, staffList)
  if (staff) return staff.name
  const tn = r.trainerName?.trim()
  if (tn) return tn
  return r.assigneeId
}
