import { useSyncExternalStore } from "react"

/** userReservationApi と同じキー（最新の予約 ID を参照するため） */
const RESERVATION_META_KEY = "user:reservations:v2"
const UPDATE_INTENT_KEY = "saas_reservation_update_intent"

function readLatestReservationId(): string {
  try {
    const raw = localStorage.getItem(RESERVATION_META_KEY)
    if (!raw) return ""
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return ""
    for (let i = parsed.length - 1; i >= 0; i--) {
      const item = parsed[i] as { id?: unknown }
      if (typeof item?.id === "string" && item.id.length > 0) return item.id
    }
    return ""
  } catch {
    return ""
  }
}

function subscribeReservationMeta(onStoreChange: () => void) {
  function onStorage(e: StorageEvent) {
    if (e.key === RESERVATION_META_KEY || e.key === null) onStoreChange()
  }
  window.addEventListener("storage", onStorage)
  const id = window.setInterval(onStoreChange, 2000)
  return () => {
    window.removeEventListener("storage", onStorage)
    window.clearInterval(id)
  }
}

export function usePersistentReservationId(): string {
  return useSyncExternalStore(subscribeReservationMeta, readLatestReservationId, () => "")
}

export function setReservationUpdateIntent(value: boolean): void {
  try {
    if (value) localStorage.setItem(UPDATE_INTENT_KEY, "1")
    else localStorage.removeItem(UPDATE_INTENT_KEY)
  } catch {
    /* ignore */
  }
}

export function readReservationUpdateIntent(): boolean {
  try {
    return localStorage.getItem(UPDATE_INTENT_KEY) === "1"
  } catch {
    return false
  }
}

export function clearReservationUpdateIntent(): void {
  try {
    localStorage.removeItem(UPDATE_INTENT_KEY)
  } catch {
    /* ignore */
  }
}
