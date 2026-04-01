import { useState } from "react"
import {
  startOfMonth,
  endOfMonth,
  addDays,
  startOfDay,
  startOfWeek,
  toDateKey,
  WEEKDAY_LABELS,
} from "@/features/admin/lib/calendarUtils"
import { useAdminShiftAvailability } from "@/features/admin/context/AdminShiftAvailabilityContext"
import type { ResolvedShiftDay } from "@/features/admin/context/AdminShiftAvailabilityContext"
import type { Staff } from "@/features/admin/types/staff"
import { ShiftAvailabilityEditDialog } from "./ShiftAvailabilityEditDialog"
import { cn } from "@/lib/utils"

interface ShiftCalendarMonthViewProps {
  date: Date
  staffList: Staff[]
}

function rowLabel(resolved: ResolvedShiftDay, staff: Staff): string {
  if (resolved.kind === "work") {
    return `${staff.name}：${resolved.slot.start}-${resolved.slot.end}`
  }
  if (resolved.kind === "off_explicit") {
    return `${staff.name}：休み`
  }
  return `${staff.name}：—`
}

export function ShiftCalendarMonthView({
  date,
  staffList,
}: ShiftCalendarMonthViewProps) {
  const { resolveStaffDay, setOverride } = useAdminShiftAvailability()
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
                              ? `：${resolved.slot.start}-${resolved.slot.end}`
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
        open={editing != null}
        staff={editing?.staff ?? null}
        day={editing?.day ?? null}
        resolved={resolvedEditing}
        onClose={() => setEditing(null)}
        onCommit={(value) => {
          if (!editing) return
          setOverride(editing.staff.id, toDateKey(editing.day), value)
        }}
      />
    </>
  )
}
