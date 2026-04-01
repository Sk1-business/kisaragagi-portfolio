import { addDays } from "@/features/admin/lib/calendarUtils"
import type { Reservation } from "@/features/admin/types/reservation"
import type { Staff } from "@/features/admin/types/staff"
import {
  ADMIN_CALENDAR_TIME_ZONE,
  getDateKeyInTimeZone,
  getIsoDateKeyInTimeZone,
  getReservationsInRange,
  startOfWeek,
  endOfDay,
  formatTimeRange,
} from "@/features/admin/lib/calendarUtils"
import { getReservationTrainerColor } from "@/features/admin/hooks/useStaff"

// 8:00〜22:00 を表示対象（14時間）
const START_HOUR = 8
const END_HOUR = 22
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i,
)
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60

interface CalendarWeekViewProps {
  date: Date
  reservations: Reservation[]
  staffList: Staff[]
  onSelectReservation: (r: Reservation) => void
}

function toMinutesFromDayStart(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() - START_HOUR * 60
}

export function CalendarWeekView({
  date,
  reservations,
  staffList,
  onSelectReservation,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(date)
  const weekEnd = endOfDay(addDays(weekStart, 6))
  const weekReservations = getReservationsInRange(
    reservations,
    weekStart,
    weekEnd,
  )
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        <div className="grid grid-cols-[56px_repeat(7,1fr)] gap-px border border-border bg-border">
          {/* 左端：曜日ヘッダー用の空セル（時間列は下の行で表示） */}
          <div className="bg-muted/50" />

          {/* 曜日ヘッダー */}
          {days.map((d) => {
            const dayOfWeek = d.getDay()
            const isSun = dayOfWeek === 0
            const isSat = dayOfWeek === 6
            return (
              <div
                key={d.toISOString()}
                className={`py-1 text-center text-xs font-medium ${
                  isSun
                    ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400"
                    : isSat
                      ? "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"
                      : "bg-muted/30 text-muted-foreground"
                }`}
              >
                {d.getMonth() + 1}/{d.getDate()}{" "}
                ({["日", "月", "火", "水", "木", "金", "土"][dayOfWeek]})
              </div>
            )
          })}

          {/* 左端：時間ラベル＋実線・点線（スケジュールと同じ高さで時刻を配置） */}
          <div
            className="relative bg-muted/20"
            style={{ height: `${(END_HOUR - START_HOUR) * 56}px` }}
          >
            {/* 1時間ごとの実線 */}
            {HOURS.map((_, index) => (
              <div
                key={`solid-${index}`}
                className="pointer-events-none absolute inset-x-0 border-t border-border/60"
                style={{ top: `${(index / (HOURS.length - 1)) * 100}%` }}
              />
            ))}
            {/* 15分刻みの点線 */}
            {HOURS.slice(0, -1).map((_, hourIndex) =>
              [0.25, 0.5, 0.75].map((fraction) => (
                <div
                  key={`dotted-${hourIndex}-${fraction}`}
                  className="pointer-events-none absolute inset-x-0 border-t border-dotted border-border/40"
                  style={{
                    top: `${((hourIndex + fraction) / (HOURS.length - 1)) * 100}%`,
                  }}
                />
              )),
            )}
            {/* 時刻ラベル（実線の位置に合わせて配置） */}
            {HOURS.map((hour, index) => (
              <div
                key={`label-${hour}`}
                className="absolute right-1 text-right text-xs text-muted-foreground"
                style={{
                  top: `${(index / (HOURS.length - 1)) * 100}%`,
                  transform: "translateY(-50%)",
                }}
              >
                {hour.toString().padStart(2, "0")}:00
              </div>
            ))}
          </div>

          {/* 各日の列 */}
          {days.map((day) => {
            const dayKey = getDateKeyInTimeZone(day, ADMIN_CALENDAR_TIME_ZONE)
            const dayReservations = weekReservations.filter(
              (r) =>
                getIsoDateKeyInTimeZone(r.startAt, ADMIN_CALENDAR_TIME_ZONE) ===
                dayKey,
            )

            return (
              <div
                key={day.toISOString()}
                className="relative bg-background"
                style={{ height: `${(END_HOUR - START_HOUR) * 56}px` }}
              >
                {/* 実線・点線（背景） */}
                {HOURS.map((_, index) => (
                  <div
                    key={`solid-${index}`}
                    className="pointer-events-none absolute inset-x-0 border-t border-border/40"
                    style={{ top: `${(index / (HOURS.length - 1)) * 100}%` }}
                  />
                ))}
                {HOURS.slice(0, -1).map((_, hourIndex) =>
                  [0.25, 0.5, 0.75].map((fraction) => (
                    <div
                      key={`dotted-${hourIndex}-${fraction}`}
                      className="pointer-events-none absolute inset-x-0 border-t border-dotted border-border/30"
                      style={{
                        top: `${((hourIndex + fraction) / (HOURS.length - 1)) * 100}%`,
                      }}
                    />
                  )),
                )}

                {/* 予約ブロック（同一時間帯は横並び） */}
                {(() => {
                  const withPos = dayReservations
                    .map((r) => {
                      const startMinutes = toMinutesFromDayStart(
                        new Date(r.startAt),
                      )
                      const endMinutes = toMinutesFromDayStart(
                        new Date(r.endAt),
                      )
                      const clampedStart = Math.max(0, startMinutes)
                      const clampedEnd = Math.min(TOTAL_MINUTES, endMinutes)
                      if (clampedEnd <= clampedStart) return null
                      return {
                        r,
                        key: `${clampedStart}-${clampedEnd}`,
                        topPercent: (clampedStart / TOTAL_MINUTES) * 100,
                        heightPercent:
                          ((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100,
                      }
                    })
                    .filter((x): x is NonNullable<typeof x> => x != null)
                  const keyToCount: Record<string, number> = {}
                  withPos.forEach(({ key }) => {
                    keyToCount[key] = (keyToCount[key] ?? 0) + 1
                  })
                  const keyToIndex: Record<string, number> = {}
                  return withPos.map(
                    ({ r, key, topPercent, heightPercent }) => {
                      const idx = keyToIndex[key] ?? 0
                      keyToIndex[key] = idx + 1
                      const n = keyToCount[key]
                      const leftPercent = (idx / n) * 100
                      const widthPercent = 100 / n
                      const bgColor = getReservationTrainerColor(r, staffList)
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className="absolute flex flex-col gap-0.5 rounded-md border px-1 py-1 text-left text-[10px] shadow-sm transition-opacity hover:opacity-90"
                          style={{
                            top: `${topPercent}%`,
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            height: `${heightPercent}%`,
                            boxSizing: "border-box",
                            marginRight: "1px",
                            backgroundColor: `${bgColor}20`,
                            borderColor: bgColor,
                          }}
                          onClick={() => onSelectReservation(r)}
                        >
                          <span className="truncate text-xs font-semibold text-foreground">
                            {r.customerName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatTimeRange(r.startAt, r.endAt)}
                          </span>
                        </button>
                      )
                    },
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
