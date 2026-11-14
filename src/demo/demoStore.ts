import { DEMO_CUSTOMER, DEMO_OWNER, DEMO_SALON_NAME, DEMO_SALON_SLUG } from "@/demo/demoAccounts"
import { parseReservationChannel, type ReservationChannel } from "@/features/admin/lib/reservationChannel"

const STORAGE_KEY = "kisaragi-salon-demo:v1"
const SALON_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=80"

export type DemoMenu = {
  menu_id: string
  name: string
  duration_minutes: number
  price: number
  description: string | null
  image_url: string | null
  is_public: boolean
  is_archived: boolean
}

export type DemoTrainer = {
  trainer_id: string
  name: string
  color: string
  description: string | null
  image_url: string | null
  display_order: number
  menu_ids: string[]
  is_active: boolean
  admin_id: string | null
}

export type DemoShift = {
  shift_id: string
  trainer_id: string
  date: string
  start_time: string
  end_time: string
}

export type DemoReservation = {
  reservation_id: string
  menu_id: string
  menu_name: string
  start_at: string
  service_end_at: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  notes: string | null
  status: "BOOKED" | "CANCELED" | "DONE" | "NOSHOW"
  trainer_id: string | null
  trainer_name: string | null
  booking_type: "SHIMEI" | "OMAKASE"
  source: ReservationChannel
  payment_method: string | null
  payment_status: string | null
  payment_amount_yen: number | null
  confirmation_token: string
  created_at: string
  customer_id: string | null
  can_cancel: boolean
}

export type DemoCustomer = {
  user_id: string
  email: string
  password: string
  name: string
  phone: string
}

export type DemoAdmin = {
  admin_id: string
  email: string
  password: string
  name: string
  role: "owner" | "staff"
}

export type DemoCoupon = {
  id: string
  title: string
  description: string
  price_yen: number
}

export type DemoBusinessHours = {
  day_of_week: number
  start_time: string
  end_time: string
  is_closed: boolean
}

export type DemoHoliday = {
  id: string
  date: string
  description: string | null
}

export type DemoBookingRules = {
  allow_same_day: boolean
  booking_deadline_minutes: number
  buffer_minutes: number
  slot_increment_minutes: number
  cancellation_deadline_hours: number
  max_advance_days: number
}

export type DemoState = {
  salon: {
    salon_id: string
    salon_name: string
    slug: string
    description: string
    phone: string
    address: string
    booking_page_message: string
    cancellation_policy_text: string
    business_hours_summary: string
    hotpepper_url: string
    instagram_url: string | null
    line_url: string | null
    website_url: string | null
    theme_color: string
    timezone: string
    logo_url: string | null
    cover_image_url: string | null
  }
  coupons: DemoCoupon[]
  business_hours: DemoBusinessHours[]
  holidays: DemoHoliday[]
  booking_rules: DemoBookingRules
  menus: DemoMenu[]
  trainers: DemoTrainer[]
  shifts: DemoShift[]
  reservations: DemoReservation[]
  customers: DemoCustomer[]
  admins: DemoAdmin[]
  lookupTokens: Record<string, { email?: string; phone?: string }>
  otpChallenges: Record<string, { email?: string; phone?: string }>
  signupTokens: Record<string, { email: string; used: boolean }>
  invites: Record<string, { email: string }>
}

export function demoId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function ymd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function shiftDate(offset: number): string {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() + offset)
  return ymd(date)
}

function stamp(date: string, time: string): string {
  return `${date}T${time}:00+09:00`
}

function addMinutes(date: string, time: string, minutes: number): { date: string; time: string } {
  const [hour, minute] = time.split(":").map(Number)
  const total = hour * 60 + minute + minutes
  const dayOffset = Math.floor(total / (24 * 60))
  const mins = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  const base = new Date(`${date}T12:00:00`)
  base.setDate(base.getDate() + dayOffset)
  const hh = String(Math.floor(mins / 60)).padStart(2, "0")
  const mm = String(mins % 60).padStart(2, "0")
  return { date: ymd(base), time: `${hh}:${mm}` }
}

function endStamp(date: string, time: string, minutes: number): string {
  const end = addMinutes(date, time, minutes)
  return stamp(end.date, end.time)
}

