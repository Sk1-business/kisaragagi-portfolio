import { useEffect, useRef } from "react"

import { invalidateCustomerSession } from "@/lib/customerSession"

const DEFAULT_IDLE_MS = 30 * 60 * 1000
/** mousemove 等の連打でタイマーを張り直しすぎない */
const ACTIVITY_THROTTLE_MS = 1000

function readIdleTimeoutMs(): number {
  const raw = import.meta.env.VITE_CUSTOMER_IDLE_TIMEOUT_MS
  if (raw === undefined || raw === "") return DEFAULT_IDLE_MS
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_IDLE_MS
}

/**
 * 予約者レイアウト内で無操作が続いたらセッション無効を通知（購読側でログアウト API + 遷移）
 */
export function useCustomerSessionIdleTimeout(enabled: boolean) {
  const idleMs = readIdleTimeoutMs()
  const timeoutRef = useRef<number | null>(null)
  const lastThrottleRef = useRef(0)

  useEffect(() => {
    if (!enabled || idleMs <= 0) return

    const windowEvents: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
    ]

    const clearTimer = () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const schedule = () => {
      clearTimer()
      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        invalidateCustomerSession("idle")
      }, idleMs)
    }

    const onActivity = () => {
      if (document.visibilityState === "hidden") return
      const now = Date.now()
      if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) return
      lastThrottleRef.current = now
      schedule()
    }

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        onActivity()
      }
    }

    windowEvents.forEach((eventName) => {
      window.addEventListener(eventName, onActivity, { passive: true })
    })
    document.addEventListener("visibilitychange", onVisibility)

    schedule()

    return () => {
      clearTimer()
      windowEvents.forEach((eventName) => {
        window.removeEventListener(eventName, onActivity)
      })
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [enabled, idleMs])
}
