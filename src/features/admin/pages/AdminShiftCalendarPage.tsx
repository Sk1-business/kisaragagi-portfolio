import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  fetchAdminSettings,
  type BusinessHoursItem,
} from "@/features/admin/api/adminSettingsApi"
import { fetchAdminReservations } from "@/features/admin/api/reservationsApi"
import { useAdminReservations } from "@/features/admin/context/AdminReservationsContext"
import { useTrainerShiftsForMonth } from "@/features/admin/hooks/useTrainerShiftsForMonth"
import { useStaff } from "@/features/admin/hooks/useStaff"
import { ShiftCalendarMonthView } from "@/features/admin/components/calendar/ShiftCalendarMonthView"
import { addMonths, startOfDay } from "@/features/admin/lib/calendarUtils"
import { ROUTES } from "@/constants/routes"

export function AdminShiftCalendarPage() {
  const navigate = useNavigate()
  const { staffList, loading: staffLoading } = useStaff()
  const { reservations, replaceReservations } = useAdminReservations()
  const [reservationsLoading, setReservationsLoading] = useState(true)
  const [reservationsFetchFailed, setReservationsFetchFailed] = useState(false)
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()))
  const [businessHoursItems, setBusinessHoursItems] = useState<BusinessHoursItem[]>([])
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [settingsError, setSettingsError] = useState(false)

  const { loading: shiftsLoading, error: shiftsError, refetch } = useTrainerShiftsForMonth(
    staffList,
    currentDate,
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setSettingsLoading(true)
      setSettingsError(false)
      try {
        const s = await fetchAdminSettings()
        if (!cancelled) setBusinessHoursItems(s.business_hours)
      } catch {
        if (!cancelled) setSettingsError(true)
      } finally {
        if (!cancelled) setSettingsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (staffLoading) return
    let cancelled = false
    void (async () => {
      setReservationsLoading(true)
      setReservationsFetchFailed(false)
      try {
        const list = await fetchAdminReservations(staffList, {
          viewMode: "month",
          anchorDate: currentDate,
        })
        if (cancelled) return
        replaceReservations(list)
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setReservationsFetchFailed(true)
      } finally {
        if (!cancelled) setReservationsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [staffLoading, staffList, replaceReservations, navigate, currentDate])

  const goPrev = () => {
    setCurrentDate((d) => addMonths(d, -1))
  }

  const goNext = () => {
    setCurrentDate((d) => addMonths(d, 1))
  }

  const goToday = () => {
    setCurrentDate(startOfDay(new Date()))
  }

  const titleMonth = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`

  if (staffLoading || (staffList.length > 0 && shiftsLoading)) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-border shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">シフトカレンダー</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              シフトは{" "}
              <span className="font-mono text-xs">GET /api/admin/trainers/&#123;trainer_id&#125;/shifts</span>{" "}
              で取得した <span className="font-mono text-xs">trainer_shifts</span> を表示します。
              編集時の勤務時間は{" "}
              <span className="font-mono text-xs">GET /api/admin/settings</span> の営業時間内に制限されます。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={goPrev}
                aria-label="前の月へ"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-[120px]"
                onClick={goToday}
              >
                {titleMonth}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={goNext}
                aria-label="次の月へ"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {settingsError ? (
            <p className="mb-4 rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              営業時間（GET /api/admin/settings）の取得に失敗しました。シフトの保存時は営業時間内に収まる必要があります。
            </p>
          ) : null}
          {shiftsError ? (
            <p className="py-8 text-center text-sm text-destructive">
              シフト一覧の取得に失敗しました。ネットワークまたはサーバーを確認してください。
            </p>
          ) : staffList.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              スタッフが登録されていません。スタッフ管理から担当者を追加してください。
            </p>
          ) : (
            <ShiftCalendarMonthView
              date={currentDate}
              staffList={staffList}
              businessHoursItems={businessHoursItems}
              settingsLoading={settingsLoading}
              reservations={reservations}
              reservationsLoading={reservationsLoading}
              reservationsFetchFailed={reservationsFetchFailed}
              refetchShifts={refetch}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
