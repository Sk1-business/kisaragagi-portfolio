import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"

import { resolveShopSlug } from "@/lib/shopSlug"

export function useShopId(): string | undefined {
  const [params] = useSearchParams()
  return useMemo(() => {
    const slug = resolveShopSlug(params.get("shopId") ?? undefined)
    return slug ?? undefined
  }, [params])
}

export function buildPathWithShopId(path: string, shopId: string | null | undefined): string {
  if (!shopId) return path
  const sep = path.includes("?") ? "&" : "?"
  return `${path}${sep}shopId=${encodeURIComponent(shopId)}`
}
