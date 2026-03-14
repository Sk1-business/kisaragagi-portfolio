import mockReservations from "@/features/user/api/mockReservations.json"

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

const RESERVATION_STORAGE_KEY = "user:reservations:v1"
const CANCELLATION_POLICY_STORAGE_KEY = "user:cancellation-policy:v1"
const RESERVATION_CHANGE_POLICY_STORAGE_KEY = "user:reservation-change-policy:v1"

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

function getDefaultReservations() {
  return [...(mockReservations as UserReservation[])]
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

function loadReservationsFromStorage() {
  const stored = safeReadStorage<UserReservation[]>(RESERVATION_STORAGE_KEY)
  if (stored && Array.isArray(stored)) {
    return stored
  }
  const seeded = getDefaultReservations()
  safeWriteStorage(RESERVATION_STORAGE_KEY, seeded)
  return seeded
}

function saveReservationsToStorage(reservations: UserReservation[]) {
  safeWriteStorage(RESERVATION_STORAGE_KEY, reservations)
}

function toReservationStart(date: string, time: string) {
  return new Date(`${date}T${time}:00`)
}

export async function fetchUserReservations(): Promise<UserReservation[]> {
  return Promise.resolve(loadReservationsFromStorage())
}

export async function fetchUserReservationById(
  reservationId: string,
): Promise<UserReservation | null> {
  const reservations = loadReservationsFromStorage()
  return Promise.resolve(reservations.find((reservation) => reservation.id === reservationId) ?? null)
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
  const reservations = loadReservationsFromStorage()
  const index = reservations.findIndex((reservation) => reservation.id === reservationId)
  if (index < 0) {
    return Promise.resolve({ ok: false, error: "予約が見つかりませんでした。" })
  }

  const target = reservations[index]
  if (target.status !== "upcoming") {
    return Promise.resolve({ ok: false, error: "この予約はキャンセルできません。" })
  }
  const policy = await fetchCancellationPolicy()
  const evaluation = evaluateReservationCancellation(target, policy)
  if (!evaluation.canCancel) {
    return Promise.resolve({
      ok: false,
      error: evaluation.reason ?? "キャンセルポリシーによりキャンセルできません。",
    })
  }

  const updated: UserReservation = { ...target, status: "cancelled" }
  reservations[index] = updated
  saveReservationsToStorage(reservations)

  return Promise.resolve({ ok: true, reservation: updated })
}

interface UpdateReservationPayload {
  reservationId: string
  date: string
  time: string
  mode: string
  trainerId: string | null
  trainerName: string | null
  note: string
}

export async function updateUserReservation(
  payload: UpdateReservationPayload,
): Promise<{ ok: true; reservation: UserReservation } | { ok: false; error: string }> {
  const reservations = loadReservationsFromStorage()
  const index = reservations.findIndex((reservation) => reservation.id === payload.reservationId)
  if (index < 0) {
    return Promise.resolve({ ok: false, error: "変更対象の予約が見つかりませんでした。" })
  }

  const target = reservations[index]
  if (target.status !== "upcoming") {
    return Promise.resolve({ ok: false, error: "この予約は変更できません。" })
  }

  const policy = await fetchReservationChangePolicy()
  const evaluation = evaluateReservationUpdate(target, policy)
  if (!evaluation.canUpdate) {
    return Promise.resolve({
      ok: false,
      error: evaluation.reason ?? "予約変更ポリシーにより予約変更できません。",
    })
  }

  const updated: UserReservation = {
    ...target,
    date: payload.date,
    time: payload.time,
    mode: payload.mode,
    trainerId: payload.trainerId,
    trainerName: payload.trainerName,
    note: payload.note,
  }
  reservations[index] = updated
  saveReservationsToStorage(reservations)

  return Promise.resolve({ ok: true, reservation: updated })
}
