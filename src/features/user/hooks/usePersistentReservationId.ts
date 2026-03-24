import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const RESERVATION_ID_STORAGE_KEY = "user:last-reservation-id"
const RESERVATION_UPDATE_INTENT_KEY = "user:last-reservation-update-intent"

type LocationStateWithBooking = {
  reservationId?: string
  isUpdatingExistingReservation?: boolean
} | null

export function readReservationUpdateIntent(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.sessionStorage.getItem(RESERVATION_UPDATE_INTENT_KEY) === "1"
  } catch {
    return false
  }
}

export function clearReservationUpdateIntent() {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(RESERVATION_UPDATE_INTENT_KEY)
  } catch {
    // Ignore storage failures.
  }
}

function readStoredReservationId(): string {
  if (typeof window === "undefined") return ""
  try {
    return window.sessionStorage.getItem(RESERVATION_ID_STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

function persistReservationId(reservationId: string) {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(RESERVATION_ID_STORAGE_KEY, reservationId)
  } catch {
    // Ignore storage failures.
  }
}

export function usePersistentReservationId(): string {
  const location = useLocation()
  const fromState = ((location.state as LocationStateWithBooking)?.reservationId ?? "").trim()
  const stored = readStoredReservationId()
  const resolved = fromState || stored

  useEffect(() => {
    if (!fromState) return
    persistReservationId(fromState)
  }, [fromState])

  /** ルーター state がリロード等で消えても、予約変更フローの意図を残す */
  useEffect(() => {
    const st = location.state as LocationStateWithBooking
    if (!st || typeof st !== "object" || !("isUpdatingExistingReservation" in st)) return
    if (st.isUpdatingExistingReservation === true) {
      try {
        window.sessionStorage.setItem(RESERVATION_UPDATE_INTENT_KEY, "1")
      } catch {
        // Ignore storage failures.
      }
      return
    }
    if (st.isUpdatingExistingReservation === false) {
      clearReservationUpdateIntent()
    }
  }, [location.state])

  return resolved
}
