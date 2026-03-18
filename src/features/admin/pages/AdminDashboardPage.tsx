import { useEffect, useMemo, useState } from "react"
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
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  /** 終了済み予約を定期的に一覧から外す */
  const [nowTick, setNowTick] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const todayReservations = useMemo(() => {
    return getReservationsForDay(reservations, startOfDay(new Date())).filter(
      (r) => new Date(r.endAt).getTime() > nowTick,
    )
  }, [reservations, nowTick])

  useEffect(() => {
    if (!loading && !staffLoading && summary) {
      setLastUpdated(new Date())
    }
  }, [loading, staffLoading, summary, reservations])

  if (!summary || loading || staffLoading) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  const updatedLabel =
    lastUpdated?.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) ?? ""

  return (
    <div className="space-y-6">
      <AdminWelcomeCard summary={summary} />
      <TodayReservationsCard
        reservations={todayReservations}
        staffList={staffList}
        updatedAtLabel={updatedLabel || undefined}
      />
    </div>
  )
}
