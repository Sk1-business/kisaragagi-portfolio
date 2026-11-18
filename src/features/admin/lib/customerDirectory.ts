import type { Reservation } from "@/features/admin/types/reservation"
import { NO_SHOW_BLOCK_THRESHOLD, phoneDigits } from "@/features/admin/lib/noShowBlock"
import { DEMO_SALON_SESSION_KEY, DEMO_SALON_SLUG } from "@/demo/demoAccounts"

const LEGACY_STORAGE_KEY = "admin-customer-profiles-v1"

function currentSalonSlug(): string {
  try {
    return sessionStorage.getItem(DEMO_SALON_SESSION_KEY)?.trim().toLowerCase() || DEMO_SALON_SLUG
  } catch {
    return DEMO_SALON_SLUG
  }
}

function profileStorageKey(): string {
  return `admin-customer-profiles-v1:${currentSalonSlug()}`
}

export type CustomerGender = "" | "female" | "male" | "unspecified"
export type CustomerKind = "" | "new" | "existing"

export type CustomerChart = {
  hairRequest: string
  allergy: string
  notes: string
  texture: string
  preference: string
  photoName: string
  photoData: string
  updatedAt: string
}

export type CustomerProfile = {
  key: string
  name: string
  furigana: string
  email: string
  phone: string
  birthday: string
  gender: CustomerGender
  kind: CustomerKind
  chart: CustomerChart
}

export type CustomerRecord = CustomerProfile & {
  noShowCount: number
  blocked: boolean
  visitCount: number
  lastVisitAt: string | null
  reservations: Reservation[]
  recommendedMenu: string | null
}

const EMPTY_CHART: CustomerChart = {
  hairRequest: "",
  allergy: "",
  notes: "",
  texture: "",
  preference: "",
  photoName: "",
  photoData: "",
  updatedAt: "",
}

export function normalizeChart(chart: Partial<CustomerChart> | undefined): CustomerChart {
  return {
    hairRequest: chart?.hairRequest ?? "",
    allergy: chart?.allergy ?? "",
    notes: chart?.notes ?? "",
    texture: chart?.texture ?? "",
    preference: chart?.preference ?? "",
    photoName: chart?.photoName ?? "",
    photoData: chart?.photoData ?? "",
    updatedAt: chart?.updatedAt ?? "",
  }
}

function emptyProfile(key: string): CustomerProfile {
  return {
    key,
    name: "",
    furigana: "",
    email: "",
    phone: "",
    birthday: "",
    gender: "",
    kind: "",
    chart: { ...EMPTY_CHART },
  }
}

export function ensureShowcaseCharts(): void {
  if (currentSalonSlug() !== DEMO_SALON_SLUG) return
  const seedKey = `kisaragi-chart-seed:v1:${currentSalonSlug()}`
  if (localStorage.getItem(seedKey) === "1") return
  const samples: CustomerProfile[] = [
    {
      key: customerKey("09011112222", "guest@kisaragi.example"),
      name: "来店 花子",
      furigana: "ライテン ハナコ",
      email: "guest@kisaragi.example",
      phone: "09011112222",
      birthday: "1994-04-12",
      gender: "female",
      kind: "existing",
      chart: {
        ...EMPTY_CHART,
        texture: "普通毛、やや細め",
        hairRequest: "鎖骨の少し下。顔まわりは軽く",
        preference: "ナチュラル。真っ黒にはしない",
        allergy: "なし",
        notes: "前回は耳の下で切っている。次は2cm残す。",
        updatedAt: new Date().toISOString(),
      },
    },
    {
      key: customerKey("09022223333", "sato@example.com"),
      name: "佐藤 美月",
      furigana: "サトウ ミヅキ",
      email: "sato@example.com",
      phone: "09022223333",
      birthday: "1998-09-03",
      gender: "female",
      kind: "existing",
      chart: {
        ...EMPTY_CHART,
        texture: "直毛、太め",
        hairRequest: "透明感のあるベージュ",
        preference: "明るさは今のトーンを維持",
        allergy: "ジアミンでかぶれたことがある",
        notes: "カラーはノンジアミンで。頭皮が敏感。",
        updatedAt: new Date().toISOString(),
      },
    },
    {
      key: customerKey("09033334444", "takahashi@example.com"),
      name: "高橋 直人",
      furigana: "タカハシ ナオト",
      email: "takahashi@example.com",
      phone: "09033334444",
      birthday: "1989-01-20",
      gender: "male",
      kind: "existing",
      chart: {
        ...EMPTY_CHART,
        texture: "くせ毛、広がりやすい",
        hairRequest: "ビジネスでも使える短め",
        preference: "ワックス少なめでもまとまる形",
        allergy: "なし",
        notes: "サイドは短く、トップは立ち上がりを残す。",
        updatedAt: new Date().toISOString(),
      },
    },
  ]
  importCustomerProfiles(samples)
  localStorage.setItem(`kisaragi-chart-seed:v1:${currentSalonSlug()}`, "1")
}

export function parseKarteText(text: string): Partial<CustomerProfile> | null {
  const value = (labels: string[]) => {
    const match = text.match(new RegExp(`(?:${labels.join("|")})\\s*[:：]?\\s*([^\\n]+)`))
    return match?.[1]?.trim() ?? ""
  }
  const name = value(["氏名", "お名前", "名前"])
  const phone = value(["電話番号", "電話"]).replace(/[^\d]/g, "")
  const email = value(["メールアドレス", "メール"])
  if (!name && !phone && !email) return null
  const key = customerKey(phone, email) || (name ? `n:${name}` : "")
  return {
    key,
    name,
    furigana: value(["フリガナ", "ふりがな"]),
    phone,
    email,
    birthday: "",
    gender: "",
    kind: "existing",
    chart: {
      ...EMPTY_CHART,
      texture: value(["髪質"]),
      hairRequest: value(["希望", "髪型", "仕上がり"]),
      preference: value(["好み"]),
      allergy: value(["アレルギー", "禁忌"]),
      notes: value(["メモ", "施術メモ"]),
      updatedAt: new Date().toISOString(),
    },
  }
}

