import { DEMO_CUSTOMER, DEMO_OWNER, DEMO_SALON_NAME, DEMO_SALON_SLUG } from "@/demo/demoAccounts"
import { parseHotpepperMail } from "@/demo/parseHotpepperMail"
import { parseReservationChannel, type ReservationChannel } from "@/features/admin/lib/reservationChannel"

const STORAGE_INDEX = "kisaragi-salon-demo:v3:index"
const LEGACY_STORAGE_KEY = "kisaragi-salon-demo:v2"

function storageKey(slug: string): string {
  return `kisaragi-salon-demo:v3:${slug}`
}

let activeSlug = DEMO_SALON_SLUG

export function useDemoSalon(slug: string): void {
  activeSlug = slug.trim().toLowerCase() || DEMO_SALON_SLUG
}
const SALON_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1400&q=80"

export type DemoMenu = {
  menu_id: string
  name: string
  duration_minutes: number
  price: number
  cost_yen: number
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

export type DemoMail = {
  id: string
  from: string
  subject: string
  received_at: string
  body: string
  imported: boolean
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
  inbox: DemoMail[]
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
      cost_yen: 1700,
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
      cost_yen: 3100,
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
      cost_yen: 3500,
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
      cost_yen: 1400,
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
  const mailDate = shiftDate(3)
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
    paymentMethod?: string
  }): DemoReservation {
    const paymentMethod = input.paymentMethod ?? "onsite"
    const prepaid = paymentMethod === "credit" || paymentMethod === "paypay"
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
      payment_method: paymentMethod,
      payment_status: input.status === "DONE" || prepaid ? "paid" : "pending",
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
      description: "カット、カラー、パーマ、トリートメントまで。前払いと当日払いのどちらでも予約できます。",
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
        paymentMethod: "credit",
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
      reservation({
        id: "res_done_cut",
        menu: cut,
        trainer: trainers[0],
        date: shiftDate(-6),
        time: "11:00",
        customerName: DEMO_CUSTOMER.name,
        email: DEMO_CUSTOMER.email,
        phone: DEMO_CUSTOMER.phone,
        source: "web",
        status: "DONE",
        customerId: "user_guest",
        paymentMethod: "onsite",
      }),
      reservation({
        id: "res_done_color",
        menu: color,
        trainer: trainers[1],
        date: shiftDate(-4),
        time: "13:00",
        customerName: "佐藤 美月",
        email: "sato@example.com",
        phone: "09022223333",
        source: "hotpepper",
        status: "DONE",
        paymentMethod: "credit",
      }),
      reservation({
        id: "res_done_perm",
        menu: perm,
        trainer: trainers[2],
        date: shiftDate(-3),
        time: "10:00",
        customerName: "鈴木 彩",
        email: "suzuki@example.com",
        phone: "09044445555",
        source: "web",
        status: "DONE",
        paymentMethod: "paypay",
      }),
      reservation({
        id: "res_done_treat",
        menu: treatment,
        trainer: trainers[1],
        date: shiftDate(-2),
        time: "16:00",
        customerName: "高橋 直人",
        email: "takahashi@example.com",
        phone: "09033334444",
        source: "phone",
        status: "DONE",
        paymentMethod: "onsite",
      }),
    ],
    inbox: [
      {
        id: "mail_unread",
        from: "reservation@hotpepper.example",
        subject: "【ホットペッパービューティー】予約が入りました",
        received_at: stamp(today, "09:10"),
        imported: false,
        body: [
          "ホットペッパービューティー 予約受付のお知らせ",
          "",
          "■ご予約内容",
          `予約日時：${Number(mailDate.slice(0, 4))}年${Number(mailDate.slice(5, 7))}月${Number(mailDate.slice(8, 10))}日 15:00`,
          "所要時間：60分",
          "メニュー：カット",
          "担当スタイリスト：青井 凛",
          "",
          "■お客様情報",
          "氏名：森 あかり",
          "電話番号：090-7777-8888",
        ].join("\n"),
      },
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

function readIndex(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_INDEX)
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    const slugs = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : []
    if (!slugs.includes(DEMO_SALON_SLUG)) slugs.unshift(DEMO_SALON_SLUG)
    return slugs
  } catch {
    return [DEMO_SALON_SLUG]
  }
}

function rememberSlug(slug: string): void {
  const slugs = readIndex()
  if (slugs.includes(slug)) return
  slugs.push(slug)
  localStorage.setItem(STORAGE_INDEX, JSON.stringify(slugs))
}

