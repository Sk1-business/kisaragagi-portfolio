import type { Reservation } from "@/features/admin/types/reservation"
import type { Staff } from "@/features/admin/types/staff"
import {
  getReservationsForDay,
  formatTime,
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

interface CalendarDayViewProps {
  date: Date
  reservations: Reservation[]
  staffList: Staff[]
  onSelectReservation: (r: Reservation) => void
}

function toMinutesFromDayStart(date: Date): number {
  return date.getHours() * 60 + date.getMinutes() - START_HOUR * 60
}

export function CalendarDayView({
  date,
  reservations,
  staffList,
  onSelectReservation,
}: CalendarDayViewProps) {
  const dayReservations = getReservationsForDay(reservations, date)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[320px]">
        <div className="grid grid-cols-[56px_1fr] gap-2">
          {/* 時間ラベル列 */}
          <div className="relative">
            {HOURS.slice(0, -1).map((hour, index) => (
              <div
                key={hour}
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

          {/* タイムライン＋予約ブロック */}
          <div
            className="relative border-t border-border/60"
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

            {/* 15分刻みの点線（0.25, 0.5, 0.75） */}
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

            {/* 同一時間帯の予約をグループ化して横並び表示 */}
            {(() => {
              const withPosition = dayReservations
                .map((r) => {
                  const startMinutes = toMinutesFromDayStart(new Date(r.startAt))
                  const endMinutes = toMinutesFromDayStart(new Date(r.endAt))
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
              withPosition.forEach(({ key }) => {
                keyToCount[key] = (keyToCount[key] ?? 0) + 1
              })
              const keyToIndex: Record<string, number> = {}
              return withPosition.map(({ r, key, topPercent, heightPercent }) => {
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
                    className="absolute flex flex-col gap-0.5 overflow-hidden rounded border px-1 py-0.5 text-left text-xs shadow-sm transition-opacity hover:opacity-90"
                    style={{
                      top: `${topPercent}%`,
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                      boxSizing: "border-box",
                      marginRight: "2px",
                      backgroundColor: `${bgColor}20`,
                      borderColor: bgColor,
                    }}
                    onClick={() => onSelectReservation(r)}
                  >
                    <span className="font-medium">{formatTime(r.startAt)}</span>
                    <span className="block truncate font-medium">{r.customerName}</span>
                    {r.menuName?.trim() ? (
                      <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground">
                        {r.menuName.trim()}
                      </span>
                    ) : null}
                    {r.memo?.trim() ? (
                      <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground/90">
                        {r.memo.trim()}
                      </span>
                    ) : null}
                  </button>
                )
              })
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
