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
 * ドロップダウン等の value 用に、予約の担当を `Staff.id` に解決する。
 * `assigneeId` が `tid_${trainer_id}` のときや、`trainerId` と `assigneeId` の表記がずれるときに揃える。
 */
export function resolveReservationStaffIdForUi(
  reservation: Reservation,
  staffList: Staff[],
): string {
  const a = reservation.assigneeId
  if (staffList.some((s) => s.id === a)) return a
  if (reservation.trainerId) {
    const byTid = staffList.find((s) => s.id === reservation.trainerId)
    if (byTid) return byTid.id
  }
  if (a.startsWith("tid_")) {
    const raw = a.slice(4)
    if (staffList.some((s) => s.id === raw)) return raw
  }
  return a
}

/** 予約の担当トレーナーと同一の Staff か（表記ゆれを吸収） */
export function isSameReservationTrainer(
  staffId: string,
  reservation: Reservation,
): boolean {
  if (!staffId) return false
  if (staffId === reservation.assigneeId) return true
  if (reservation.trainerId && staffId === reservation.trainerId) return true
  if (reservation.assigneeId.startsWith("tid_")) {
    const raw = reservation.assigneeId.slice(4)
    if (staffId === raw) return true
  }
  return false
}

/** 担当変更の「変更なし」判定（ドロップダウンで選んだ Staff.id と予約を比較） */
export function reservationStaffMatchesReservation(
  staffId: string,
  reservation: Reservation,
  staffList: Staff[],
): boolean {
  return staffId === resolveReservationStaffIdForUi(reservation, staffList)
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
