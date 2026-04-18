type SessionInvalidationListener = (reason: string) => void

const invalidationListeners = new Set<SessionInvalidationListener>()
const cacheClearers = new Set<() => void>()

export function registerCustomerPortalCacheClear(fn: () => void): () => void {
  cacheClearers.add(fn)
  return () => cacheClearers.delete(fn)
}

export function clearCustomerPortalClientCaches(): void {
  for (const fn of cacheClearers) {
    try {
      fn()
    } catch {
      /* ignore */
    }
  }
}

export function subscribeCustomerSessionInvalidation(
  listener: SessionInvalidationListener,
): () => void {
  invalidationListeners.add(listener)
  return () => invalidationListeners.delete(listener)
}

export function invalidateCustomerSession(reason: string): void {
  for (const listener of invalidationListeners) {
    try {
      listener(reason)
    } catch {
      /* ignore */
    }
  }
}

export function notifyUnauthorizedCustomerApi(path: string): void {
  void path
  invalidateCustomerSession("unauthorized")
}
