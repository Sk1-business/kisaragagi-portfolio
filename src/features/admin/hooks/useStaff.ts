import { useEffect, useState } from "react"
import { fetchStaffList } from "@/features/admin/api/staffApi"
import type { Staff } from "@/features/admin/types/staff"

export function useStaff() {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchStaffList()
      .then((data) => {
        if (!cancelled) setStaffList(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { staffList, loading }
}

export function getAssigneeColor(assigneeId: string, staffList: Staff[]): string {
  const staff = staffList.find((s) => s.id === assigneeId)
  return staff?.color ?? "#94a3b8"
}
