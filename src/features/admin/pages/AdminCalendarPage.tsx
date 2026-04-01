import { useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchAdminReservations } from "@/features/admin/api/reservationsApi"
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
  const { reservations, loading, replaceReservations } = useAdminReservations()
  const { staffList, loading: staffLoading } = useStaff()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<Set<string>>(
    () => new Set(),
  )
  const [calendarListLoading, setCalendarListLoading] = useState(true)
  const [calendarListError, setCalendarListError] = useState(false)

  const viewMode = useMemo(
    () => parseViewParam(searchParams.get("view")),
    [searchParams],
  )
  const currentDate = useMemo(
    () => parseDateParam(searchParams.get("date")),
    [searchParams],
  )

  const reservationFetchOptions = useMemo(
    () => ({
      viewMode,
      anchorDate: currentDate,
    }),
    [viewMode, currentDate],
  )

  useEffect(() => {
    if (staffLoading) return
    let cancelled = false
    void (async () => {
      setCalendarListLoading(true)
      setCalendarListError(false)
      try {
        const list = await fetchAdminReservations(
          staffList,
          reservationFetchOptions,
        )
        if (cancelled) return
        replaceReservations(list)
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setCalendarListError(true)
      } finally {
        if (!cancelled) setCalendarListLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    staffLoading,
    staffList,
    replaceReservations,
    navigate,
    reservationFetchOptions,
  ])

  useEffect(() => {
    const validIds = new Set(staffList.map((s) => s.id))
    setSelectedAssigneeIds((prev) => {
      const next = new Set<string>()
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id)
      })
      if (next.size === prev.size && [...prev].every((id) => next.has(id))) {
        return prev
      }
      return next
    })
  }, [staffList])

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

  const filteredReservations = useMemo(() => {
    if (selectedAssigneeIds.size === 0) return reservations
    return reservations.filter((r) => {
      if (selectedAssigneeIds.has(r.assigneeId)) return true
      const t = r.trainerName?.trim()
      if (!t) return false
      return staffList.some(
        (s) => selectedAssigneeIds.has(s.id) && s.name.trim() === t,
      )
    })
  }, [reservations, selectedAssigneeIds, staffList])

  const toggleAssignee = (id: string) => {
    setSelectedAssigneeIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearAssigneeFilter = () => setSelectedAssigneeIds(new Set())

  if (loading || staffLoading || calendarListLoading) {
    return (
      <p className="text-sm text-muted-foreground">読み込み中...</p>
    )
  }

  if (calendarListError) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          予約一覧の取得に失敗しました。ネットワークまたはサーバーを確認してください。
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setCalendarListError(false)
            setCalendarListLoading(true)
            void (async () => {
              try {
                const list = await fetchAdminReservations(
                  staffList,
                  reservationFetchOptions,
                )
                replaceReservations(list)
                setCalendarListError(false)
              } catch (e) {
                if (e instanceof Error && e.message === "UNAUTHORIZED") {
                  navigate(ROUTES.backofficeLogin, { replace: true })
                  return
                }
                setCalendarListError(true)
              } finally {
                setCalendarListLoading(false)
              }
            })()
          }}
        >
          再試行
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-border shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">担当者で絞り込み</CardTitle>
          <p className="text-sm text-muted-foreground">
            担当者を選ぶと、その担当に割り当てられた予約だけ表示します。複数人を選べます。未選択のときは全員分を表示します。
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {staffList.map((staff) => (
              <Button
                key={staff.id}
                variant={selectedAssigneeIds.has(staff.id) ? "default" : "outline"}
                size="sm"
                className="rounded-full px-4"
                onClick={() => toggleAssignee(staff.id)}
                aria-pressed={selectedAssigneeIds.has(staff.id)}
              >
                <span
                  className="mr-2 inline-block size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: staff.color }}
                />
                {staff.name}
              </Button>
            ))}
            {staffList.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={clearAssigneeFilter}
                disabled={selectedAssigneeIds.size === 0}
              >
                選択をクリア
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

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