function readProfiles(): CustomerProfile[] {
  try {
    const key = profileStorageKey()
    let raw = localStorage.getItem(key)
    if (!raw && currentSalonSlug() === DEMO_SALON_SLUG) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (legacy) {
        localStorage.setItem(key, legacy)
        raw = legacy
      }
    }
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is CustomerProfile => {
      return Boolean(item) && typeof item === "object" && typeof (item as CustomerProfile).key === "string"
    })
  } catch {
    return []
  }
}

function writeProfiles(profiles: CustomerProfile[]) {
  localStorage.setItem(profileStorageKey(), JSON.stringify(profiles))
}

export function customerKey(phone: string, email: string): string {
  const digits = phoneDigits(phone)
  if (digits.length >= 10) return `p:${digits}`
  const mail = email.trim().toLowerCase()
  if (mail) return `e:${mail}`
  return ""
}

export function ageFromBirthday(birthday: string, today = new Date()): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return null
  const [year, month, day] = birthday.split("-").map(Number)
  let age = today.getFullYear() - year
  const todayKey = (today.getMonth() + 1) * 100 + today.getDate()
  if (todayKey < month * 100 + day) age -= 1
  if (age < 0 || age > 120) return null
  return age
}

export function saveCustomerProfile(profile: CustomerProfile) {
  const profiles = readProfiles().filter((item) => item.key !== profile.key)
  profiles.push(profile)
  writeProfiles(profiles)
}

export function importCustomerProfiles(rows: CustomerProfile[]): number {
  const profiles = readProfiles()
  const byKey = new Map(profiles.map((profile) => [profile.key, profile]))
  let imported = 0
  for (const row of rows) {
    if (!row.key) continue
    const current = byKey.get(row.key) ?? emptyProfile(row.key)
    byKey.set(row.key, {
      ...current,
      ...row,
      chart: current.chart?.updatedAt ? normalizeChart(current.chart) : normalizeChart(row.chart),
    })
    imported += 1
  }
  writeProfiles([...byKey.values()])
  return imported
}

function recommendedMenu(reservations: Reservation[]): string | null {
  const counts = new Map<string, number>()
  for (const reservation of reservations) {
    if (reservation.status === "CANCELLED") continue
    const name = reservation.menuName?.trim()
    if (!name) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  let best: string | null = null
  let bestCount = 0
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name
      bestCount = count
    }
  }
  return bestCount >= 2 ? best : null
}

export function buildCustomerDirectory(reservations: Reservation[]): CustomerRecord[] {
  const profiles = readProfiles()
  const buckets = new Map<string, { profile: CustomerProfile; reservations: Reservation[] }>()

  for (const profile of profiles) {
    buckets.set(profile.key, { profile, reservations: [] })
  }

  for (const reservation of reservations) {
    const key = customerKey(reservation.customerPhone ?? "", reservation.customerEmail ?? "")
    if (!key) continue
    const bucket = buckets.get(key) ?? {
      profile: {
        ...emptyProfile(key),
        name: reservation.customerName,
        email: reservation.customerEmail ?? "",
        phone: reservation.customerPhone ?? "",
        kind: "existing",
      },
      reservations: [],
    }
    if (!bucket.profile.name) bucket.profile.name = reservation.customerName
    if (!bucket.profile.email) bucket.profile.email = reservation.customerEmail ?? ""
    if (!bucket.profile.phone) bucket.profile.phone = reservation.customerPhone ?? ""
    if (!bucket.profile.kind) bucket.profile.kind = "existing"
    bucket.reservations.push(reservation)
    buckets.set(key, bucket)
  }

  return [...buckets.values()]
    .map((bucket) => {
      const history = [...bucket.reservations].sort((a, b) => b.startAt.localeCompare(a.startAt))
      const noShowCount = history.filter((reservation) => reservation.status === "NO_SHOW").length
      const visits = history.filter((reservation) => reservation.status !== "CANCELLED")
      return {
        ...bucket.profile,
        chart: normalizeChart(bucket.profile.chart),
        noShowCount,
        blocked: noShowCount >= NO_SHOW_BLOCK_THRESHOLD,
        visitCount: visits.length,
        lastVisitAt: visits[0]?.startAt ?? null,
        reservations: history,
        recommendedMenu: recommendedMenu(history),
      }
    })
    .sort((a, b) => (b.lastVisitAt ?? "").localeCompare(a.lastVisitAt ?? "") || a.name.localeCompare(b.name, "ja"))
}

export function parseGender(value: string): CustomerGender {
  const text = value.trim().toLowerCase()
  if (text === "female" || text === "女性" || text === "女") return "female"
  if (text === "male" || text === "男性" || text === "男") return "male"
  if (text === "unspecified" || text === "未指定" || text === "その他") return "unspecified"
  return ""
}

export function genderLabel(gender: CustomerGender): string {
  if (gender === "female") return "女性"
  if (gender === "male") return "男性"
  if (gender === "unspecified") return "未指定"
  return "未登録"
}

export function kindLabel(kind: CustomerKind): string {
  if (kind === "new") return "新規"
  if (kind === "existing") return "既存"
  return "未登録"
}
