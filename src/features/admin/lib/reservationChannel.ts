export type ReservationChannel = "web" | "phone" | "hotpepper"

export function reservationChannelLabel(source: string | null | undefined): string | null {
  if (source === "hotpepper") return "ホットペッパー"
  if (source === "phone") return "電話"
  if (source === "web") return "自社WEB"
  return null
}

export function parseReservationChannel(raw: string): ReservationChannel {
  const value = raw.trim()
  if (value === "ホットペッパー" || value.toLowerCase() === "hotpepper") return "hotpepper"
  if (value === "電話" || value.toLowerCase() === "phone") return "phone"
  return "web"
}
