import type { UserDashboardSummary } from "@/features/user/types/userDashboard"

export async function fetchUserDashboardSummary() {
  const summary: UserDashboardSummary = {
    title: "予約者画面です",
    message: "予約者向け機能を拡張してください。",
  }

  return Promise.resolve(summary)
}
