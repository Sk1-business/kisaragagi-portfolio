import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { formatTimeRangeInAdminCalendarTz, toDateKey } from "@/features/admin/lib/calendarUtils"
import type { ResolvedShiftDay } from "@/features/admin/context/AdminShiftAvailabilityContext"
import type { AvailabilitySlot } from "@/features/admin/lib/shiftAvailability"
import type { BusinessWindowForDay } from "@/features/admin/lib/businessHours"
import {
  buildEndTimeOptions,
  buildStartTimeOptions,
  padTimePart,
  shiftSlotWithinBusinessHours,
  timeToMinutes,
} from "@/features/admin/lib/businessHours"
import {
  getReservationsBlockingShiftRemoval,
  getReservationsOutsideShiftWindow,
} from "@/features/admin/lib/shiftReservationConflict"
import type { Reservation } from "@/features/admin/types/reservation"
import type { Staff } from "@/features/admin/types/staff"
import { cn } from "@/lib/utils"

const selectClassName = cn(
  "border-input bg-background h-9 min-w-[4.5rem] rounded-md border px-2 text-sm shadow-xs",
  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
)

export type ShiftEditCommit =
  | { type: "save"; slot: AvailabilitySlot }
  | { type: "off" }

interface ShiftAvailabilityEditDialogProps {
  open: boolean
  staff: Staff | null
  day: Date | null
  resolved: ResolvedShiftDay | null
  /** その日の営業時間（`GET /api/admin/settings` の business_hours） */
  businessDay: BusinessWindowForDay | null
  settingsLoading: boolean
  /** シフトと予約の整合チェック用（`GET /api/admin/reservations` 相当） */
  reservations: Reservation[]
  reservationsLoading: boolean
  reservationsFetchFailed: boolean
  onClose: () => void
  onCommit: (commit: ShiftEditCommit) => Promise<void>
}

