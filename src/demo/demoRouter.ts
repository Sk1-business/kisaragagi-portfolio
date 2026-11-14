import {
  DEMO_ADMIN_SESSION_KEY,
  DEMO_CUSTOMER_SESSION_KEY,
  DEMO_SIGNUP_TOKEN_KEY,
  DEMO_OTP_CODE,
} from "@/demo/demoAccounts"
import { routerBasename } from "@/demo/demoMode"
import {
  availabilitySlots,
  demoId,
  importReservationCsv,
  loadDemoState,
  publicMenus,
  recomputeEnd,
  updateDemoState,
  type DemoAdmin,
  type DemoReservation,
  type DemoState,
} from "@/demo/demoStore"

function json(status: number, data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  })
}

function empty(status = 204): Response {
  return new Response(null, { status })
}

async function readBody(init?: RequestInit): Promise<Record<string, unknown>> {
  const body = init?.body
  if (!body || typeof body !== "string") return {}
  try {
    const parsed = JSON.parse(body) as unknown
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
  } catch {
    /* ignore */
  }
  return {}
}

function header(init: RequestInit | undefined, name: string): string {
  const headers = init?.headers
  if (!headers) return ""
  if (headers instanceof Headers) return headers.get(name) ?? ""
  if (Array.isArray(headers)) {
    const found = headers.find(([key]) => key.toLowerCase() === name.toLowerCase())
    return found?.[1] ?? ""
  }
  const record = headers as Record<string, string>
  const key = Object.keys(record).find((item) => item.toLowerCase() === name.toLowerCase())
  return key ? record[key] : ""
}

function adminSession(): string | null {
  try {
    return sessionStorage.getItem(DEMO_ADMIN_SESSION_KEY)
  } catch {
    return null
  }
}

function setAdminSession(adminId: string | null): void {
  try {
    if (adminId) sessionStorage.setItem(DEMO_ADMIN_SESSION_KEY, adminId)
    else sessionStorage.removeItem(DEMO_ADMIN_SESSION_KEY)
  } catch {
    /* ignore */
  }
}

function customerSession(): string | null {
  try {
    return sessionStorage.getItem(DEMO_CUSTOMER_SESSION_KEY)
  } catch {
    return null
  }
}

function setCustomerSession(userId: string | null): void {
  try {
    if (userId) sessionStorage.setItem(DEMO_CUSTOMER_SESSION_KEY, userId)
    else sessionStorage.removeItem(DEMO_CUSTOMER_SESSION_KEY)
  } catch {
    /* ignore */
  }
}

function currentAdmin(state: DemoState): DemoAdmin | undefined {
  const id = adminSession()
  return state.admins.find((admin) => admin.admin_id === id)
}

function requireAdmin(state: DemoState): DemoAdmin | Response {
  const admin = currentAdmin(state)
  if (!admin) return json(401, { detail: "再ログインが必要です。" })
  return admin
}

function detailOf(reservation: DemoReservation) {
  return {
    reservation_id: reservation.reservation_id,
    menu_id: reservation.menu_id,
    menu_name: reservation.menu_name,
    start_at: reservation.start_at,
    service_end_at: reservation.service_end_at,
    customer_name: reservation.customer_name,
    customer_email: reservation.customer_email,
    customer_phone: reservation.customer_phone,
    notes: reservation.notes,
    status: reservation.status,
    can_cancel: reservation.status === "BOOKED",
    trainer_id: reservation.trainer_id,
    trainer_name: reservation.trainer_name,
    booking_type: reservation.booking_type,
    source: reservation.source,
    payment_method: reservation.payment_method,
    payment_status: reservation.payment_status,
    payment_amount_yen: reservation.payment_amount_yen,
    payment_currency: "jpy",
    payment_record_status: reservation.payment_status,
    confirmation_token: reservation.confirmation_token,
    created_at: reservation.created_at,
    payment_id: null,
  }
}

function salonPage(state: DemoState) {
  return {
    salon_name: state.salon.salon_name,
    description: state.salon.description,
    address: state.salon.address,
    business_hours_summary: state.salon.business_hours_summary,
    booking_page_message: state.salon.booking_page_message,
    cancellation_policy_text: state.salon.cancellation_policy_text,
    stripe_connect_connected: false,
    menus: publicMenus(state),
    hotpepper_url: state.salon.hotpepper_url,
    coupons: state.coupons,
  }
}

function profilePayload(state: DemoState) {
  return {
    ...state.salon,
    hotpepper_url: state.salon.hotpepper_url,
  }
}

function digits(value: string): string {
  return value.replace(/\D/g, "")
}