function parseState(raw: string): DemoState | null {
  try {
    const parsed = JSON.parse(raw) as DemoState
    if (parsed?.salon?.slug && Array.isArray(parsed.reservations)) {
      if (!Array.isArray(parsed.inbox)) parsed.inbox = []
      return parsed
    }
  } catch {
    return null
  }
  return null
}

export function salonExists(slug: string): boolean {
  if (slug === DEMO_SALON_SLUG) return true
  return localStorage.getItem(storageKey(slug)) != null
}

export function loadDemoState(): DemoState {
  const key = storageKey(activeSlug)
  const saved = localStorage.getItem(key)
  if (saved) {
    const parsed = parseState(saved)
    if (parsed) return parsed
  }
  if (activeSlug === DEMO_SALON_SLUG) {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
    const migrated = legacy ? parseState(legacy) : null
    const seed = migrated ?? createSeed()
    saveDemoState(seed)
    return seed
  }
  throw new Error(`demo salon not found: ${activeSlug}`)
}

export function saveDemoState(state: DemoState): void {
  const slug = state.salon.slug.trim().toLowerCase()
  localStorage.setItem(storageKey(slug), JSON.stringify(state))
  rememberSlug(slug)
}

export function listDemoSalons(): { slug: string; salonName: string }[] {
  const previous = activeSlug
  const salons = readIndex().map((slug) => {
    activeSlug = slug
    const state = loadDemoState()
    return { slug: state.salon.slug, salonName: state.salon.salon_name }
  })
  activeSlug = previous
  return salons
}

export function demoEmailTaken(email: string): boolean {
  const previous = activeSlug
  const taken = readIndex().some((slug) => {
    activeSlug = slug
    return loadDemoState().admins.some((admin) => admin.email.toLowerCase() === email)
  })
  activeSlug = previous
  return taken
}

export function findSalonByInvite(token: string): string | null {
  const previous = activeSlug
  for (const slug of readIndex()) {
    activeSlug = slug
    const state = loadDemoState()
    if (state.invites[token]) {
      const found = state.salon.slug
      activeSlug = previous
      return found
    }
  }
  activeSlug = previous
  return null
}

export function findSalonAdmin(
  email: string,
  password: string,
): { slug: string; admin: DemoAdmin } | null {
  const previous = activeSlug
  for (const slug of readIndex()) {
    activeSlug = slug
    const state = loadDemoState()
    const admin = state.admins.find((item) => item.email.toLowerCase() === email && item.password === password)
    if (admin) return { slug: state.salon.slug, admin }
  }
  activeSlug = previous
  return null
}

