import { AdminWelcomeCard } from "@/features/admin/components/AdminWelcomeCard"
import { TodayReservationsCard } from "@/features/admin/components/TodayReservationsCard"
import { useAdminReservations } from "@/features/admin/context/AdminReservationsContext"
import { useAdminDashboardSummary } from "@/features/admin/hooks/useAdminDashboardSummary"
import { useStaff } from "@/features/admin/hooks/useStaff"
import { getReservationsForDay, startOfDay } from "@/features/admin/lib/calendarUtils"

export function AdminDashboardPage() {
  const summary = useAdminDashboardSummary()
  const { reservations, loading } = useAdminReservations()
  const { staffList, loading: staffLoading } = useStaff()

  const todayReservations = getReservationsForDay(
    reservations,
    startOfDay(new Date()),
  )

  if (!summary || loading || staffLoading) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  return (
    <div className="space-y-6">
      <AdminWelcomeCard summary={summary} />
      <TodayReservationsCard
        reservations={todayReservations}
        staffList={staffList}
      />
    </div>
  )
}