function createSeed(): DemoState {
  const menus: DemoMenu[] = [
    {
      menu_id: "menu_cut",
      name: "カット",
      duration_minutes: 60,
      price: 5500,
      description: "似合わせカット。シャンプー・ブロー込み。",
      image_url: SALON_IMAGE,
      is_public: true,
      is_archived: false,
    },
    {
      menu_id: "menu_color",
      name: "カラー",
      duration_minutes: 90,
      price: 8800,
      description: "フルカラー。トーンとダメージに合わせて調合します。",
      image_url: SALON_IMAGE,
      is_public: true,
      is_archived: false,
    },
    {
      menu_id: "menu_perm",
      name: "パーマ",
      duration_minutes: 120,
      price: 9900,
      description: "デジタルパーマまたはコスメパーマ。",
      image_url: null,
      is_public: true,
      is_archived: false,
    },
    {
      menu_id: "menu_treatment",
      name: "トリートメント",
      duration_minutes: 45,
      price: 4400,
      description: "炭酸泉と集中補修。",
      image_url: null,
      is_public: true,
      is_archived: false,
    },
  ]

  const trainers: DemoTrainer[] = [
    {
      trainer_id: "st_aoi",
      name: "青井 凛",
      color: "#7c3aed",
      description: "ショートと似合わせカット",
      image_url: null,
      display_order: 1,
      menu_ids: ["menu_cut", "menu_color"],
      is_active: true,
      admin_id: "admin_owner",
    },
    {
      trainer_id: "st_mio",
      name: "三尾 咲",
      color: "#0f766e",
      description: "透明感カラーと髪質改善",
      image_url: null,
      display_order: 2,
      menu_ids: ["menu_color", "menu_treatment"],
      is_active: true,
      admin_id: "admin_staff",
    },
    {
      trainer_id: "st_ren",
      name: "蓮見 圭",
      color: "#b45309",
      description: "パーマとメンズカット",
      image_url: null,
      display_order: 3,
      menu_ids: ["menu_cut", "menu_perm"],
      is_active: true,
      admin_id: null,
    },
  ]

  const shifts: DemoShift[] = []
  for (let offset = 0; offset < 35; offset += 1) {
    const date = shiftDate(offset)
    const weekday = new Date(`${date}T12:00:00`).getDay()
    if (weekday === 0) continue
    for (const trainer of trainers) {
      shifts.push({
        shift_id: `shift_${trainer.trainer_id}_${date}`,
        trainer_id: trainer.trainer_id,
        date,
        start_time: "10:00",
        end_time: "19:00",
      })
    }
  }

  const today = shiftDate(0)
  const mondayOffset = (() => {
    const weekday = new Date(`${today}T12:00:00`).getDay()
    if (weekday === 0) return 1
    if (weekday === 1) return 0
    return 8 - weekday
  })()
  const upcoming = shiftDate(mondayOffset === 0 ? 1 : mondayOffset)
  const yesterday = shiftDate(-1)

  function reservation(input: {
    id: string
    menu: DemoMenu
    trainer: DemoTrainer
    date: string
    time: string
    customerName: string
    email: string
    phone: string
    source: ReservationChannel
    status: DemoReservation["status"]
    customerId?: string
  }): DemoReservation {
    return {
      reservation_id: input.id,
      menu_id: input.menu.menu_id,
      menu_name: input.menu.name,
      start_at: stamp(input.date, input.time),
      service_end_at: endStamp(input.date, input.time, input.menu.duration_minutes),
      customer_name: input.customerName,
      customer_email: input.email,
      customer_phone: input.phone,
      notes: input.source === "hotpepper" ? "ホットペッパー掲載クーポン利用" : null,
      status: input.status,
      trainer_id: input.trainer.trainer_id,
      trainer_name: input.trainer.name,
      booking_type: "SHIMEI",
      source: input.source,
      payment_method: "onsite",
      payment_status: "pending",
      payment_amount_yen: input.menu.price,
      confirmation_token: `token_${input.id}`,
      created_at: stamp(yesterday, "09:00"),
      customer_id: input.customerId ?? null,
      can_cancel: input.status === "BOOKED",
    }
  }

  const cut = menus[0]
  const color = menus[1]
  const perm = menus[2]
  const treatment = menus[3]

  return {
    salon: {
      salon_id: "salon_kisaragi",
      salon_name: DEMO_SALON_NAME,
      slug: DEMO_SALON_SLUG,
      description: "カット、カラー、パーマ、トリートメントまで。指名もおまかせも、当日払いで予約できます。",
      phone: "03-1234-5678",
      address: "東京都渋谷区神宮前1-2-3",
      booking_page_message: "ご来店の15分前を目安にお越しください。",
      cancellation_policy_text: "開始24時間前までキャンセルできます。当日の無断キャンセルは次回以降ご予約をお受けできない場合があります。",
      business_hours_summary: "月-土 10:00-19:00 / 日 定休",
      hotpepper_url: "https://beauty.hotpepper.jp/",
      instagram_url: null,
      line_url: null,
      website_url: null,
      theme_color: "#7c3aed",
      timezone: "Asia/Tokyo",
      logo_url: null,
      cover_image_url: SALON_IMAGE,
    },
    coupons: [
      {
        id: "coupon_new_cut",
        title: "新規カット 20%OFF",
        description: "ホットペッパー掲載の新規限定クーポン",
        price_yen: 4400,
      },
      {
        id: "coupon_color_set",
        title: "カラー＋トリートメント",
        description: "掲載メニューと同じセット価格",
        price_yen: 11000,
      },
    ],
    business_hours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      day_of_week: day,
      start_time: "10:00",
      end_time: "19:00",
      is_closed: day === 6,
    })),
    holidays: [],
    booking_rules: {
      allow_same_day: true,
      booking_deadline_minutes: 30,
      buffer_minutes: 0,
      slot_increment_minutes: 30,
      cancellation_deadline_hours: 24,
      max_advance_days: 30,
    },
    menus,
    trainers,
    shifts,
    reservations: [
      reservation({
        id: "res_today_hp",
        menu: cut,
        trainer: trainers[0],
        date: today,
        time: "11:00",
        customerName: DEMO_CUSTOMER.name,
        email: DEMO_CUSTOMER.email,
        phone: DEMO_CUSTOMER.phone,
        source: "hotpepper",
        status: "BOOKED",
        customerId: "user_guest",
      }),
      reservation({
        id: "res_today_web",
        menu: color,
        trainer: trainers[1],
        date: today,
        time: "14:00",
        customerName: "佐藤 美月",
        email: "sato@example.com",
        phone: "09022223333",
        source: "web",
        status: "BOOKED",
      }),
      reservation({
        id: "res_today_phone",
        menu: treatment,
        trainer: trainers[2],
        date: today,
        time: "16:00",
        customerName: "高橋 直人",
        email: "takahashi@example.com",
        phone: "09033334444",
        source: "phone",
        status: "BOOKED",
      }),
      reservation({
        id: "res_next_hp",
        menu: perm,
        trainer: trainers[2],
        date: upcoming,
        time: "10:00",
        customerName: "鈴木 彩",
        email: "suzuki@example.com",
        phone: "09044445555",
        source: "hotpepper",
        status: "BOOKED",
      }),
      reservation({
        id: "res_cancelled",
        menu: cut,
        trainer: trainers[0],
        date: yesterday,
        time: "15:00",
        customerName: "山田 葵",
        email: "yamada@example.com",
        phone: "09055556666",
        source: "hotpepper",
        status: "CANCELED",
      }),
    ],
    customers: [
      {
        user_id: "user_guest",
        email: DEMO_CUSTOMER.email,
        password: DEMO_CUSTOMER.password,
        name: DEMO_CUSTOMER.name,
        phone: DEMO_CUSTOMER.phone,
      },
    ],
    admins: [
      {
        admin_id: "admin_owner",
        email: DEMO_OWNER.email,
        password: DEMO_OWNER.password,
        name: DEMO_OWNER.name,
        role: "owner",
      },
      {
        admin_id: "admin_staff",
        email: "staff@kisaragi.example",
        password: DEMO_OWNER.password,
        name: "三尾 咲",
        role: "staff",
      },
    ],
    lookupTokens: {},
    otpChallenges: {},
    signupTokens: {},
    invites: {},
  }
}

