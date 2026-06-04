import type { AdminMeProfile } from "@/features/auth/api/adminSessionApi"
import type { Staff } from "@/features/admin/types/staff"

/**
 * シフト編集可否。owner は全員、staff は自分のシフトのみ。
 */
export function isShiftEditableForStaff(profile: AdminMeProfile, staff: Staff): boolean {
  if (profile.role === "owner") return true
  if (profile.adminId && staff.adminId && staff.adminId === profile.adminId) {
    return true
  }
  if (profile.role === "staff") {
    const pn = profile.name.trim()
    const sn = staff.name.trim()
    if (pn && sn && pn === sn) return true
  }
  return false
}

export function filterEditableStaff(
  staffList: Staff[],
  profile: AdminMeProfile,
): Staff[] {
  return staffList.filter((s) => isShiftEditableForStaff(profile, s))
}