export function provisionSalon(input: {
  salonName: string
  slug: string
  email: string
  password: string
  ownerName: string
}): DemoState {
  const slug = input.slug.trim().toLowerCase()
  const seed = createSeed()
  seed.salon = {
    ...seed.salon,
    salon_id: demoId("salon"),
    salon_name: input.salonName.trim(),
    slug,
    description: `${input.salonName.trim()}の予約です。前払いと当日払いを選べます。`,
  }
  seed.reservations = []
  seed.inbox = []
  seed.customers = []
  seed.coupons = []
  seed.admins = [
    {
      admin_id: demoId("admin"),
      email: input.email.trim().toLowerCase(),
      password: input.password,
      name: input.ownerName.trim() || "オーナー",
      role: "owner",
    },
  ]
  const trainerId = demoId("st")
  seed.trainers = [
    {
      trainer_id: trainerId,
      name: input.ownerName.trim() || "オーナー",
      color: "#7c3aed",
      description: "サロンオーナー",
      image_url: null,
      display_order: 1,
      menu_ids: seed.menus.map((menu) => menu.menu_id),
      is_active: true,
      admin_id: seed.admins[0].admin_id,
    },
  ]
  seed.shifts = seed.shifts
    .filter((shift) => shift.trainer_id === "st_aoi")
    .map((shift) => ({
      ...shift,
      shift_id: `shift_${trainerId}_${shift.date}`,
      trainer_id: trainerId,
    }))
  seed.lookupTokens = {}
  seed.otpChallenges = {}
  seed.signupTokens = {}
  seed.invites = {}
  const previous = activeSlug
  activeSlug = slug
  saveDemoState(seed)
  activeSlug = previous
  return seed
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

export function importHotpepperEmail(state: DemoState, text: string): CsvImportResult {
  const parsed = parseHotpepperMail(text)
  if (!parsed) {
    return { imported: 0, errors: ["予約日時、メニュー、お客様名を読み取れませんでした。"] }
  }
  const phone = parsed.phone
  const duplicate = state.reservations.some((item) => {
    if (item.status === "CANCELED") return false
    if (!item.start_at.startsWith(`${parsed.date}T${parsed.start}`)) return false
    return (item.customer_phone ?? "").replace(/\D/g, "") === phone
  })
  if (duplicate) return { imported: 0, errors: ["同じ日時・電話番号の予約がすでにあります。"] }
  const trainer =
    state.trainers.find((item) => item.name === parsed.stylistName) ??
    state.trainers.find((item) => parsed.stylistName && (parsed.stylistName.includes(item.name) || item.name.includes(parsed.stylistName))) ??
    state.trainers[0]
  const menu =
    state.menus.find((item) => item.name === parsed.menuName) ??
    state.menus.find((item) => parsed.menuName.includes(item.name) || item.name.includes(parsed.menuName)) ??
    state.menus[0]
  if (!trainer || !menu) return { imported: 0, errors: ["担当またはメニューを決められませんでした。"] }
  const end = parsed.end
    ? stamp(parsed.date, parsed.end)
    : endStamp(parsed.date, parsed.start, parsed.durationMinutes ?? menu.duration_minutes)
  state.reservations.push({
    reservation_id: demoId("res"),
    menu_id: menu.menu_id,
    menu_name: menu.name,
    start_at: stamp(parsed.date, parsed.start),
    service_end_at: end,
    customer_name: parsed.customerName,
    customer_email: "",
    customer_phone: phone || null,
    notes: "ホットペッパーの予約メールから取り込み",
    status: "BOOKED",
    trainer_id: trainer.trainer_id,
    trainer_name: trainer.name,
    booking_type: "SHIMEI",
    source: "hotpepper",
    payment_method: "onsite",
    payment_status: "pending",
    payment_amount_yen: menu.price,
    confirmation_token: demoId("token"),
    created_at: new Date().toISOString(),
    customer_id: null,
    can_cancel: true,
  })
  return { imported: 1, errors: [] }
}

export type SalesLine = {
  name: string
  count: number
  revenue_yen: number
  cost_yen: number
  profit_yen: number
  margin_rate: number
}

export type SalesSummary = {
  month: string
  revenue_yen: number
  cost_yen: number
  profit_yen: number
  margin_rate: number
  prepaid_yen: number
  by_menu: SalesLine[]
  by_payment: { method: string; label: string; revenue_yen: number }[]
}

function menuCost(menu: DemoMenu | undefined, price: number): number {
  if (menu && Number.isFinite(menu.cost_yen)) return menu.cost_yen
  return Math.round(price * 0.35)
}

function paymentLabel(method: string | null): string {
  if (method === "credit") return "前払い（カード）"
  if (method === "paypay") return "前払い（PayPay）"
  return "当日払い"
}

export function salesSummary(state: DemoState, month: string): SalesSummary {
  const done = state.reservations.filter(
    (item) => item.status === "DONE" && item.start_at.startsWith(month),
  )
  const byMenu = new Map<string, SalesLine>()
  const byPayment = new Map<string, { method: string; label: string; revenue_yen: number }>()
  let revenue = 0
  let cost = 0
  for (const item of done) {
    const price = item.payment_amount_yen ?? 0
    const menu = state.menus.find((entry) => entry.menu_id === item.menu_id)
    const itemCost = menuCost(menu, price)
    revenue += price
    cost += itemCost
    const line = byMenu.get(item.menu_name) ?? {
      name: item.menu_name,
      count: 0,
      revenue_yen: 0,
      cost_yen: 0,
      profit_yen: 0,
      margin_rate: 0,
    }
    line.count += 1
    line.revenue_yen += price
    line.cost_yen += itemCost
    line.profit_yen = line.revenue_yen - line.cost_yen
    line.margin_rate = line.revenue_yen > 0 ? line.profit_yen / line.revenue_yen : 0
    byMenu.set(item.menu_name, line)
    const method = item.payment_method ?? "onsite"
    const pay = byPayment.get(method) ?? { method, label: paymentLabel(method), revenue_yen: 0 }
    pay.revenue_yen += price
    byPayment.set(method, pay)
  }
  const prepaid = state.reservations
    .filter(
      (item) =>
        item.status === "BOOKED" &&
        item.payment_status === "paid" &&
        item.start_at.startsWith(month),
    )
    .reduce((sum, item) => sum + (item.payment_amount_yen ?? 0), 0)
  const profit = revenue - cost
  return {
    month,
    revenue_yen: revenue,
    cost_yen: cost,
    profit_yen: profit,
    margin_rate: revenue > 0 ? profit / revenue : 0,
    prepaid_yen: prepaid,
    by_menu: [...byMenu.values()],
    by_payment: [...byPayment.values()],
  }
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
