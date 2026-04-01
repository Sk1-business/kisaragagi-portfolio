import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toDateKey } from "@/features/admin/lib/calendarUtils"
import type {
  ResolvedShiftDay,
  ShiftOverrideValue,
} from "@/features/admin/context/AdminShiftAvailabilityContext"
import type { Staff } from "@/features/admin/types/staff"

function padTimePart(s: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim())
  if (!m) return "09:00"
  const h = Math.min(23, Math.max(0, Number(m[1])))
  const min = Math.min(59, Math.max(0, Number(m[2])))
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`
}

function timeToMinutes(t: string): number {
  const p = padTimePart(t).split(":").map(Number)
  return p[0] * 60 + p[1]
}

interface ShiftAvailabilityEditDialogProps {
  open: boolean
  staff: Staff | null
  day: Date | null
  resolved: ResolvedShiftDay | null
  onClose: () => void
  onCommit: (value: ShiftOverrideValue | null) => void
}

export function ShiftAvailabilityEditDialog({
  open,
  staff,
  day,
  resolved,
  onClose,
  onCommit,
}: ShiftAvailabilityEditDialogProps) {
  const [start, setStart] = useState("10:00")
  const [end, setEnd] = useState("19:00")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !resolved) return
    setError(null)
    if (resolved.kind === "work") {
      setStart(padTimePart(resolved.slot.start))
      setEnd(padTimePart(resolved.slot.end))
    } else {
      setStart("10:00")
      setEnd("19:00")
    }
  }, [open, resolved])

  if (!open || !staff || !day) return null

  const dateLabel = `${day.getFullYear()}年${day.getMonth() + 1}月${day.getDate()}日`

  const handleSave = () => {
    const a = padTimePart(start)
    const b = padTimePart(end)
    if (timeToMinutes(b) <= timeToMinutes(a)) {
      setError("終了時刻は開始時刻より後にしてください。")
      return
    }
    onCommit({ start: a, end: b })
    onClose()
  }

  const handleOff = () => {
    setError(null)
    onCommit("off")
    onClose()
  }

  const handleReset = () => {
    setError(null)
    onCommit(null)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="shift-edit-title"
        className="w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shift-edit-title" className="text-lg font-semibold">
          担当可能時間の編集
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {staff.name} · {dateLabel}（{toDateKey(day)}）
        </p>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="shift-start">開始</Label>
              <Input
                id="shift-start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shift-end">終了</Label>
              <Input
                id="shift-end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            既定に戻す
          </Button>
          <Button type="button" variant="secondary" onClick={handleOff}>
            休みにする
          </Button>
          <Button type="button" onClick={handleSave}>
            保存
          </Button>
        </div>
      </div>
    </div>
  )
}
