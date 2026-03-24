const SHOP_ID_QUERY_KEY = "shopId"
const LAST_SHOP_SLUG_KEY = "customer:last-shop-slug"

function readFromSessionStorage(): string | undefined {
  if (typeof window === "undefined") return undefined
  const value = window.sessionStorage.getItem(LAST_SHOP_SLUG_KEY)
  return value?.trim() || undefined
}

export function persistShopSlug(shopSlug?: string) {
  if (typeof window === "undefined") return
  const nextValue = shopSlug?.trim()
  if (!nextValue) return
  window.sessionStorage.setItem(LAST_SHOP_SLUG_KEY, nextValue)
}

export function readShopSlugFromLocation(): string | undefined {
  if (typeof window === "undefined") return undefined
  const params = new URLSearchParams(window.location.search)
  const value = params.get(SHOP_ID_QUERY_KEY)
  return value?.trim() || undefined
}

export function resolveShopSlug(shopSlug?: string): string | undefined {
  const resolved = shopSlug?.trim() || readShopSlugFromLocation() || readFromSessionStorage()
  if (resolved) {
    persistShopSlug(resolved)
  }
  return resolved
}

export function buildSalonApiPath(shopSlug: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `/api/s/${encodeURIComponent(shopSlug)}${normalizedPath}`
}
