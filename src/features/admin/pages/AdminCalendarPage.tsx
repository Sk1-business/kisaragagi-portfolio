import { useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
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

function ymd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function parseViewParam(v: string | null): ViewMode {
  if (v === "day" || v === "week" || v === "month") return v
  return "month"
}

function parseDateParam(s: string | null): Date {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return startOfDay(new Date())
  const [y, m, d] = s.split("-").map(Number)
  const dt = new Date(y, m - 1, d)
  if (Number.isNaN(dt.getTime())) return startOfDay(new Date())
  return startOfDay(dt)
}

export function AdminCalendarPage() {
  const { reservations, loading } = useAdminReservations()
  const { staffList, loading: staffLoading } = useStaff()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const viewMode = useMemo(
    () => parseViewParam(searchParams.get("view")),
    [searchParams],
  )
  const currentDate = useMemo(
    () => parseDateParam(searchParams.get("date")),
    [searchParams],
  )

  const patchSearchParams = (patch: (p: URLSearchParams) => void) => {
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev)
        patch(p)
        const v = p.get("view")
        if (v === "month") p.delete("view")
        return p
      },
      { replace: true },
    )
  }

  const handleSelectReservation = (id: string) => {
    navigate(ROUTES.adminReservationDetail.replace(":id", id))
  }

  const setViewMode = (mode: ViewMode) => {
    patchSearchParams((p) => {
      if (mode === "month") {
        p.delete("view")
      } else {
        p.set("view", mode)
      }
      if (!p.get("date")) {
        p.set("date", ymd(startOfDay(new Date())))
      }
    })
  }

  const goPrev = () => {
    patchSearchParams((p) => {
      const vm = parseViewParam(p.get("view"))
      const d = parseDateParam(p.get("date"))
      const next =
        vm === "day"
          ? addDays(d, -1)
          : vm === "week"
            ? addWeeks(d, -1)
            : addMonths(d, -1)
      p.set("date", ymd(next))
    })
  }

  const goNext = () => {
    patchSearchParams((p) => {
      const vm = parseViewParam(p.get("view"))
      const d = parseDateParam(p.get("date"))
      const next =
        vm === "day"
          ? addDays(d, 1)
          : vm === "week"
            ? addWeeks(d, 1)
            : addMonths(d, 1)
      p.set("date", ymd(next))
    })
  }

  const goToday = () => {
    patchSearchParams((p) => {
      p.set("date", ymd(startOfDay(new Date())))
    })
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
    return (
      <p className="text-sm text-muted-foreground">読み込み中...</p>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-border shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">予約カレンダー</CardTitle>
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
              <Button variant="outline" size="icon" className="size-8" onClick={goPrev} aria-label="前へ">
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="sm" className="min-w-[120px]" onClick={goToday}>
                {titleByMode}
              </Button>
              <Button variant="outline" size="icon" className="size-8" onClick={goNext} aria-label="次へ">
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "day" && (
            <CalendarDayView
              date={currentDate}
              reservations={reservations}
              staffList={staffList}
              onSelectReservation={(r) => handleSelectReservation(r.id)}
            />
          )}
          {viewMode === "week" && (
            <CalendarWeekView
              date={currentDate}
              reservations={reservations}
              staffList={staffList}
              onSelectReservation={(r) => handleSelectReservation(r.id)}
            />
          )}
          {viewMode === "month" && (
            <CalendarMonthView
              date={currentDate}
              reservations={reservations}
              staffList={staffList}
              onSelectReservation={(r) => handleSelectReservation(r.id)}
              onSelectDay={(day) => {
                patchSearchParams((p) => {
                  p.set("view", "day")
                  p.set("date", ymd(startOfDay(day)))
                })
              }}
            />
          )}
        </CardContent>
      </Card>

    </div>
  )
}
