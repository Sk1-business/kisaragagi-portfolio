import { ApiClientError, apiRequest } from "@/lib/apiClient"

export type ReservationStatus = "upcoming" | "past" | "cancelled"

export interface UserReservation {
  id: string
  date: string
  time: string
  mode: string
  trainerId: string | null
  trainerName: string | null
  status: ReservationStatus
  note: string
  confirmationToken?: string
  menuId?: string
  menuName?: string
}

export interface CancellationPolicy {
  title: string
  summary: string
  detailLines: string[]
  cutoffHours: number | null
}

export interface CancellationEvaluation {
  canCancel: boolean
  reason?: string
}

export interface ReservationChangePolicy {
  title: string
  summary: string
  detailLines: string[]
  cutoffHours: number | null
}

export interface ReservationChangeEvaluation {
  canUpdate: boolean
  reason?: string
}

const RESERVATION_STORAGE_KEY = "user:reservations:v2"
const CANCELLATION_POLICY_STORAGE_KEY = "user:cancellation-policy:v2"
const RESERVATION_CHANGE_POLICY_STORAGE_KEY = "user:reservation-change-policy:v2"

interface StoredReservationMeta {
  id: string
  confirmationToken: string
  mode: string
  trainerId: string | null
  trainerName: string | null
  note: string
  menuId?: string
}

interface MenuResponse {
  menu_id: string
  name: string
}

interface ReservationOutResponse {
  reservation_id: string
  menu_id: string
  menu_name: string | null
  start_at: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  notes: string | null
  status: string
  confirmation_token: string | null
}

interface ReservationDetailResponse {
  reservation_id: string
  menu_name: string
  start_at: string
  notes: string | null
  status: string
  can_cancel: boolean
}

interface AvailabilityResponse {
  date: string
  slots: { start_at: string }[]
}

const DEFAULT_CANCELLATION_POLICY: CancellationPolicy = {
  title: "キャンセルポリシー",
  summary: "現在の開発環境では暫定ポリシーを表示しています。",
  detailLines: [
    "開始24時間前までキャンセル可能（暫定）",
    "当日キャンセルはキャンセル不可（暫定）",
    "キャンセル料の詳細は正式ポリシー反映時に更新されます",
  ],
  cutoffHours: 24,
}

const DEFAULT_RESERVATION_CHANGE_POLICY: ReservationChangePolicy = {
  title: "予約変更ポリシー",
  summary: "現在の開発環境では暫定ポリシーを表示しています。",
  detailLines: [
    "開始24時間前まで日時変更可能（暫定）",
    "当日予約の変更はできません（暫定）",
    "正式な変更ルールは今後反映予定です",
  ],
  cutoffHours: 24,
}

function safeReadStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeWriteStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures in development fallback mode.
  }
}

