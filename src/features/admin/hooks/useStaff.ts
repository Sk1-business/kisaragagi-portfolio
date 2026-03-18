import { useAdminStaff } from "@/features/admin/context/AdminStaffContext"
import type { Staff } from "@/features/admin/types/staff"

export function useStaff() {
  return useAdminStaff()
}

export function getAssigneeColor(assigneeId: string, staffList: Staff[]): string {
  const staff = staffList.find((s) => s.id === assigneeId)
  return staff?.color ?? "#94a3b8"
}