export function loadDemoState(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState
      if (parsed?.salon?.slug && Array.isArray(parsed.reservations)) return parsed
    }
  } catch {
    /* reseed */
  }
  const seed = createSeed()
  saveDemoState(seed)
  return seed
}

export function saveDemoState(state: DemoState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function updateDemoState(mutator: (state: DemoState) => void): DemoState {
  const state = loadDemoState()
  mutator(state)
  saveDemoState(state)
  return state
}

export function menuDuration(state: DemoState, menuId: string | undefined): number {
  const menu = state.menus.find((item) => item.menu_id === menuId)
  return menu?.duration_minutes ?? 60
}

export function recomputeEnd(state: DemoState, reservation: DemoReservation): void {
  const date = reservation.start_at.slice(0, 10)
  const time = reservation.start_at.slice(11, 16)
  reservation.service_end_at = endStamp(date, time, menuDuration(state, reservation.menu_id))
}

export type CsvImportResult = {
  imported: number
  errors: string[]
}

export function importReservationCsv(state: DemoState, csv: string): CsvImportResult {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  const errors: string[] = []
  let imported = 0
  lines.forEach((line, index) => {
    if (index === 0 && line.includes("予約日")) return
    const cells = line.split(",").map((cell) => cell.trim())
    if (cells.length < 8) {
      errors.push(`${index + 1}行目: 列が足りません`)
      return
    }
    const [date, start, end, stylistName, menuName, customerName, phone, channelRaw] = cells
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(start)) {
      errors.push(`${index + 1}行目: 日時の形式が違います`)
      return
    }
    const trainer =
      state.trainers.find((item) => item.name === stylistName) ??
      state.trainers.find((item) => stylistName.includes(item.name) || item.name.includes(stylistName)) ??
      state.trainers[0]
    const menu =
      state.menus.find((item) => item.name === menuName) ??
      state.menus.find((item) => menuName.includes(item.name) || item.name.includes(menuName)) ??
      state.menus[0]
    if (!trainer || !menu || !customerName) {
      errors.push(`${index + 1}行目: 担当またはメニューを決められません`)
      return
    }
    const source = parseReservationChannel(channelRaw)
    const id = demoId("res")
    const reservation: DemoReservation = {
      reservation_id: id,
      menu_id: menu.menu_id,
      menu_name: menu.name,
      start_at: stamp(date, start),
      service_end_at: /^\d{2}:\d{2}$/.test(end) ? stamp(date, end) : endStamp(date, start, menu.duration_minutes),
      customer_name: customerName,
      customer_email: "",
      customer_phone: phone || null,
      notes: source === "hotpepper" ? "CSV取り込み（ホットペッパー）" : "CSV取り込み",
      status: "BOOKED",
      trainer_id: trainer.trainer_id,
      trainer_name: trainer.name,
      booking_type: "SHIMEI",
      source,
      payment_method: "onsite",
      payment_status: "pending",
      payment_amount_yen: menu.price,
      confirmation_token: demoId("token"),
      created_at: new Date().toISOString(),
      customer_id: null,
      can_cancel: true,
    }
    state.reservations.push(reservation)
    imported += 1
  })
  return { imported, errors }
}

