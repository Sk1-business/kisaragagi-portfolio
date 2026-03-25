import { useEffect, useState } from "react"

import { fetchSalonPage } from "@/features/user/api/userSalonApi"

export function useSalonName(shopId?: string) {
  const [salonName, setSalonName] = useState("店舗")

  useEffect(() => {
    if (!shopId) {
      setSalonName("店舗")
      return
    }

    let mounted = true
    void fetchSalonPage(shopId)
      .then((page) => {
        if (!mounted) return
        setSalonName(page.salon_name || "店舗")
      })
      .catch(() => {
        if (!mounted) return
        setSalonName("店舗")
      })

    return () => {
      mounted = false
    }
  }, [shopId])

  return salonName
}