function toDateAndTime(startAtIso: string) {
  const parsed = new Date(startAtIso)
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear()
    const month = String(parsed.getMonth() + 1).padStart(2, "0")
    const day = String(parsed.getDate()).padStart(2, "0")
    const hours = String(parsed.getHours()).padStart(2, "0")
    const minutes = String(parsed.getMinutes()).padStart(2, "0")
    return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`,
    }
  }

  return {
    date: startAtIso.slice(0, 10),
    time: startAtIso.slice(11, 16),
  }
}

function toStatus(status: string): ReservationStatus {
  if (status === "BOOKED") return "upcoming"
  if (status === "CANCELED") return "cancelled"
  return "past"
}

function toReservation(
  detail: ReservationDetailResponse,
  meta: StoredReservationMeta,
  fallbackMenuName?: string,
): UserReservation {
  const { date, time } = toDateAndTime(detail.start_at)
  return {
    id: detail.reservation_id,
    date,
    time,
    mode: meta.mode,
    trainerId: meta.trainerId,
    trainerName: meta.trainerName,
    status: toStatus(detail.status),
    note: detail.notes ?? meta.note,
    confirmationToken: meta.confirmationToken,
    menuId: meta.menuId,
    menuName: fallbackMenuName,
  }
}

function loadReservationMeta() {
  const stored = safeReadStorage<StoredReservationMeta[]>(RESERVATION_STORAGE_KEY)
  if (stored && Array.isArray(stored)) {
    return stored.filter(
      (item) =>
        typeof item?.id === "string" &&
        typeof item?.confirmationToken === "string" &&
        item.confirmationToken.length > 0,
    )
  }
  safeWriteStorage(RESERVATION_STORAGE_KEY, [])
  return []
}

function saveReservationMeta(meta: StoredReservationMeta[]) {
  safeWriteStorage(RESERVATION_STORAGE_KEY, meta)
}

function toReservationStart(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

function toReservationStartIso(date: string, time: string) {
  return `${date}T${time}:00+09:00`
}

async function resolveDefaultMenu() {
  const menus = await apiRequest<MenuResponse[]>("/api/menus")
  const firstMenu = menus[0]
  if (!firstMenu) {
    throw new Error("予約可能なメニューが見つかりませんでした。")
  }
  return firstMenu
}

export async function fetchUserReservations(): Promise<UserReservation[]> {
  const allMeta = loadReservationMeta()
  if (allMeta.length === 0) return []

  const reservations = await Promise.all(
    allMeta.map(async (meta) => {
      try {
        const detail = await apiRequest<ReservationDetailResponse>(
          `/api/reservations/${meta.confirmationToken}`,
        )
        return toReservation(detail, meta)
      } catch {
        return null
      }
    }),
  )

  return reservations
    .filter((reservation): reservation is UserReservation => reservation !== null)
    .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
}

export async function fetchUserReservationById(
  reservationId: string,
): Promise<UserReservation | null> {
  const meta = loadReservationMeta().find((item) => item.id === reservationId)
  if (!meta) return null

  try {
    const detail = await apiRequest<ReservationDetailResponse>(
      `/api/reservations/${meta.confirmationToken}`,
    )
    return toReservation(detail, meta)
  } catch {
    return null
  }
}

export async function fetchCancellationPolicy(): Promise<CancellationPolicy> {
  // Future: replace this storage-based fallback with real API fetch.
  const stored = safeReadStorage<CancellationPolicy>(CANCELLATION_POLICY_STORAGE_KEY)
  if (stored) {
    return Promise.resolve(stored)
  }
  safeWriteStorage(CANCELLATION_POLICY_STORAGE_KEY, DEFAULT_CANCELLATION_POLICY)
  return Promise.resolve(DEFAULT_CANCELLATION_POLICY)
}

export function evaluateReservationCancellation(
  reservation: UserReservation,
  policy: CancellationPolicy,
  nowDate = new Date(),
): CancellationEvaluation {
  if (reservation.status !== "upcoming") {
    return { canCancel: false, reason: "この予約はキャンセル対象ではありません。" }
  }

  if (policy.cutoffHours === null) {
    return { canCancel: true }
  }

  const reservationStart = toReservationStart(reservation.date, reservation.time)
  const cutoff = reservationStart.getTime() - policy.cutoffHours * 60 * 60 * 1000
  if (nowDate.getTime() > cutoff) {
    return {
      canCancel: false,
      reason: `開始${policy.cutoffHours}時間前を過ぎているためキャンセルできません。`,
    }
  }

  return { canCancel: true }
}

export async function fetchReservationChangePolicy(): Promise<ReservationChangePolicy> {
  // Future: replace this storage-based fallback with real API fetch.
  const stored = safeReadStorage<ReservationChangePolicy>(RESERVATION_CHANGE_POLICY_STORAGE_KEY)
  if (stored) {
    return Promise.resolve(stored)
  }
  safeWriteStorage(RESERVATION_CHANGE_POLICY_STORAGE_KEY, DEFAULT_RESERVATION_CHANGE_POLICY)
  return Promise.resolve(DEFAULT_RESERVATION_CHANGE_POLICY)
}

export function evaluateReservationUpdate(
  reservation: UserReservation,
  policy: ReservationChangePolicy,
  nowDate = new Date(),
): ReservationChangeEvaluation {
  if (reservation.status !== "upcoming") {
    return { canUpdate: false, reason: "この予約は変更対象ではありません。" }
  }

  if (policy.cutoffHours === null) {
    return { canUpdate: true }
  }

  const reservationStart = toReservationStart(reservation.date, reservation.time)
  const cutoff = reservationStart.getTime() - policy.cutoffHours * 60 * 60 * 1000
  if (nowDate.getTime() > cutoff) {
    return {
      canUpdate: false,
      reason: `開始${policy.cutoffHours}時間前を過ぎているため予約変更できません。`,
    }
  }

  return { canUpdate: true }
}

export async function cancelUserReservation(
  reservationId: string,
): Promise<{ ok: true; reservation: UserReservation } | { ok: false; error: string }> {
  const allMeta = loadReservationMeta()
  const targetMeta = allMeta.find((reservation) => reservation.id === reservationId)
  if (!targetMeta) {
    return Promise.resolve({ ok: false, error: "予約が見つかりませんでした。" })
  }

  try {
    const detail = await apiRequest<ReservationDetailResponse>(
      `/api/reservations/${targetMeta.confirmationToken}/cancel`,
      {
        method: "POST",
        body: {},
      },
    )
    const updated = toReservation(detail, targetMeta)
    return { ok: true, reservation: updated }
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "予約キャンセルに失敗しました。" }
  }
}

interface UpdateReservationPayload {
  reservationId: string
  date: string
  time: string
  mode: string
  trainerId: string | null
  trainerName: string | null
  note: string
  fullName?: string
  email?: string
  phone?: string
}

export async function updateUserReservation(
  payload: UpdateReservationPayload,
): Promise<{ ok: true; reservation: UserReservation } | { ok: false; error: string }> {
  const allMeta = loadReservationMeta()
  const targetMeta = allMeta.find((reservation) => reservation.id === payload.reservationId)
  if (!targetMeta) {
    return Promise.resolve({ ok: false, error: "変更対象の予約が見つかりませんでした。" })
  }

  const targetReservation = await fetchUserReservationById(payload.reservationId)
  if (!targetReservation || targetReservation.status !== "upcoming") {
    return Promise.resolve({ ok: false, error: "この予約は変更できません。" })
  }

  const policy = await fetchReservationChangePolicy()
  const evaluation = evaluateReservationUpdate(targetReservation, policy)
  if (!evaluation.canUpdate) {
    return Promise.resolve({
      ok: false,
      error: evaluation.reason ?? "予約変更ポリシーにより予約変更できません。",
    })
  }

  // Backend has no direct customer reservation update endpoint.
  // We cancel the existing reservation and create a new one as replacement.
  const cancelResult = await cancelUserReservation(payload.reservationId)
  if (!cancelResult.ok) {
    return Promise.resolve({ ok: false, error: cancelResult.error })
  }

  const createResult = await createUserReservation({
    date: payload.date,
    time: payload.time,
    mode: payload.mode,
    trainerId: payload.trainerId,
    trainerName: payload.trainerName,
    note: payload.note,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone,
    preferredMenuId: targetMeta.menuId,
  })
  if (!createResult.ok) {
    return Promise.resolve({ ok: false, error: createResult.error })
  }

  const nextMeta = loadReservationMeta().filter((item) => item.id !== payload.reservationId)
  saveReservationMeta(nextMeta)

  return Promise.resolve({ ok: true, reservation: createResult.reservation })
}

interface CreateReservationPayload {
  date: string
  time: string
  mode: string
  trainerId: string | null
  trainerName: string | null
  note: string
  fullName?: string
  email?: string
  phone?: string
  preferredMenuId?: string
}

export async function createUserReservation(
  payload: CreateReservationPayload,
): Promise<{ ok: true; reservation: UserReservation } | { ok: false; error: string }> {
  try {
    const menu = payload.preferredMenuId
      ? { menu_id: payload.preferredMenuId, name: "" }
      : await resolveDefaultMenu()

    const data = await apiRequest<ReservationOutResponse>("/api/reservations", {
      method: "POST",
      body: {
        menu_id: menu.menu_id,
        start_at: toReservationStartIso(payload.date, payload.time),
        customer_name: payload.fullName || undefined,
        customer_email: payload.email || undefined,
        customer_phone: payload.phone || undefined,
        notes: payload.note || undefined,
      },
    })

    if (!data.confirmation_token) {
      return { ok: false, error: "予約確認トークンを取得できませんでした。" }
    }

    const meta = loadReservationMeta()
    const nextMeta: StoredReservationMeta[] = [
      {
        id: data.reservation_id,
        confirmationToken: data.confirmation_token,
        mode: payload.mode,
        trainerId: payload.trainerId,
        trainerName: payload.trainerName,
        note: payload.note,
        menuId: data.menu_id,
      },
      ...meta.filter((item) => item.id !== data.reservation_id),
    ]
    saveReservationMeta(nextMeta)

    const detail = await apiRequest<ReservationDetailResponse>(
      `/api/reservations/${data.confirmation_token}`,
    )
    return {
      ok: true,
      reservation: toReservation(detail, nextMeta[0], data.menu_name ?? undefined),
    }
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "予約作成に失敗しました。" }
  }
}

export async function fetchAvailableTimeSlots(date: string): Promise<string[]> {
  if (!date) return []
  const menu = await resolveDefaultMenu()
  const data = await apiRequest<AvailabilityResponse>(
    `/api/availability?menu_id=${encodeURIComponent(menu.menu_id)}&date=${encodeURIComponent(date)}`,
  )
  return data.slots.map((slot) => slot.start_at.slice(11, 16))
}