export function publicMenus(state: DemoState) {
  return state.menus
    .filter((menu) => menu.is_public && !menu.is_archived)
    .map((menu) => ({
      menu_id: menu.menu_id,
      name: menu.name,
      duration_minutes: menu.duration_minutes,
      price: menu.price,
      description: menu.description,
      image_url: menu.image_url,
    }))
}

export function minutesOf(hhmm: string): number {
  const [hour, minute] = hhmm.split(":").map(Number)
  return hour * 60 + minute
}

export function availabilitySlots(
  state: DemoState,
  date: string,
  menuId: string,
  trainerId?: string,
  excludeId?: string,
): { start_at: string; selectable: boolean }[] {
  const weekday = new Date(`${date}T12:00:00`).getDay()
  const dayOfWeek = (weekday + 6) % 7
  const hours = state.business_hours.find((item) => item.day_of_week === dayOfWeek)
  if (!hours || hours.is_closed || state.holidays.some((holiday) => holiday.date === date)) return []
  const menu = state.menus.find((item) => item.menu_id === menuId) ?? state.menus[0]
  if (!menu) return []
  const duration = menu.duration_minutes
  const step = state.booking_rules.slot_increment_minutes || 30
  const open = minutesOf(hours.start_time)
  const close = minutesOf(hours.end_time)
  const trainers = state.trainers.filter((trainer) => {
    if (!trainer.is_active) return false
    if (trainerId && trainer.trainer_id !== trainerId) return false
    return true
  })
  const now = Date.now()
  const deadlineMs = state.booking_rules.booking_deadline_minutes * 60 * 1000
  const slots: { start_at: string; selectable: boolean }[] = []
  for (let start = open; start + duration <= close; start += step) {
    const hh = String(Math.floor(start / 60)).padStart(2, "0")
    const mm = String(start % 60).padStart(2, "0")
    const startAt = stamp(date, `${hh}:${mm}`)
    const tooSoon = new Date(startAt).getTime() < now + deadlineMs
    const selectable =
      !tooSoon &&
      trainers.some((trainer) => {
        const covered = state.shifts.some((shift) => {
          if (shift.trainer_id !== trainer.trainer_id || shift.date !== date) return false
          return minutesOf(shift.start_time) <= start && minutesOf(shift.end_time) >= start + duration
        })
        if (!covered) return false
        return !state.reservations.some((reservation) => {
          if (reservation.reservation_id === excludeId) return false
          if (reservation.status === "CANCELED") return false
          if (reservation.trainer_id !== trainer.trainer_id) return false
          if (!reservation.start_at.startsWith(date)) return false
          const reservedStart = minutesOf(reservation.start_at.slice(11, 16))
          const reservedEnd = minutesOf(reservation.service_end_at.slice(11, 16)) + state.booking_rules.buffer_minutes
          return start < reservedEnd && reservedStart < start + duration
        })
      })
    slots.push({ start_at: startAt, selectable })
  }
  return slots
}
