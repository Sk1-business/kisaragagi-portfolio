import { useEffect, useState } from "react"

import { fetchUserTrainers, type UserTrainer } from "@/features/user/api/userTrainerApi"

export function useUserTrainers(shopSlug?: string) {
  const [trainers, setTrainers] = useState<UserTrainer[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetchUserTrainers(shopSlug)
      .then((data) => {
        if (!mounted) return
        setTrainers(data)
      })
      .catch(() => {
        if (!mounted) return
        setTrainers([])
      })
      .finally(() => {
        if (!mounted) return
        setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [shopSlug])

  return { trainers, isLoading }
}
