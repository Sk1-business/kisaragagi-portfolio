import { apiRequest } from "@/lib/apiClient"
import type { UserDashboardSummary } from "@/features/user/types/userDashboard"

interface MenuResponse {
  menu_id: string
  name: string
  duration_minutes: number
  price: number
  description: string | null
  image_url: string | null
}

const DEFAULT_MESSAGE = "予約モードを選択して予約手続きへ進めます。"
const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80"

export async function fetchUserDashboardSummary(shopId?: string) {
  const menus = await apiRequest<MenuResponse[]>("/api/menus")
  const firstMenu = menus[0]
  const menuDescription = firstMenu?.description ?? "公開メニューからご希望の枠を選択できます。"
  const summary: UserDashboardSummary = {
    title: "予約ダッシュボード",
    message: firstMenu
      ? shopId
        ? `${DEFAULT_MESSAGE}（店舗ID: ${shopId}）`
        : DEFAULT_MESSAGE
      : "現在公開中のメニューがありません。",
    shopName: "Struct Salon",
    shopOverview: menuDescription,
    shopAddress: "予約ページからご利用ください",
    businessHours: "営業時間情報は準備中です",
    shopImageUrl: firstMenu?.image_url ?? DEFAULT_IMAGE_URL,
  }

  return summary
}
