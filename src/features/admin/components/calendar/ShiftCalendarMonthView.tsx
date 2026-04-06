import { useState } from "react"
import { useNavigate } from "react-router-dom"
import type { BusinessHoursItem } from "@/features/admin/api/adminSettingsApi"
import {
  createTrainerShift,
  deleteTrainerShift,
  updateTrainerShift,
} from "@/features/admin/api/trainerShiftsApi"
import { useAdminShiftAvailability } from "@/features/admin/context/AdminShiftAvailabilityContext"
import type { ResolvedShiftDay } from "@/features/admin/context/AdminShiftAvailabilityContext"
import {
  ShiftAvailabilityEditDialog,
  type ShiftEditCommit,
} from "@/features/admin/components/calendar/ShiftAvailabilityEditDialog"
import {
  startOfMonth,
  endOfMonth,
  addDays,
  startOfDay,
  startOfWeek,
  toDateKey,
  WEEKDAY_LABELS,
} from "@/features/admin/lib/calendarUtils"
import { getBusinessHoursForJsDate } from "@/features/admin/lib/businessHours"
import type { Reservation } from "@/features/admin/types/reservation"
import type { Staff } from "@/features/admin/types/staff"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

interface ShiftCalendarMonthViewProps {
  date: Date
  staffList: Staff[]
  businessHoursItems: BusinessHoursItem[]
  settingsLoading: boolean
  reservations: Reservation[]
  reservationsLoading: boolean
  reservationsFetchFailed: boolean
  refetchShifts: () => void
}

function workSlotsLabel(resolved: Extract<ResolvedShiftDay, { kind: "work" }>): string {
  const parts = [resolved.slot, ...(resolved.moreSlots ?? [])].map(
    (s) => `${s.start}-${s.end}`,
  )
  return parts.join(" / ")
}

function rowLabel(resolved: ResolvedShiftDay, staff: Staff): string {
  if (resolved.kind === "work") {
    return `${staff.name}：${workSlotsLabel(resolved)}`
  }
  if (resolved.kind === "off_explicit") {
    return `${staff.name}：休み`
  }
  return `${staff.name}：—`
}

export function ShiftCalendarMonthView({
  date,
  staffList,
  businessHoursItems,
  settingsLoading,
  reservations,
  reservationsLoading,
  reservationsFetchFailed,
  refetchShifts,
}: ShiftCalendarMonthViewProps) {
  const navigate = useNavigate()
  const { resolveStaffDay, setOverride, apiShiftRows } = useAdminShiftAvailability()
  const [editing, setEditing] = useState<{ staff: Staff; day: Date } | null>(null)

  const monthStart = startOfMonth(date)
  const monthEnd = endOfMonth(date)
  const calendarStart = startOfWeek(monthStart)
  const weeks: Date[][] = []
  let current = calendarStart
  while (current <= monthEnd || weeks.length < 6) {
    const week: Date[] = []
    for (let i = 0; i < 7; i++) {
      week.push(current)
      current = addDays(current, 1)
    }
    weeks.push(week)
    if (weeks.length >= 6) break
  }

  const isCurrentMonth = (d: Date) => d.getMonth() === date.getMonth()

  const sortedStaff = [...staffList].sort((a, b) =>
    a.name.localeCompare(b.name, "ja"),
  )

  const resolvedEditing =
    editing != null ? resolveStaffDay(editing.staff, editing.day) : null

  const businessDayForEdit =
    editing != null ? getBusinessHoursForJsDate(businessHoursItems, editing.day) : null

  const handleCommit = async (commit: ShiftEditCommit) => {
    if (!editing) return
    const { staff, day } = editing
    const dateKey = toDateKey(day)
    const trainerId = staff.id
    const rows = apiShiftRows[trainerId]?.[dateKey] ?? []
    const ids = rows.map((r) => r.shift_id)

    try {
      if (commit.type === "save") {
        const body = {
          date: dateKey,
          start_time: commit.slot.start,
          end_time: commit.slot.end,
        }
        if (ids.length === 0) {
          await createTrainerShift(trainerId, body)
        } else {
          for (const id of ids.slice(1)) {
            await deleteTrainerShift(trainerId, id)
          }
          await updateTrainerShift(trainerId, ids[0], body)
        }
        setOverride(trainerId, dateKey, null)
      } else if (commit.type === "off") {
        for (const id of ids) {
          await deleteTrainerShift(trainerId, id)
        }
        setOverride(trainerId, dateKey, null)
      }
      refetchShifts()
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        navigate(ROUTES.backofficeLogin, { replace: true })
      }
      throw e
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          <div className="grid grid-cols-7 border border-border">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className={`border-b border-border py-1.5 text-center text-xs font-medium ${
                  label === "日"
                    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                    : label === "土"
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"
                      : "bg-muted/50 text-muted-foreground"
                }`}
              >
                {label}
              </div>
            ))}
            {weeks.flat().map((day) => {
              const inMonth = isCurrentMonth(day)
              const dayNorm = startOfDay(new Date(day.getTime()))
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[120px] border-b border-r border-border p-1 last:border-r-0 ${
                    inMonth ? "bg-background" : "bg-muted/20"
                  }`}
                >
                  <span
                    className={`inline-flex size-6 items-center justify-center rounded text-xs ${
                      inMonth ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {sortedStaff.map((staff) => {
                      const resolved = resolveStaffDay(staff, dayNorm)
                      const work = resolved.kind === "work"
                      return (
                        <button
                          key={staff.id}
                          type="button"
                          className={cn(
                            "block w-full truncate rounded border px-1 py-0.5 text-left text-[10px] leading-tight transition-opacity hover:opacity-90",
                            !work && "border-dashed opacity-90",
                          )}
                          style={
                            work
                              ? {
                                  backgroundColor: `${staff.color}20`,
                                  borderColor: staff.color,
                                }
                              : {
                                  borderColor: `${staff.color}80`,
                                  backgroundColor: `${staff.color}08`,
                                }
                          }
                          title={`${rowLabel(resolved, staff)}（クリックで編集）`}
                          onClick={() => setEditing({ staff, day: dayNorm })}
                        >
                          <span className="font-medium">{staff.name}</span>
                          <span className="text-muted-foreground">
                            {resolved.kind === "work"
                              ? `：${workSlotsLabel(resolved)}`
                              : resolved.kind === "off_explicit"
                                ? "：休み"
                                : "：—"}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <ShiftAvailabilityEditDialog
        key={editing ? `${editing.staff.id}-${toDateKey(editing.day)}` : "shift-edit-closed"}
        open={editing != null}
        staff={editing?.staff ?? null}
        day={editing?.day ?? null}
        resolved={resolvedEditing}
        businessDay={businessDayForEdit}
        settingsLoading={settingsLoading}
        reservations={reservations}
        reservationsLoading={reservationsLoading}
        reservationsFetchFailed={reservationsFetchFailed}
        onClose={() => setEditing(null)}
        onCommit={handleCommit}
      />
    </>
  )
}
