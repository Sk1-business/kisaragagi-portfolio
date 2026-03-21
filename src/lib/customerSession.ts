/**
 * 予約者ポータル用セッション（HttpOnly Cookie + クライアント側の無操作・401 検知）
 */

export type CustomerSessionInvalidSource = "idle" | "unauthorized"

type Listener = (source: CustomerSessionInvalidSource) => void

const listeners = new Set<Listener>()

export function subscribeCustomerSessionInvalidated(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function invalidateCustomerSession(source: CustomerSessionInvalidSource): void {
  listeners.forEach((fn) => {
    fn(source)
  })
}

/** ログアウト・セッション切れ時に予約フロー用のローカル状態を消す */
export function clearCustomerPortalClientCaches(): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem("user:last-reservation-id")
    window.sessionStorage.removeItem("user:last-reservation-update-intent")
  } catch {
    // ignore
  }
  try {
    window.localStorage.removeItem("user:profile:v2")
    window.localStorage.removeItem("user:reservations:v2")
  } catch {
    // ignore
  }
}

function pathShouldInvalidateCustomerSession(path: string): boolean {
  if (!path.startsWith("/api/")) return false
  if (path.startsWith("/api/auth/me")) return true
  if (path.startsWith("/api/my/")) return true
  return false
}

export function notifyUnauthorizedCustomerApi(path: string): void {
  if (pathShouldInvalidateCustomerSession(path)) {
    invalidateCustomerSession("unauthorized")
  }
}
