import { useEffect, useState } from "react"

import { fetchUserDashboardSummary } from "@/features/user/api/userDashboardApi"
import type { UserDashboardSummary } from "@/features/user/types/userDashboard"

export function useUserDashboardSummary() {
  const [summary, setSummary] = useState<UserDashboardSummary | null>(null)

  useEffect(() => {
    let mounted = true

    void fetchUserDashboardSummary().then((data) => {
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
