import { useEffect, useState } from "react"

import { fetchUserDashboardSummary } from "@/features/user/api/userDashboardApi"
import type { UserDashboardSummary } from "@/features/user/types/userDashboard"

export function useUserDashboardSummary(shopId?: string) {
  const [summary, setSummary] = useState<UserDashboardSummary | null>(null)

  useEffect(() => {
    let mounted = true
    setSummary(null)

    void fetchUserDashboardSummary(shopId).then((data) => {
      if (!mounted) {
        return
      }
      setSummary(data)
    })

    return () => {
      mounted = false
    }
  }, [shopId])

  return summary
}