export function ShiftAvailabilityEditDialog({
  open,
  staff,
  day,
  resolved,
  businessDay,
  settingsLoading,
  reservations,
  reservationsLoading,
  reservationsFetchFailed,
  onClose,
  onCommit,
}: ShiftAvailabilityEditDialogProps) {
  const [start, setStart] = useState("10:00")
  const [end, setEnd] = useState("19:00")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const biz = businessDay && !businessDay.isClosed ? businessDay : null

  const validStartTimes = useMemo(() => {
    if (!biz) return []
    return buildStartTimeOptions(biz.start, biz.end)
  }, [biz])

  const validEndTimes = useMemo(() => {
    if (!biz) return []
    return buildEndTimeOptions(biz.end, start)
  }, [biz, start])

  const hoursForStart = useMemo(() => {
    const s = new Set<number>()
    for (const t of validStartTimes) {
      s.add(parseInt(t.split(":")[0], 10))
    }
    return [...s].sort((a, b) => a - b)
  }, [validStartTimes])

  const minutesForStartHour = useCallback(
    (hour: number) =>
      validStartTimes
        .filter((t) => parseInt(t.split(":")[0], 10) === hour)
        .map((t) => t.split(":")[1]),
    [validStartTimes],
  )

  const hoursForEnd = useMemo(() => {
    const s = new Set<number>()
    for (const t of validEndTimes) {
      s.add(parseInt(t.split(":")[0], 10))
    }
    return [...s].sort((a, b) => a - b)
  }, [validEndTimes])

  const minutesForEndHour = useCallback(
    (hour: number) =>
      validEndTimes
        .filter((t) => parseInt(t.split(":")[0], 10) === hour)
        .map((t) => t.split(":")[1]),
    [validEndTimes],
  )

  /** 描画前に同期し、カレンダー表示と編集欄の時刻のずれを防ぐ */
  useLayoutEffect(() => {
    if (!open || !resolved) return
    setError(null)
    if (resolved.kind === "work") {
      setStart(padTimePart(resolved.slot.start))
      setEnd(padTimePart(resolved.slot.end))
    } else {
      const b = businessDay && !businessDay.isClosed ? businessDay : null
      setStart(b ? padTimePart(b.start) : "10:00")
      setEnd(b ? padTimePart(b.end) : "19:00")
    }
  }, [open, resolved, businessDay])

  /** 開始が変わったら、終了が営業範囲外または開始以前なら補正（刻みに無い値は最も近い選択肢へ） */
  useEffect(() => {
    if (!biz) return
    const ends = buildEndTimeOptions(biz.end, start)
    if (ends.length === 0) return
    setEnd((prev) => {
      const p = padTimePart(prev)
      const pm = timeToMinutes(p)
      const sm = timeToMinutes(start)
      const be = timeToMinutes(biz.end)
      if (pm <= sm) return ends[0]
      if (pm > be) return ends[ends.length - 1]
      if (ends.includes(p)) return p
      let nearest = ends[0]
      let bestDiff = Infinity
      for (const e of ends) {
        const d = Math.abs(timeToMinutes(e) - pm)
        if (d < bestDiff) {
          bestDiff = d
          nearest = e
        }
      }
      return nearest
    })
  }, [start, biz])

  if (!open || !staff || !day) return null

  const dateLabel = `${day.getFullYear()}年${day.getMonth() + 1}月${day.getDate()}日`

  const startHour = parseInt(start.split(":")[0], 10)
  const startMinuteStr = start.split(":")[1] ?? "00"
  const endHour = parseInt(end.split(":")[0], 10)
  const endMinuteStr = end.split(":")[1] ?? "00"

  const setStartFromHour = (hourStr: string) => {
    const hour = Number(hourStr)
    const mins = minutesForStartHour(hour)
    const nextMin = mins.includes(startMinuteStr) ? startMinuteStr : mins[0] ?? "00"
    setStart(`${String(hour).padStart(2, "0")}:${nextMin}`)
  }

  const setStartFromMinute = (minStr: string) => {
    setStart(`${String(startHour).padStart(2, "0")}:${minStr}`)
  }

  const setEndFromHour = (hourStr: string) => {
    const hour = Number(hourStr)
    const mins = minutesForEndHour(hour)
    const nextMin = mins.includes(endMinuteStr) ? endMinuteStr : mins[0] ?? "00"
    setEnd(`${String(hour).padStart(2, "0")}:${nextMin}`)
  }

  const setEndFromMinute = (minStr: string) => {
    setEnd(`${String(endHour).padStart(2, "0")}:${minStr}`)
  }

  const runCommit = async (commit: ShiftEditCommit) => {
    setSaving(true)
    setError(null)
    try {
      await onCommit(commit)
      onClose()
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        return
      }
      setError("保存に失敗しました。通信またはサーバーを確認してください。")
    } finally {
      setSaving(false)
    }
  }

  const handleSave = () => {
    if (settingsLoading || !businessDay) {
      setError("営業時間を読み込み中です。しばらく待ってから再度お試しください。")
      return
    }
    if (businessDay.isClosed) {
      setError("この日は定休日のため、勤務シフトを登録できません。")
      return
    }
    const a = padTimePart(start)
    const b = padTimePart(end)
    if (timeToMinutes(b) <= timeToMinutes(a)) {
      setError("終了時刻は開始時刻より後にしてください。")
      return
    }
    const slot: AvailabilitySlot = { start: a, end: b }
    if (
      !shiftSlotWithinBusinessHours(slot, {
        start: businessDay.start,
        end: businessDay.end,
      })
    ) {
      setError(
        `シフトは営業時間（${businessDay.start}〜${businessDay.end}）の範囲内で入力してください。`,
      )
      return
    }
    if (reservationsFetchFailed) {
      setError(
        "予約一覧を取得できなかったため、シフトを保存できません。しばらくしてから再度お試しください。",
      )
      return
    }
    if (reservationsLoading) {
      setError("予約情報を読み込み中です。しばらく待ってから再度お試しください。")
      return
    }
    const outside = getReservationsOutsideShiftWindow(
      reservations,
      staff.id,
      day,
      a,
      b,
    )
    if (outside.length > 0) {
      const first = outside[0]
      const range = formatTimeRangeInAdminCalendarTz(first.startAt, first.endAt)
      setError(
        `この担当者には、変更後のシフトの勤務時間内に収まらない予約が入っているため、シフトを変更できません。例えば、10:00〜19:00のシフトで10:00〜11:00の予約がある場合、シフトを11:00〜19:00に変更することはできません。${outside.length === 1 ? `（該当: ${range}）` : `（例: ${range} ほか${outside.length - 1}件）`}`,
      )
      return
    }
    void runCommit({ type: "save", slot })
  }

  const handleOff = () => {
    if (reservationsFetchFailed) {
      setError(
        "予約一覧を取得できなかったため、シフトを休みにできません。しばらくしてから再度お試しください。",
      )
      return
    }
    if (reservationsLoading) {
      setError("予約情報を読み込み中です。しばらく待ってから再度お試しください。")
      return
    }
    const blocking = getReservationsBlockingShiftRemoval(reservations, staff.id, day)
    if (blocking.length > 0) {
      const first = blocking[0]
      const range = formatTimeRangeInAdminCalendarTz(first.startAt, first.endAt)
      setError(
        `この担当者には、この日に予約が入っているため、シフトを「休みにする」ことはできません。${blocking.length === 1 ? `（該当: ${range}）` : `（例: ${range} ほか${blocking.length - 1}件）`}`,
      )
      return
    }
    void runCommit({ type: "off" })
  }

  const disabledFields = saving || settingsLoading || businessDay?.isClosed || !biz

  const saveDisabled =
    saving ||
    settingsLoading ||
    businessDay?.isClosed ||
    !biz ||
    !businessDay ||
    reservationsLoading ||
    reservationsFetchFailed

  const offDisabled = saving || reservationsLoading || reservationsFetchFailed

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={() => !saving && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-edit-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shift-edit-title" className="text-lg font-semibold">
          シフトの編集
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {staff.name} · {dateLabel}（{toDateKey(day)}）
        </p>

        {settingsLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">営業時間を読み込み中…</p>
        ) : businessDay?.isClosed ? (
          <div className="mt-3 space-y-1">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              この日は定休日です。勤務シフトの新規登録・変更はできません（登録済みシフトの削除は「休みにする」から行えます）。
            </p>
            {reservationsFetchFailed ? (
              <p className="text-xs text-destructive">
                予約一覧の取得に失敗しました。シフトの保存・「休みにする」はできません。
              </p>
            ) : reservationsLoading ? (
              <p className="text-xs text-muted-foreground">予約情報を確認しています…</p>
            ) : null}
          </div>
        ) : biz ? (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-muted-foreground">
              営業時間: {biz.start} 〜 {biz.end}
            </p>
            {reservationsFetchFailed ? (
              <p className="text-xs text-destructive">
                予約一覧の取得に失敗しました。シフトの保存・「休みにする」はできません。
              </p>
            ) : reservationsLoading ? (
              <p className="text-xs text-muted-foreground">予約情報を確認しています…</p>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-destructive">
            この日の営業時間が取得できませんでした。
          </p>
        )}

        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>開始</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              <select
                aria-label="開始の時"
                className={selectClassName}
                disabled={disabledFields || validStartTimes.length === 0}
                value={String(startHour).padStart(2, "0")}
                onChange={(e) => setStartFromHour(e.target.value)}
              >
                {hoursForStart.map((h) => (
                  <option key={h} value={String(h).padStart(2, "0")}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">時</span>
              <select
                aria-label="開始の分"
                className={selectClassName}
                disabled={disabledFields || minutesForStartHour(startHour).length === 0}
                value={startMinuteStr}
                onChange={(e) => setStartFromMinute(e.target.value)}
              >
                {minutesForStartHour(startHour).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">分</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>終了</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              <select
                aria-label="終了の時"
                className={selectClassName}
                disabled={disabledFields || validEndTimes.length === 0}
                value={String(endHour).padStart(2, "0")}
                onChange={(e) => setEndFromHour(e.target.value)}
              >
                {hoursForEnd.map((h) => (
                  <option key={h} value={String(h).padStart(2, "0")}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">時</span>
              <select
                aria-label="終了の分"
                className={selectClassName}
                disabled={disabledFields || minutesForEndHour(endHour).length === 0}
                value={endMinuteStr}
                onChange={(e) => setEndFromMinute(e.target.value)}
              >
                {minutesForEndHour(endHour).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="text-sm text-muted-foreground">分</span>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
            キャンセル
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={offDisabled}
            onClick={() => void handleOff()}
          >
            休みにする
          </Button>
          <Button type="button" disabled={saveDisabled} onClick={() => void handleSave()}>
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      </div>
    </div>
  )
}
