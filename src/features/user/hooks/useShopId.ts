import { useSearchParams } from "react-router-dom"

import mockShops from "@/features/user/api/mockShops.json"

interface MockShop {
  id: string
  name: string
}

const shops = mockShops as MockShop[]
const defaultShop = shops[0]

export function resolveShopName(shopId?: string): string {
  if (!shopId) return defaultShop.name
  return shops.find((s) => s.id === shopId)?.name ?? defaultShop.name
}

export function useShopId() {
  const [searchParams] = useSearchParams()
  return searchParams.get("shopId") ?? undefined
}

export function buildPathWithShopId(
  basePath: string,
  shopId: string | undefined,
  extra?: Record<string, string>,
) {
  const params = new URLSearchParams()
  if (shopId) {
    params.set("shopId", shopId)
  }
  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      }
    })
  }
  const query = params.toString()
  return query ? `${basePath}?${query}` : basePath
}
