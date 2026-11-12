import type { AvailabilityTimeSlot } from "@/features/user/api/userReservationApi"

function toMinutes(time: string): number {
  const [hour, minute] = time.split(":").map(Number)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0
  return hour * 60 + minute
}

function toTime(minutes: number): string {
  const hour = Math.floor(minutes / 60)
  const minute = minutes % 60
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
}

/**
 * API が 30 分刻みなどで返す枠を、予約ルールの刻み（既定 15 分）まで分割する。
 * 欠番になっている長い空きは、埋めて二重予約にしない。
 */
export function expandTimeSlots(
  slots: AvailabilityTimeSlot[],
  incrementMinutes: number,
): AvailabilityTimeSlot[] {
  if (slots.length < 2 || incrementMinutes < 1) return slots
  const sorted = [...slots].sort((a, b) => a.time.localeCompare(b.time))
  const gaps: number[] = []
  for (let index = 0; index < sorted.length - 1; index += 1) {
    const gap = toMinutes(sorted[index + 1].time) - toMinutes(sorted[index].time)
    if (gap > 0) gaps.push(gap)
  }
  if (gaps.length === 0) return sorted
  const commonGap = gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)]
  if (commonGap <= incrementMinutes || commonGap % incrementMinutes !== 0) return sorted

  const expanded: AvailabilityTimeSlot[] = []
  for (let index = 0; index < sorted.length; index += 1) {
    expanded.push(sorted[index])
    if (index === sorted.length - 1) break
    const start = toMinutes(sorted[index].time)
    const end = toMinutes(sorted[index + 1].time)
    if (end - start !== commonGap) continue
    for (let cursor = start + incrementMinutes; cursor < end; cursor += incrementMinutes) {
      expanded.push({
        time: toTime(cursor),
        selectable: sorted[index].selectable && sorted[index + 1].selectable,
      })
    }
  }
  return expanded
}