function contactMatches(reservation: DemoReservation, email?: string, phone?: string): boolean {
  if (email && reservation.customer_email.toLowerCase() === email.toLowerCase()) return true
  if (phone && reservation.customer_phone && digits(reservation.customer_phone) === digits(phone)) return true
  return false
}

function addDaysKey(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number)
  const next = new Date(year, month - 1, day)
  next.setDate(next.getDate() + days)
  const y = next.getFullYear()
  const m = String(next.getMonth() + 1).padStart(2, "0")
  const d = String(next.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function filterReservations(state: DemoState, search: URLSearchParams): DemoReservation[] {
  const date = search.get("date")
  const view = search.get("view")
  return state.reservations.filter((reservation) => {
    if (!date) return true
    const day = reservation.start_at.slice(0, 10)
    if (view === "week") return day >= date && day <= addDaysKey(date, 6)
    return day === date
  })
}

function createReservation(
  state: DemoState,
  body: Record<string, unknown>,
  source: DemoReservation["source"],
): DemoReservation {
  const menuId = String(body.menu_id ?? state.menus[0]?.menu_id ?? "")
  const menu = state.menus.find((item) => item.menu_id === menuId) ?? state.menus[0]
  const trainerId = body.trainer_id ? String(body.trainer_id) : null
  const trainer = state.trainers.find((item) => item.trainer_id === trainerId) ?? null
  const startAt = String(body.start_at ?? "")
  const id = demoId("res")
  const reservation: DemoReservation = {
    reservation_id: id,
    menu_id: menu?.menu_id ?? menuId,
    menu_name: menu?.name ?? "メニュー",
    start_at: startAt,
    service_end_at: typeof body.end_at === "string" ? body.end_at : startAt,
    customer_name: String(body.customer_name ?? ""),
    customer_email: String(body.customer_email ?? ""),
    customer_phone: body.customer_phone ? String(body.customer_phone) : null,
    notes: body.notes ? String(body.notes) : null,
    status: "BOOKED",
    trainer_id: trainer?.trainer_id ?? trainerId,
    trainer_name: trainer?.name ?? null,
    booking_type: body.booking_type === "OMAKASE" ? "OMAKASE" : trainer ? "SHIMEI" : "OMAKASE",
    source,
    payment_method: body.payment_method ? String(body.payment_method) : "onsite",
    payment_status: "pending",
    payment_amount_yen: menu?.price ?? null,
    confirmation_token: demoId("token"),
    created_at: new Date().toISOString(),
    customer_id: customerSession(),
    can_cancel: true,
  }
  if (!body.end_at) recomputeEnd(state, reservation)
  state.reservations.push(reservation)
  return reservation
}

function applyReservationPatch(state: DemoState, reservation: DemoReservation, body: Record<string, unknown>): void {
  if (typeof body.trainer_id === "string") {
    const trainer = state.trainers.find((item) => item.trainer_id === body.trainer_id)
    reservation.trainer_id = body.trainer_id
    reservation.trainer_name = trainer?.name ?? reservation.trainer_name
    reservation.booking_type = "SHIMEI"
  }
  if (typeof body.start_at === "string") {
    reservation.start_at = body.start_at
    recomputeEnd(state, reservation)
  }
  if (typeof body.end_at === "string") reservation.service_end_at = body.end_at
  if ("notes" in body) reservation.notes = body.notes == null ? null : String(body.notes)
  if (typeof body.customer_name === "string") reservation.customer_name = body.customer_name
  if (typeof body.customer_email === "string") reservation.customer_email = body.customer_email
  if (typeof body.customer_phone === "string") reservation.customer_phone = body.customer_phone
  if (typeof body.menu_id === "string") {
    const menu = state.menus.find((item) => item.menu_id === body.menu_id)
    reservation.menu_id = body.menu_id
    if (menu) reservation.menu_name = menu.name
    recomputeEnd(state, reservation)
  }
}

function hotpepperPayload(state: DemoState) {
  return {
    hotpepper_url: state.salon.hotpepper_url,
    coupons: state.coupons,
  }
}

export async function handleDemoRequest(pathWithQuery: string, init?: RequestInit): Promise<Response> {
  const queryIndex = pathWithQuery.indexOf("?")
  const pathname = decodeURIComponent(queryIndex < 0 ? pathWithQuery : pathWithQuery.slice(0, queryIndex))
  const search = new URLSearchParams(queryIndex < 0 ? "" : pathWithQuery.slice(queryIndex + 1))
  const method = (init?.method ?? "GET").toUpperCase()
  const state = loadDemoState()
  const body = method === "GET" || method === "DELETE" ? {} : await readBody(init)

  if (pathname === "/api/admin/login" && method === "POST") {
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")
    const admin = state.admins.find((item) => item.email.toLowerCase() === email && item.password === password)
    if (!admin) return json(401, { detail: "メールアドレスまたはパスワードが違います。" })
    setAdminSession(admin.admin_id)
    return json(200, { ok: true })
  }

  if (pathname === "/api/admin/logout" && method === "POST") {
    setAdminSession(null)
    return empty()
  }

  if (pathname === "/api/admin/signup" && method === "POST") {
    const email = String(body.email ?? "").trim().toLowerCase()
    if (!email) return json(400, { detail: "email is required" })
    if (state.admins.some((admin) => admin.email.toLowerCase() === email)) {
      return json(409, { detail: "already registered" })
    }
    if (!body.salon_name && !body.invite_token) {
      return json(400, { detail: "salon_name is required" })
    }
    const admin: DemoAdmin = {
      admin_id: demoId("admin"),
      email,
      password: String(body.password ?? ""),
      name: String(body.name ?? "オーナー"),
      role: body.role === "staff" || body.invite_token ? "staff" : "owner",
    }
    const next = updateDemoState((draft) => {
      draft.admins.push(admin)
      if (typeof body.salon_name === "string" && body.salon_name.trim()) {
        draft.salon.salon_name = body.salon_name.trim()
      }
      if (typeof body.salon_slug === "string" && body.salon_slug.trim()) {
        draft.salon.slug = body.salon_slug.trim().toLowerCase()
      }
      if (typeof body.invite_token === "string") {
        delete draft.invites[body.invite_token]
      }
    })
    setAdminSession(admin.admin_id)
    void next
    return json(200, { ok: true, admin_id: admin.admin_id })
  }

  if (pathname === "/api/admin/signup-verifications" && method === "POST") {
    const email = String(body.email ?? "").trim().toLowerCase()
    if (state.admins.some((admin) => admin.email.toLowerCase() === email)) {
      return json(409, { detail: "already registered" })
    }
    const token = demoId("verify")
    updateDemoState((draft) => {
      draft.signupTokens[token] = { email, used: false }
    })
    try {
      sessionStorage.setItem(DEMO_SIGNUP_TOKEN_KEY, token)
    } catch {
      /* ignore */
    }
    return json(200, {
      email,
      token,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })
  }

  if (pathname === "/api/admin/signup-verifications/verify" && method === "POST") {
    const token = String(body.token ?? "")
    const record = state.signupTokens[token]
    if (!record) return json(404, { detail: "not found" })
    if (record.used) return json(409, { detail: "already used" })
    updateDemoState((draft) => {
      const current = draft.signupTokens[token]
      if (current) current.used = true
    })
    return json(200, { email: record.email })
  }

  const admin = requireAdmin(state)
  const isPublic =
    pathname.startsWith("/api/s/") ||
    pathname.startsWith("/api/my/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/payments/")
  if (!isPublic && admin instanceof Response) return admin
  const actor = admin instanceof Response ? undefined : admin

  if (pathname === "/api/admin/me" && method === "GET" && actor) {
    return json(200, {
      admin_id: actor.admin_id,
      name: actor.name,
      avatar_url: null,
      salon_name: state.salon.salon_name,
      role: actor.role,
      email: actor.email,
    })
  }

  if (pathname === "/api/admin/profile" && method === "GET") return json(200, profilePayload(state))
  if (pathname === "/api/admin/profile" && method === "PUT") {
    const next = updateDemoState((draft) => {
      const salon = draft.salon
      const assign = (key: keyof typeof salon, value: unknown) => {
        if (value === undefined) return
        if (value === null) {
          if (key === "salon_name" || key === "slug" || key === "description" || key === "phone" || key === "address") return
          ;(salon[key] as string | null) = null
          return
        }
        if (typeof value === "string") (salon[key] as string) = value
      }
      assign("salon_name", body.salon_name)
      assign("slug", body.slug)
      assign("description", body.description)
      assign("phone", body.phone)
      assign("address", body.address)
      assign("booking_page_message", body.booking_page_message)
      assign("cancellation_policy_text", body.cancellation_policy_text)
      assign("instagram_url", body.instagram_url)
      assign("line_url", body.line_url)
      assign("website_url", body.website_url)
      assign("theme_color", body.theme_color)
      assign("timezone", body.timezone)
      assign("hotpepper_url", body.hotpepper_url)
    })
    return json(200, profilePayload(next))
  }

  if (pathname === "/api/admin/hotpepper" && method === "GET") return json(200, hotpepperPayload(state))
  if (pathname === "/api/admin/hotpepper" && method === "PUT") {
    const next = updateDemoState((draft) => {
      if (typeof body.hotpepper_url === "string") draft.salon.hotpepper_url = body.hotpepper_url.trim()
      if (Array.isArray(body.coupons)) {
        draft.coupons = body.coupons
          .filter((item) => item && typeof item === "object")
          .map((item) => {
            const row = item as Record<string, unknown>
            return {
              id: typeof row.id === "string" && row.id ? row.id : demoId("coupon"),
              title: String(row.title ?? ""),
              description: String(row.description ?? ""),
              price_yen: Number(row.price_yen ?? 0),
            }
          })
          .filter((coupon) => coupon.title.trim())
      }
    })
    return json(200, hotpepperPayload(next))
  }
  if (pathname === "/api/admin/hotpepper/import" && method === "POST") {
    let result = { imported: 0, errors: [] as string[] }
    updateDemoState((draft) => {
      result = importReservationCsv(draft, String(body.csv ?? ""))
    })
    return json(200, result)
  }

  if (pathname === "/api/admin/settings" && method === "GET") {
    return json(200, {
      business_hours: state.business_hours,
      holidays: state.holidays.map((holiday) => holiday.date),
      booking_rules: state.booking_rules,
    })
  }
  if (pathname === "/api/admin/settings/business-hours" && method === "GET") {
    return json(200, state.business_hours)
  }
  if (pathname === "/api/admin/settings/business-hours" && method === "PUT") {
    updateDemoState((draft) => {
      if (Array.isArray(body.hours)) {
        draft.business_hours = body.hours as DemoState["business_hours"]
      }
    })
    return empty()
  }
  if (pathname === "/api/admin/settings/holidays" && method === "GET") {
    return json(200, state.holidays.map((holiday) => holiday.date))
  }
  if (pathname === "/api/admin/settings/holidays" && method === "POST") {
    const holiday = {
      id: demoId("holiday"),
      date: String(body.date ?? "").slice(0, 10),
      description: body.description ? String(body.description) : null,
    }
    updateDemoState((draft) => {
      draft.holidays.push(holiday)
    })
    return json(200, holiday)
  }
  if (pathname === "/api/admin/settings/booking-rules" && (method === "PUT" || method === "POST")) {
    updateDemoState((draft) => {
      draft.booking_rules = { ...draft.booking_rules, ...body } as DemoState["booking_rules"]
    })
    return empty()
  }

  if (pathname === "/api/admin/menus" && method === "GET") return json(200, state.menus)
  if (pathname === "/api/admin/menus" && method === "POST") {
    const menu = {
      menu_id: demoId("menu"),
      name: String(body.name ?? ""),
      duration_minutes: Number(body.duration_minutes ?? 60),
      price: Number(body.price ?? 0),
      description: null,
      image_url: null,
      is_public: body.is_public !== false,
      is_archived: body.is_archived === true,
    }
    updateDemoState((draft) => {
      draft.menus.push(menu)
    })
    return json(200, menu)
  }

  const menuMatch = pathname.match(/^\/api\/admin\/menus\/([^/]+)$/)
  if (menuMatch && method === "PUT") {
    updateDemoState((draft) => {
      const menu = draft.menus.find((item) => item.menu_id === menuMatch[1])
      if (!menu) return
      if (typeof body.name === "string") menu.name = body.name
      if (typeof body.duration_minutes === "number") menu.duration_minutes = body.duration_minutes
      if (typeof body.price === "number") menu.price = body.price
      if (typeof body.is_public === "boolean") menu.is_public = body.is_public
      if (typeof body.is_archived === "boolean") menu.is_archived = body.is_archived
    })
    return empty()
  }

  if (pathname === "/api/admin/trainers" && method === "GET") return json(200, state.trainers)
  if (pathname === "/api/admin/trainers" && method === "POST") {
    const trainer = {
      trainer_id: demoId("st"),
      name: String(body.name ?? ""),
      color: String(body.color ?? "#64748b"),
      description: body.description ? String(body.description) : null,
      image_url: body.image_url ? String(body.image_url) : null,
      display_order: typeof body.display_order === "number" ? body.display_order : state.trainers.length + 1,
      menu_ids: Array.isArray(body.menu_ids) ? body.menu_ids.map(String) : [],
      is_active: true,
      admin_id: body.admin_id ? String(body.admin_id) : null,
    }
    updateDemoState((draft) => {
      draft.trainers.push(trainer)
    })
    return json(200, trainer)
  }
  if (pathname === "/api/admin/trainers/profile-image/upload" && method === "POST") {
    return json(200, {
      url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80",
    })
  }

  const trainerMatch = pathname.match(/^\/api\/admin\/trainers\/([^/]+)$/)
  if (trainerMatch && method === "GET") {
    const trainer = state.trainers.find((item) => item.trainer_id === trainerMatch[1])
    if (!trainer) return json(404, { detail: "not found" })
    return json(200, trainer)
  }
  if (trainerMatch && method === "PUT") {
    updateDemoState((draft) => {
      const trainer = draft.trainers.find((item) => item.trainer_id === trainerMatch[1])
      if (!trainer) return
      if (typeof body.name === "string") trainer.name = body.name
      if (typeof body.color === "string") trainer.color = body.color
      if ("description" in body) trainer.description = body.description ? String(body.description) : null
      if ("image_url" in body) trainer.image_url = body.image_url ? String(body.image_url) : null
      if (typeof body.display_order === "number") trainer.display_order = body.display_order
      if (Array.isArray(body.menu_ids)) trainer.menu_ids = body.menu_ids.map(String)
      if (typeof body.is_active === "boolean") trainer.is_active = body.is_active
      if (typeof body.admin_id === "string") trainer.admin_id = body.admin_id
    })
    return empty()
  }

  const shiftList = pathname.match(/^\/api\/admin\/trainers\/([^/]+)\/shifts$/)
  if (shiftList && method === "GET") {
    const from = search.get("date_from") ?? "0000-01-01"
    const to = search.get("date_to") ?? "9999-12-31"
    const rows = state.shifts.filter(
      (shift) => shift.trainer_id === shiftList[1] && shift.date >= from && shift.date <= to,
    )
    return json(200, rows)
  }
  if (shiftList && method === "POST") {
    const shift = {
      shift_id: demoId("shift"),
      trainer_id: shiftList[1],
      date: String(body.date ?? "").slice(0, 10),
      start_time: String(body.start_time ?? "10:00").slice(0, 5),
      end_time: String(body.end_time ?? "19:00").slice(0, 5),
    }
    updateDemoState((draft) => {
      draft.shifts.push(shift)
    })
    return json(200, shift)
  }
  if (pathname.endsWith("/shifts/bulk") && method === "POST") {
    const trainerId = pathname.split("/")[4]
    const created: DemoState["shifts"] = []
    updateDemoState((draft) => {
      const rows = Array.isArray(body.shifts) ? body.shifts : []
      for (const row of rows) {
        if (!row || typeof row !== "object") continue
        const item = row as Record<string, unknown>
        const shift = {
          shift_id: demoId("shift"),
          trainer_id: trainerId,
          date: String(item.date ?? "").slice(0, 10),
          start_time: String(item.start_time ?? "10:00").slice(0, 5),
          end_time: String(item.end_time ?? "19:00").slice(0, 5),
        }
        draft.shifts.push(shift)
        created.push(shift)
      }
    })
    return json(200, created)
  }
  const shiftDetail = pathname.match(/^\/api\/admin\/trainers\/([^/]+)\/shifts\/([^/]+)$/)
  if (shiftDetail && method === "PUT") {
    updateDemoState((draft) => {
      const shift = draft.shifts.find((item) => item.shift_id === shiftDetail[2])
      if (!shift) return
      if (typeof body.date === "string") shift.date = body.date.slice(0, 10)
      if (typeof body.start_time === "string") shift.start_time = body.start_time.slice(0, 5)
      if (typeof body.end_time === "string") shift.end_time = body.end_time.slice(0, 5)
    })
    return empty()
  }
  if (shiftDetail && method === "DELETE") {
    updateDemoState((draft) => {
      draft.shifts = draft.shifts.filter((item) => item.shift_id !== shiftDetail[2])
    })
    return empty()
  }

  if (pathname === "/api/admin/admin-users" && method === "GET") {
    return json(
      200,
      state.admins.map((item) => ({
        admin_id: item.admin_id,
        email: item.email,
        name: item.name,
        role: item.role,
        is_active: true,
      })),
    )
  }
  if (pathname === "/api/admin/admin-users" && method === "POST") {
    if (actor?.role !== "owner") return json(403, { detail: "owner required" })
    const email = String(body.email ?? "").trim().toLowerCase()
    if (state.admins.some((item) => item.email.toLowerCase() === email)) {
      return json(409, { detail: "already registered" })
    }
    const created = {
      admin_id: demoId("admin"),
      email,
      password: String(body.password ?? "demo1234"),
      name: String(body.name ?? ""),
      role: body.role === "owner" ? "owner" : "staff",
    } as const
    updateDemoState((draft) => {
      draft.admins.push({ ...created })
    })
    return json(200, {
      admin_id: created.admin_id,
      email: created.email,
      name: created.name,
      role: created.role,
      is_active: true,
    })
  }

  if (pathname === "/api/admin/staff-invitations" && method === "POST") {
    const email = String(body.email ?? "").trim().toLowerCase()
    const inviteId = demoId("invite")
    updateDemoState((draft) => {
      draft.invites[inviteId] = { email }
    })
    const base = routerBasename() ?? ""
    const origin = window.location.origin
    return json(200, {
      invite_id: inviteId,
      email,
      signup_url: `${origin}${base}/backoffice/signup?inviteToken=${inviteId}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  if (pathname === "/api/admin/reservations" && method === "GET") {
    const filtered = filterReservations(state, search)
    const page = Number(search.get("page") ?? "1")
    const perPage = Number(search.get("per_page") ?? "100")
    const start = Math.max(0, (page - 1) * perPage)
    const items = filtered.slice(start, start + perPage).map(detailOf)
    return json(200, { items, total: filtered.length, page, per_page: perPage })
  }
  if (pathname === "/api/admin/reservations" && method === "POST") {
    let created: DemoReservation | undefined
    updateDemoState((draft) => {
      created = createReservation(draft, body, "phone")
    })
    return json(200, { reservation_id: created?.reservation_id })
  }

  const reservationStatus = pathname.match(/^\/api\/admin\/reservations\/([^/]+)\/status$/)
  if (reservationStatus && method === "PATCH") {
    const status = String(body.status ?? "BOOKED") as DemoReservation["status"]
    updateDemoState((draft) => {
      const reservation = draft.reservations.find((item) => item.reservation_id === reservationStatus[1])
      if (!reservation) return
      reservation.status = status
      reservation.can_cancel = status === "BOOKED"
    })
    return empty()
  }

  const adminReservation = pathname.match(/^\/api\/admin\/reservations\/([^/]+)$/)
  if (adminReservation && method === "GET") {
    const reservation = state.reservations.find((item) => item.reservation_id === adminReservation[1])
    if (!reservation) return json(404, { detail: "not found" })
    return json(200, detailOf(reservation))
  }
  if (adminReservation && method === "PUT") {
    updateDemoState((draft) => {
      const reservation = draft.reservations.find((item) => item.reservation_id === adminReservation[1])
      if (!reservation) return
      applyReservationPatch(draft, reservation, body)
    })
    return empty()
  }

  if (pathname === "/api/admin/stripe/status" && method === "GET") {
    return json(200, { connected: false, account_id: null, status: "demo" })
  }
  if (pathname === "/api/admin/stripe/connect" && method === "POST") {
    return json(400, { detail: "デモでは外部決済を使いません。予約は当日払いで確定します。" })
  }
  if (pathname === "/api/admin/paypay/status" && method === "GET") {
    return json(200, { configured: false, mode: null, merchant_id_masked: null })
  }
  if (pathname.startsWith("/api/admin/paypay/") ) {
    return json(400, { detail: "デモでは外部決済を使いません。予約は当日払いで確定します。" })
  }
  if (pathname.includes("/refund")) {
    return json(200, { ok: true })
  }

  const salonRoot = pathname.match(/^\/api\/s\/([^/]+)$/)
  if (salonRoot && method === "GET") {
    if (salonRoot[1] !== state.salon.slug) return json(404, { detail: "店舗が見つかりません。" })
    return json(200, salonPage(state))
  }
  const salonMenus = pathname.match(/^\/api\/s\/([^/]+)\/menus$/)
  if (salonMenus && method === "GET") return json(200, publicMenus(state))
  const salonTrainers = pathname.match(/^\/api\/s\/([^/]+)\/trainers$/)
  if (salonTrainers && method === "GET") {
    return json(
      200,
      state.trainers
        .filter((trainer) => trainer.is_active)
        .map((trainer) => ({
          trainer_id: trainer.trainer_id,
          name: trainer.name,
          description: trainer.description,
          image_url: trainer.image_url,
        })),
    )
  }
  const availability = pathname.match(/^\/api\/s\/([^/]+)\/availability$/)
  if (availability && method === "GET") {
    const slots = availabilitySlots(
      state,
      search.get("date") ?? "",
      search.get("menu_id") ?? "",
      search.get("trainer_id") ?? undefined,
      search.get("exclude_reservation_id") ?? undefined,
    )
    return json(200, { date: search.get("date"), slots })
  }
  const availabilityDates = pathname.match(/^\/api\/s\/([^/]+)\/availability-dates$/)
  if (availabilityDates && method === "GET") {
    const from = search.get("from_date") ?? ""
    const to = search.get("to_date") ?? ""
    const dates: string[] = []
    if (from && to) {
      for (let cursor = from; cursor <= to; cursor = addDaysKey(cursor, 1)) {
        const slots = availabilitySlots(
          state,
          cursor,
          search.get("menu_id") ?? "",
          search.get("trainer_id") ?? undefined,
          search.get("exclude_reservation_id") ?? undefined,
        )
        if (slots.some((slot) => slot.selectable)) dates.push(cursor)
        if (dates.length > 40) break
      }
    }
    return json(200, { dates })
  }
  const bookingRules = pathname.match(/^\/api\/s\/([^/]+)\/booking-rules$/)
  if ((bookingRules || pathname === "/api/my/booking-rules") && method === "GET") {
    const rules = state.booking_rules
    return json(200, {
      allow_same_day: rules.allow_same_day,
      booking_deadline_minutes: rules.booking_deadline_minutes,
      cancellation_deadline_hours: rules.cancellation_deadline_hours,
      max_advance_days: rules.max_advance_days,
      slot_increment_minutes: rules.slot_increment_minutes,
    })
  }

  const login = pathname.match(/^\/api\/s\/([^/]+)\/auth\/login$/)
  if (login && method === "POST") {
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")
    const customer = state.customers.find((item) => item.email.toLowerCase() === email && item.password === password)
    if (!customer) return json(401, { detail: "メールアドレスまたはパスワードが違います。" })
    setCustomerSession(customer.user_id)
    return json(200, { message: "ok", user_id: customer.user_id, name: customer.name })
  }
  const register = pathname.match(/^\/api\/s\/([^/]+)\/auth\/register$/)
  if (register && method === "POST") {
    const email = String(body.email ?? "").trim().toLowerCase()
    if (state.customers.some((item) => item.email.toLowerCase() === email)) {
      return json(409, { detail: "already registered" })
    }
    const customer = {
      user_id: demoId("user"),
      email,
      password: String(body.password ?? ""),
      name: String(body.name ?? ""),
      phone: String(body.phone ?? ""),
    }
    updateDemoState((draft) => {
      draft.customers.push(customer)
    })
    setCustomerSession(customer.user_id)
    return json(200, { message: "ok", user_id: customer.user_id, name: customer.name })
  }
  if (pathname.endsWith("/auth/line/url")) {
    return json(400, { detail: "デモではLINEログインを使えません。" })
  }
  if (pathname === "/api/auth/me" && method === "GET") {
    const userId = customerSession()
    const customer = state.customers.find((item) => item.user_id === userId)
    if (!customer) return json(401, { detail: "unauthorized" })
    return json(200, { user_id: customer.user_id, name: customer.name, email: customer.email })
  }

  const otpRequest = pathname.match(/^\/api\/s\/([^/]+)\/reservations\/lookup\/request-otp$/)
  if (otpRequest && method === "POST") {
    const email = body.email ? String(body.email).trim() : undefined
    const phone = body.phone ? String(body.phone).trim() : undefined
    const found = state.reservations.some((reservation) => contactMatches(reservation, email, phone))
    if (!found) return json(404, { detail: "該当する予約が見つかりません。デモのお客様は guest@kisaragi.example です。" })
    const challengeId = demoId("otp")
    updateDemoState((draft) => {
      draft.otpChallenges[challengeId] = { email, phone }
    })
    return json(200, {
      challenge_id: challengeId,
      masked_destination: email ? email.replace(/^(.).+(@.*)$/, "$1***$2") : "電話番号",
      message: `デモの確認コードは ${DEMO_OTP_CODE} です。`,
    })
  }
  const otpVerify = pathname.match(/^\/api\/s\/([^/]+)\/reservations\/lookup\/verify-otp$/)
  if (otpVerify && method === "POST") {
    const challenge = state.otpChallenges[String(body.challenge_id ?? "")]
    if (!challenge) return json(404, { detail: "認証コードの有効期限が切れました。" })
    if (String(body.code ?? "") !== DEMO_OTP_CODE) return json(400, { detail: `確認コードが違います。デモでは ${DEMO_OTP_CODE} を入力してください。` })
    const token = demoId("lookup")
    updateDemoState((draft) => {
      draft.lookupTokens[token] = challenge
    })
    return json(200, { lookup_token: token, expires_in_minutes: 30 })
  }
  const lookup = pathname.match(/^\/api\/s\/([^/]+)\/reservations\/lookup$/)
  if (lookup && method === "GET") {
    const token = header(init, "Authorization").replace(/^Bearer\s+/i, "")
    const contact = state.lookupTokens[token]
    if (!contact) return json(401, { detail: "予約照会の認証が必要です。" })
    const rows = state.reservations.filter((reservation) => contactMatches(reservation, contact.email, contact.phone))
    return json(200, rows.map(detailOf))
  }

  const publicCancel = pathname.match(/^\/api\/s\/([^/]+)\/reservations\/([^/]+)\/cancel$/)
  if (publicCancel && method === "POST") {
    let updated: DemoReservation | undefined
    updateDemoState((draft) => {
      updated = draft.reservations.find((item) => item.confirmation_token === publicCancel[2])
      if (updated) updated.status = "CANCELED"
    })
    if (!updated) return json(404, { detail: "not found" })
    return json(200, detailOf(updated))
  }
  const publicReservation = pathname.match(/^\/api\/s\/([^/]+)\/reservations\/([^/]+)$/)
  if (publicReservation && method === "GET") {
    const reservation = state.reservations.find((item) => item.confirmation_token === publicReservation[2])
    if (!reservation) return json(404, { detail: "not found" })
    return json(200, detailOf(reservation))
  }
  if (publicReservation && method === "PUT") {
    let updated: DemoReservation | undefined
    updateDemoState((draft) => {
      updated = draft.reservations.find((item) => item.confirmation_token === publicReservation[2])
      if (updated) applyReservationPatch(draft, updated, body)
    })
    if (!updated) return json(404, { detail: "not found" })
    return json(200, detailOf(updated))
  }
  const publicCreate = pathname.match(/^\/api\/s\/([^/]+)\/reservations$/)
  if (publicCreate && method === "POST") {
    let created: DemoReservation | undefined
    updateDemoState((draft) => {
      created = createReservation(draft, body, "web")
    })
    if (!created) return json(500, { detail: "予約を作成できませんでした。" })
    return json(200, {
      reservation_id: created.reservation_id,
      menu_id: created.menu_id,
      menu_name: created.menu_name,
      start_at: created.start_at,
      customer_name: created.customer_name,
      customer_email: created.customer_email,
      customer_phone: created.customer_phone,
      notes: created.notes,
      status: created.status,
      confirmation_token: created.confirmation_token,
    })
  }

  if (pathname === "/api/my/reservation-policies" && method === "GET") {
    return json(200, {
      cancellation: {
        title: "キャンセルポリシー",
        summary: state.salon.cancellation_policy_text,
        detail_lines: [
          "開始24時間前までキャンセルできます。",
          "当日キャンセルはお店へご連絡ください。",
          "無断キャンセルが続く場合は次回以降の予約をお受けできないことがあります。",
        ],
        cutoff_hours: state.booking_rules.cancellation_deadline_hours,
      },
      change: {
        title: "予約変更",
        summary: "開始24時間前まで日時を変更できます。",
        detail_lines: ["変更できるのは日時のみです。", "スタイリストとメニューの変更はお店へご連絡ください。"],
        cutoff_hours: state.booking_rules.cancellation_deadline_hours,
      },
    })
  }

  const myCancel = pathname.match(/^\/api\/my\/reservations\/([^/]+)\/cancel$/)
  if (myCancel && method === "POST") {
    let updated: DemoReservation | undefined
    updateDemoState((draft) => {
      updated = draft.reservations.find((item) => item.reservation_id === myCancel[1])
      if (updated) updated.status = "CANCELED"
    })
    if (!updated) return json(404, { detail: "not found" })
    return json(200, detailOf(updated))
  }
  const myReservation = pathname.match(/^\/api\/my\/reservations\/([^/]+)$/)
  if (myReservation && method === "GET") {
    const reservation = state.reservations.find((item) => item.reservation_id === myReservation[1])
    if (!reservation) return json(404, { detail: "not found" })
    return json(200, detailOf(reservation))
  }
  if (myReservation && method === "PUT") {
    let updated: DemoReservation | undefined
    updateDemoState((draft) => {
      updated = draft.reservations.find((item) => item.reservation_id === myReservation[1])
      if (updated) applyReservationPatch(draft, updated, body)
    })
    if (!updated) return json(404, { detail: "not found" })
    return json(200, detailOf(updated))
  }

  if (pathname.startsWith("/api/payments/")) {
    return json(400, { detail: "デモでは当日払いを選択してください。" })
  }

  if (pathname.startsWith("/api/admin/")) return json(200, {})
  return json(404, { detail: "not found" })
}
