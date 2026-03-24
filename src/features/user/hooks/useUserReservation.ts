import { useEffect, useState } from "react"

import {
  fetchUserReservationById,
  type UserReservation,
} from "@/features/user/api/userReservationApi"

export function useUserReservation(reservationId: string, shopSlug?: string) {
  const [reservation, setReservation] = useState<UserReservation | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(reservationId))

  useEffect(() => {
    if (!reservationId) {
      setReservation(null)
      setIsLoading(false)
      return
    }

    let mounted = true
    setIsLoading(true)
    fetchUserReservationById(reservationId, shopSlug)
      .then((data) => {
        if (!mounted) return
        setReservation(data)
      })
      .catch(() => {
        if (!mounted) return
        setReservation(null)
      })
      .finally(() => {
        if (!mounted) return
        setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [reservationId, shopSlug])

  return { reservation, isLoading }
}
