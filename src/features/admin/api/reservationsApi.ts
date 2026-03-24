import type { Reservation } from "@/features/admin/types/reservation"

/** 日付を YYYY-MM-DD にフォーマット（JST の日付で統一） */
function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/** 今日を基準にした3日分のモック予約を生成（常にカレンダーに表示されるようにする） */
export function buildMockReservations(): Reservation[] {
  const base = new Date()
  const day1 = new Date(base)
  const day2 = new Date(base)
  day2.setDate(day2.getDate() + 1)
  const day3 = new Date(base)
  day3.setDate(day3.getDate() + 2)

  const d1 = formatDateKey(day1)
  const d2 = formatDateKey(day2)
  const d3 = formatDateKey(day3)

  return [
    {
      id: "res_001",
      customerName: "山田 太郎",
      customerEmail: "yamada@example.com",
      startAt: `${d1}T09:00:00+09:00`,
      endAt: `${d1}T10:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_001",
      memo: "初回利用",
      createdAt: base.toISOString(),
    },
    {
      id: "res_002",
      customerName: "佐藤 花子",
      customerEmail: "sato@example.com",
      startAt: `${d1}T11:00:00+09:00`,
      endAt: `${d1}T12:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_002",
      createdAt: base.toISOString(),
    },
    {
      id: "res_003",
      customerName: "鈴木 一郎",
      customerEmail: "suzuki@example.com",
      startAt: `${d1}T14:00:00+09:00`,
      endAt: `${d1}T15:30:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_001",
      memo: "90分希望",
      createdAt: base.toISOString(),
    },
    {
      id: "res_004",
      customerName: "田中 美咲",
      customerEmail: "tanaka@example.com",
      startAt: `${d2}T10:00:00+09:00`,
      endAt: `${d2}T11:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      createdAt: base.toISOString(),
    },
    {
      id: "res_005",
      customerName: "高橋 健太",
      customerEmail: "takahashi@example.com",
      startAt: `${d2}T13:00:00+09:00`,
      endAt: `${d2}T14:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_002",
      createdAt: base.toISOString(),
    },
    {
      id: "res_006",
      customerName: "伊藤 恵子",
      customerEmail: "ito@example.com",
      startAt: `${d2}T15:30:00+09:00`,
      endAt: `${d2}T16:30:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_001",
      memo: "キャンセル待ちから繰り上げ",
      createdAt: base.toISOString(),
    },
    {
      id: "res_007",
      customerName: "渡辺 大輔",
      customerEmail: "watanabe@example.com",
      startAt: `${d3}T09:00:00+09:00`,
      endAt: `${d3}T10:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      createdAt: base.toISOString(),
    },
    {
      id: "res_008",
      customerName: "中村 優子",
      customerEmail: "nakamura@example.com",
      startAt: `${d3}T11:00:00+09:00`,
      endAt: `${d3}T12:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_002",
      memo: "午前中希望",
      createdAt: base.toISOString(),
    },
    {
      id: "res_009",
      customerName: "小林 翔太",
      customerEmail: "kobayashi@example.com",
      startAt: `${d3}T14:00:00+09:00`,
      endAt: `${d3}T15:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      createdAt: base.toISOString(),
    },
    // 同日 10:00-11:00 に3担当が重複
    {
      id: "res_010",
      customerName: "松本 直樹",
      customerEmail: "matsumoto@example.com",
      startAt: `${d1}T10:00:00+09:00`,
      endAt: `${d1}T11:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_001",
      createdAt: base.toISOString(),
    },
    {
      id: "res_011",
      customerName: "井上 さくら",
      customerEmail: "inoue@example.com",
      startAt: `${d1}T10:00:00+09:00`,
      endAt: `${d1}T11:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_002",
      memo: "ペア予約",
      createdAt: base.toISOString(),
    },
    {
      id: "res_012",
      customerName: "木村 拓也",
      customerEmail: "kimura@example.com",
      startAt: `${d1}T10:00:00+09:00`,
      endAt: `${d1}T11:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      createdAt: base.toISOString(),
    },
    // 同日 13:00-14:00 に2担当が重複
    {
      id: "res_013",
      customerName: "林 美香",
      customerEmail: "hayashi@example.com",
      startAt: `${d1}T13:00:00+09:00`,
      endAt: `${d1}T14:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_001",
      createdAt: base.toISOString(),
    },
    {
      id: "res_014",
      customerName: "斎藤 誠",
      customerEmail: "saito@example.com",
      startAt: `${d1}T13:00:00+09:00`,
      endAt: `${d1}T14:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_002",
      createdAt: base.toISOString(),
    },
    {
      id: "res_015",
      customerName: "岡田 由美",
      customerEmail: "okada@example.com",
      startAt: `${d1}T16:00:00+09:00`,
      endAt: `${d1}T17:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      createdAt: base.toISOString(),
    },
    // 2日目 9:00-10:00 に2担当が重複
    {
      id: "res_016",
      customerName: "後藤 健一",
      customerEmail: "goto@example.com",
      startAt: `${d2}T09:00:00+09:00`,
      endAt: `${d2}T10:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_002",
      createdAt: base.toISOString(),
    },
    {
      id: "res_017",
      customerName: "長谷川 彩",
      customerEmail: "hasegawa@example.com",
      startAt: `${d2}T09:00:00+09:00`,
      endAt: `${d2}T10:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      memo: "午前希望",
      createdAt: base.toISOString(),
    },
    // 2日目 11:00-12:00 に3担当が重複
    {
      id: "res_018",
      customerName: "村上 大輔",
      customerEmail: "murakami@example.com",
      startAt: `${d2}T11:00:00+09:00`,
      endAt: `${d2}T12:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_001",
      createdAt: base.toISOString(),
    },
    {
      id: "res_019",
      customerName: "石井 花子",
      customerEmail: "ishii@example.com",
      startAt: `${d2}T11:00:00+09:00`,
      endAt: `${d2}T12:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_002",
      createdAt: base.toISOString(),
    },
    {
      id: "res_020",
      customerName: "清水 涼太",
      customerEmail: "shimizu@example.com",
      startAt: `${d2}T11:00:00+09:00`,
      endAt: `${d2}T12:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      createdAt: base.toISOString(),
    },
    {
      id: "res_021",
      customerName: "森田 優",
      customerEmail: "morita@example.com",
      startAt: `${d2}T14:00:00+09:00`,
      endAt: `${d2}T15:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_001",
      createdAt: base.toISOString(),
    },
    {
      id: "res_022",
      customerName: "阿部 真一",
      customerEmail: "abe@example.com",
      startAt: `${d2}T14:00:00+09:00`,
      endAt: `${d2}T15:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      createdAt: base.toISOString(),
    },
    // 3日目 10:00-11:00 に2担当が重複
    {
      id: "res_023",
      customerName: "山本 恵子",
      customerEmail: "yamamoto@example.com",
      startAt: `${d3}T10:00:00+09:00`,
      endAt: `${d3}T11:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_001",
      createdAt: base.toISOString(),
    },
    {
      id: "res_024",
      customerName: "吉田 翔",
      customerEmail: "yoshida@example.com",
      startAt: `${d3}T10:00:00+09:00`,
      endAt: `${d3}T11:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      createdAt: base.toISOString(),
    },
    // 3日目 13:00-14:00 に3担当が重複
    {
      id: "res_025",
      customerName: "福田 美咲",
      customerEmail: "fukuda@example.com",
      startAt: `${d3}T13:00:00+09:00`,
      endAt: `${d3}T14:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_001",
      createdAt: base.toISOString(),
    },
    {
      id: "res_026",
      customerName: "西村 剛",
      customerEmail: "nishimura@example.com",
      startAt: `${d3}T13:00:00+09:00`,
      endAt: `${d3}T14:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_002",
      memo: "初回",
      createdAt: base.toISOString(),
    },
    {
      id: "res_027",
      customerName: "青木 千尋",
      customerEmail: "aoki@example.com",
      startAt: `${d3}T13:00:00+09:00`,
      endAt: `${d3}T14:00:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      createdAt: base.toISOString(),
    },
    {
      id: "res_028",
      customerName: "藤田 陽子",
      customerEmail: "fujita@example.com",
      startAt: `${d3}T15:30:00+09:00`,
      endAt: `${d3}T16:30:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_002",
      createdAt: base.toISOString(),
    },
    {
      id: "res_029",
      customerName: "松浦 竜也",
      customerEmail: "matsuura@example.com",
      startAt: `${d3}T15:30:00+09:00`,
      endAt: `${d3}T16:30:00+09:00`,
      status: "CONFIRMED",
      assigneeId: "st_003",
      createdAt: base.toISOString(),
    },
  ]
}

export async function fetchAllReservations(): Promise<Reservation[]> {
  await new Promise((r) => setTimeout(r, 300))
  return buildMockReservations()
}

export async function fetchReservationById(id: string): Promise<Reservation | null> {
  const all = buildMockReservations()
  const found = all.find((r) => r.id === id)
  return found ?? null
}
