export type ParsedHotpepperMail = {
  date: string
  start: string
  end: string | null
  durationMinutes: number | null
  menuName: string
  stylistName: string
  customerName: string
  phone: string
}

function field(text: string, labels: string[]): string {
  const pattern = new RegExp(`(?:${labels.join("|")})\\s*[:：]\\s*(.+)`)
  const match = text.match(pattern)
  return match?.[1]?.trim().split(/\s{2,}/)[0]?.trim() ?? ""
}

export function parseHotpepperMail(text: string): ParsedHotpepperMail | null {
  const when = text.match(
    /(?:予約日時|来店日時|日時)\s*[:：]\s*(\d{4})[年/](\d{1,2})[月/](\d{1,2})日?(?:\([^)]*\)|（[^）]*）)?\s*(\d{1,2}):(\d{2})/,
  )
  if (!when) return null
  const date = `${when[1]}-${when[2].padStart(2, "0")}-${when[3].padStart(2, "0")}`
  const start = `${when[4].padStart(2, "0")}:${when[5]}`
  const durationMatch = text.match(/(?:所要時間|施術時間)\s*[:：]\s*(\d+)\s*分/)
  const endMatch = text.match(/(?:終了時刻|終了)\s*[:：]\s*(\d{1,2}):(\d{2})/)
  const customerName = field(text, ["氏名", "お名前", "お客様名"])
  const menuName = field(text, ["メニュー", "施術メニュー"])
  if (!customerName || !menuName) return null
  return {
    date,
    start,
    end: endMatch ? `${endMatch[1].padStart(2, "0")}:${endMatch[2]}` : null,
    durationMinutes: durationMatch ? Number(durationMatch[1]) : null,
    menuName,
    stylistName: field(text, ["担当スタイリスト", "スタイリスト", "担当者"]),
    customerName,
    phone: field(text, ["電話番号", "TEL", "Tel"]).replace(/[^\d]/g, ""),
  }
}
