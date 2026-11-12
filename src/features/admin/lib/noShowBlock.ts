import type { Reservation } from "@/features/admin/types/reservation"

/** 無断キャンセルがこの回数に達したら、以降の予約を受け付けない */
export const NO_SHOW_BLOCK_THRESHOLD = 3

export function phoneDigits(value: string | null | undefined): string {
  return (value ?? "").replace(/\D/g, "")
}

export function countNoShows(
  reservations: Reservation[],
  phone: string,
  email: string,
): number {
  const phoneKey = phoneDigits(phone)
  const emailKey = email.trim().toLowerCase()
  if (!phoneKey && !emailKey) return 0
  return reservations.filter((reservation) => {
    if (reservation.status !== "NO_SHOW") return false
    const samePhone = phoneKey.length > 0 && phoneDigits(reservation.customerPhone) === phoneKey
    const sameEmail =
      emailKey.length > 0 && (reservation.customerEmail ?? "").trim().toLowerCase() === emailKey
    return samePhone || sameEmail
  }).length
}

export function noShowBlockMessage(count: number): string {
  return `無断キャンセルが${count}回あるため、このお客様の予約は受け付けられません。`
}
