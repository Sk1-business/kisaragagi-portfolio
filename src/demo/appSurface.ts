import { isDemoMode } from "@/demo/demoMode"

export type AppSurface = "demo" | "customer" | "admin"

/** デモは両方。お客用本番は予約、管理用本番は店舗側だけを出す。 */
export function appSurface(): AppSurface {
  const value = import.meta.env.VITE_APP_SURFACE
  if (value === "customer" || value === "admin") return value
  return "demo"
}

export function showDemoHints(): boolean {
  return appSurface() === "demo" && isDemoMode()
}

/** 管理画面からお客様向け予約ページを開くときのURL。別ホストなら VITE_CUSTOMER_ORIGIN。 */
export function customerPublicUrl(path: string): string {
  const configured = String(import.meta.env.VITE_CUSTOMER_ORIGIN ?? "").replace(/\/$/, "")
  if (configured) return `${configured}${path}`
  if (typeof window === "undefined") return path
  return `${window.location.origin}${path}`
}
