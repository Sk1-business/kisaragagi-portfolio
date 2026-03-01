import { useEffect, useState } from "react"

import { fetchAdminDashboardSummary } from "@/features/admin/api/adminDashboardApi"
import type { AdminDashboardSummary } from "@/features/admin/types/adminDashboard"

export function useAdminDashboardSummary() {
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)

  useEffect(() => {
    let mounted = true

    void fetchAdminDashboardSummary().then((data) => {
      if (!mounted) {
        return
      }
      setSummary(data)
    })

    return () => {
      mounted = false
    }
  }, [])

  return summary
}
