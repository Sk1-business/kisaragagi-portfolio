import mockShops from "@/features/user/api/mockShops.json"
import type { UserDashboardSummary } from "@/features/user/types/userDashboard"

const DEFAULT_MESSAGE = "予約モードを選択して予約手続きへ進めます。"

interface MockShop {
  id: string
  name: string
  overview: string
  address: string
  businessHours: string
  imageUrl: string
}

const shops = mockShops as MockShop[]
const defaultShop = shops[0]

function resolveShop(shopId?: string) {
  const normalizedShopId = shopId?.trim()
  if (!normalizedShopId) {
    return { shop: defaultShop, isFallback: false }
  }

  const foundShop = shops.find((shop) => shop.id === normalizedShopId)
  if (foundShop) {
    return { shop: foundShop, isFallback: false }
  }

  return { shop: defaultShop, isFallback: true }
}

export async function fetchUserDashboardSummary(shopId?: string) {
  const { shop, isFallback } = resolveShop(shopId)
  const summary: UserDashboardSummary = {
    title: "店舗ダッシュボード",
    message: isFallback
      ? "指定した店舗が見つからないため、既定の店舗を表示しています。"
      : DEFAULT_MESSAGE,
    shopName: shop.name,
    shopOverview: shop.overview,
    shopAddress: shop.address,
    businessHours: shop.businessHours,
    shopImageUrl: shop.imageUrl,
  }

  return Promise.resolve(summary)
}
