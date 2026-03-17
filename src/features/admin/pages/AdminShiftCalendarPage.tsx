import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAdminReservations } from "@/features/admin/context/AdminReservationsContext"
import { useStaff } from "@/features/admin/hooks/useStaff"
import { ROUTES } from "@/constants/routes"
import { CalendarDayView } from "@/features/admin/components/calendar/CalendarDayView"
import { CalendarWeekView } from "@/features/admin/components/calendar/CalendarWeekView"
import { CalendarMonthView } from "@/features/admin/components/calendar/CalendarMonthView"
import {
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  formatDateJa,
} from "@/features/admin/lib/calendarUtils"

type ViewMode = "day" | "week" | "month"

export function AdminShiftCalendarPage() {
  const { reservations, loading } = useAdminReservations()
  const { staffList, loading: staffLoading } = useStaff()
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()))
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null)

  useEffect(() => {
    if (staffList.length > 0 && selectedAssigneeId === null) {
      setSelectedAssigneeId(staffList[0].id)
    }
  }, [staffList, selectedAssigneeId])

  const filteredReservations =
    selectedAssigneeId == null
      ? reservations
      : reservations.filter((r) => r.assigneeId === selectedAssigneeId)

  const handleSelectReservation = (id: string) => {
    navigate(ROUTES.adminReservationDetail.replace(":id", id))
  }

  const goPrev = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, -1))
    else if (viewMode === "week") setCurrentDate((d) => addWeeks(d, -1))
    else setCurrentDate((d) => addMonths(d, -1))
  }

  const goNext = () => {
    if (viewMode === "day") setCurrentDate((d) => addDays(d, 1))
    else if (viewMode === "week") setCurrentDate((d) => addWeeks(d, 1))
    else setCurrentDate((d) => addMonths(d, 1))
  }

  const goToday = () => {
    setCurrentDate(startOfDay(new Date()))
  }

  const weekStart =
    viewMode === "week"
      ? (() => {
          const d = new Date(currentDate)
          const day = d.getDay()
          const diff = day === 0 ? -6 : 1 - day
          d.setDate(d.getDate() + diff)
          return d
        })()
      : null
  const weekEnd = weekStart ? addDays(weekStart, 6) : null

  const titleByMode =
    viewMode === "day"
      ? formatDateJa(currentDate)
      : viewMode === "week" && weekStart && weekEnd
        ? `${weekStart.getMonth() + 1}/${weekStart.getDate()} ～ ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`
        : `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`

  if (loading || staffLoading) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  return (
    <div className="space-y-4">
      {/* 担当者選択バナー */}
      <Card className="rounded-lg border-border shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">担当者を選択</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {staffList.map((staff) => (
              <Button
                key={staff.id}
                variant={selectedAssigneeId === staff.id ? "default" : "outline"}
                size="sm"
                className="rounded-full px-4"
                onClick={() => setSelectedAssigneeId(staff.id)}
              >
                <span
                  className="mr-2 inline-block size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: staff.color }}
                />
                {staff.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-lg border-border shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">シフトカレンダー</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-md border border-border bg-muted/30 p-0.5">
              {(["day", "week", "month"] as const).map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded px-3 text-xs"
                  onClick={() => setViewMode(mode)}
                >
                  {mode === "day" ? "1日" : mode === "week" ? "1週間" : "1ヶ月"}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={goPrev}
                aria-label="前へ"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-[120px]"
                onClick={goToday}
              >
                {titleByMode}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={goNext}
                aria-label="次へ"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedAssigneeId == null ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              上で担当者を選択すると、その担当者の予約が表示されます。
            </p>
          ) : (
            <>
              {viewMode === "day" && (
                <CalendarDayView
                  date={currentDate}
                  reservations={filteredReservations}
                  staffList={staffList}
                  onSelectReservation={(r) => handleSelectReservation(r.id)}
                />
              )}
              {viewMode === "week" && (
                <CalendarWeekView
                  date={currentDate}
                  reservations={filteredReservations}
                  staffList={staffList}
                  onSelectReservation={(r) => handleSelectReservation(r.id)}
                />
              )}
              {viewMode === "month" && (
                <CalendarMonthView
                  date={currentDate}
                  reservations={filteredReservations}
                  staffList={staffList}
                  onSelectReservation={(r) => handleSelectReservation(r.id)}
                  onSelectDay={(day) => {
                    setCurrentDate(startOfDay(new Date(day.getTime())))
                    setViewMode("day")
                  }}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
