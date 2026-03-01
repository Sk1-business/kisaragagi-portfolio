import type { AdminDashboardSummary } from "@/features/admin/types/adminDashboard"

export async function fetchAdminDashboardSummary() {
  const summary: AdminDashboardSummary = {
    title: "管理者・スタッフ用ページです",
    message: "管理者向け機能を拡張してください。",
  }

  return Promise.resolve(summary)
}
