import { resolveShopSlug } from "@/lib/shopSlug"

export function resolveShopName(shopId?: string): string {
  if (!shopId) return "店舗"
  return "店舗"
}

export function useShopId() {
  return resolveShopSlug()
}

export function buildPathWithShopId(
  basePath: string,
  shopId: string | undefined,
  extra?: Record<string, string>,
) {
  // URLへ機微情報を載せないため、クエリは付与しない。
  void shopId
  void extra
  return basePath
}
