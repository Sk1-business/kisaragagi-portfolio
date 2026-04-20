import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/constants/routes"
import { AdminWelcomeCard } from "@/features/admin/components/AdminWelcomeCard"
import { TodayReservationsCard } from "@/features/admin/components/TodayReservationsCard"
import { fetchAdminReservations } from "@/features/admin/api/reservationsApi"
import { useAdminDashboardSummary } from "@/features/admin/hooks/useAdminDashboardSummary"
import { useStaff } from "@/features/admin/hooks/useStaff"
import {
  ADMIN_CALENDAR_TIME_ZONE,
  getDateKeyInTimeZone,
  getIsoDateKeyInTimeZone,
} from "@/features/admin/lib/calendarUtils"
import type { Reservation } from "@/features/admin/types/reservation"

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const summary = useAdminDashboardSummary()
  const { staffList, loading: staffLoading } = useStaff()
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  /** 終了済み予約を定期的に一覧から外す */
  const [nowTick, setNowTick] = useState(() => Date.now())
  const [todaySource, setTodaySource] = useState<Reservation[]>([])
  const [todayFetchLoading, setTodayFetchLoading] = useState(true)

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (staffLoading) return
    let cancelled = false
    void (async () => {
      setTodayFetchLoading(true)
      try {
        const jstKey = getDateKeyInTimeZone(new Date(), ADMIN_CALENDAR_TIME_ZONE)
        const list = await fetchAdminReservations(staffList, {
          viewMode: "day",
          anchorDate: new Date(),
          dateKeyOverride: jstKey,
        })
        if (cancelled) return
        const onlyToday = list.filter(
          (r) =>
            getIsoDateKeyInTimeZone(r.startAt, ADMIN_CALENDAR_TIME_ZONE) ===
              jstKey && r.status === "CONFIRMED",
        )
        setTodaySource(onlyToday)
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setTodaySource([])
      } finally {
        if (!cancelled) setTodayFetchLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [staffList, staffLoading, navigate])

  const todayReservations = useMemo(() => {
    return todaySource.filter((r) => new Date(r.endAt).getTime() > nowTick)
  }, [todaySource, nowTick])

  useEffect(() => {
    if (!todayFetchLoading && !staffLoading && summary) {
      setLastUpdated(new Date())
    }
  }, [todayFetchLoading, staffLoading, summary])

  if (!summary || staffLoading || todayFetchLoading) {
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
      timeZone: ADMIN_CALENDAR_TIME_ZONE,
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
