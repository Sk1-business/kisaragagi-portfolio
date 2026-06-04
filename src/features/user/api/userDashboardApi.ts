import { fetchSalonPage } from "@/features/user/api/userSalonApi"
import type { UserDashboardSummary } from "@/features/user/types/userDashboard"

const DEFAULT_MESSAGE = "予約モードを選択して予約手続きへ進めます。"
const DEFAULT_IMAGE_URL =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1400&q=80"

export async function fetchUserDashboardSummary(shopId?: string): Promise<UserDashboardSummary> {
  const page = await fetchSalonPage(shopId)
  const firstMenu = page.menus[0]
  return {
    title: "予約ダッシュボード",
    message: firstMenu ? DEFAULT_MESSAGE : "現在公開中のメニューがありません。",
    shopName: page.salon_name,
    shopOverview: page.description?.trim() || "概要情報は未設定です",
    shopAddress: page.address?.trim() || "住所情報は未設定です",
    businessHours: page.business_hours_summary?.trim() || "営業時間情報は未設定です",
    shopImageUrl: firstMenu?.image_url ?? DEFAULT_IMAGE_URL,
  }
}
