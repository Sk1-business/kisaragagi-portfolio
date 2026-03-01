import { AdminWelcomeCard } from "@/features/admin/components/AdminWelcomeCard"
import { useAdminDashboardSummary } from "@/features/admin/hooks/useAdminDashboardSummary"

export function AdminDashboardPage() {
  const summary = useAdminDashboardSummary()

  if (!summary) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  return <AdminWelcomeCard summary={summary} />
}
