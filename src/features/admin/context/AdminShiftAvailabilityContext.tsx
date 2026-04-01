import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { toDateKey } from "@/features/admin/lib/calendarUtils"
import {
  getStaffAvailabilityForDay,
  type AvailabilitySlot,
} from "@/features/admin/lib/shiftAvailability"
import type { Staff } from "@/features/admin/types/staff"

const STORAGE_KEY = "saas_admin_shift_availability_v1"

/** 上書き: 勤務時間 or 明示的な休み */
export type ShiftOverrideValue = AvailabilitySlot | "off"

export type ResolvedShiftDay =
  | { kind: "work"; slot: AvailabilitySlot }
  | { kind: "off_explicit" }
  | { kind: "none" }

type OverridesMap = Record<string, Record<string, ShiftOverrideValue>>

function loadInitial(): OverridesMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (parsed != null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as OverridesMap
    }
  } catch {
    /* ignore */
  }
  return {}
}

function isSlot(x: unknown): x is AvailabilitySlot {
  return (
    x != null &&
    typeof x === "object" &&
    typeof (x as AvailabilitySlot).start === "string" &&
    typeof (x as AvailabilitySlot).end === "string"
  )
}

function normalizeOverrides(raw: OverridesMap): OverridesMap {
  const next: OverridesMap = {}
  for (const [dateKey, byStaff] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue
    if (byStaff == null || typeof byStaff !== "object") continue
    const inner: Record<string, ShiftOverrideValue> = {}
    for (const [staffId, v] of Object.entries(byStaff)) {
      if (v === "off") inner[staffId] = "off"
      else if (isSlot(v)) inner[staffId] = { start: v.start, end: v.end }
    }
    if (Object.keys(inner).length > 0) next[dateKey] = inner
  }
  return next
}

type AdminShiftAvailabilityContextValue = {
  /** 既定値と上書きをマージした表示用の解決結果 */
  resolveStaffDay: (staff: Staff, day: Date) => ResolvedShiftDay
  /** 上書きを保存。null でその日の上書きを削除（既定に戻す） */
  setOverride: (
    staffId: string,
    dateKey: string,
    value: ShiftOverrideValue | null,
  ) => void
}

const AdminShiftAvailabilityContext =
  createContext<AdminShiftAvailabilityContextValue | null>(null)

export function AdminShiftAvailabilityProvider({ children }: { children: ReactNode }) {
  const [overrides, setOverrides] = useState<OverridesMap>({})

  useEffect(() => {
    setOverrides(normalizeOverrides(loadInitial()))
  }, [])

  const persist = useCallback((next: OverridesMap) => {
    setOverrides(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  const resolveStaffDay = useCallback(
    (staff: Staff, day: Date): ResolvedShiftDay => {
      const dateKey = toDateKey(day)
      const o = overrides[dateKey]?.[staff.id]
      if (o === "off") return { kind: "off_explicit" }
      if (o && typeof o === "object") return { kind: "work", slot: o }
      const base = getStaffAvailabilityForDay(staff, day)
      if (!base) return { kind: "none" }
      return { kind: "work", slot: base }
    },
    [overrides],
  )

  const setOverride = useCallback(
    (staffId: string, dateKey: string, value: ShiftOverrideValue | null) => {
      persist((prev) => {
        const next = { ...prev }
        const dayMap = { ...(next[dateKey] ?? {}) }
        if (value === null) {
          delete dayMap[staffId]
          if (Object.keys(dayMap).length === 0) delete next[dateKey]
          else next[dateKey] = dayMap
        } else {
          next[dateKey] = { ...dayMap, [staffId]: value }
        }
        return next
      })
    },
    [persist],
  )

  const value = useMemo(
    () => ({
      resolveStaffDay,
      setOverride,
    }),
    [resolveStaffDay, setOverride],
  )

  return (
    <AdminShiftAvailabilityContext.Provider value={value}>
      {children}
    </AdminShiftAvailabilityContext.Provider>
  )
}

export function useAdminShiftAvailability() {
  const ctx = useContext(AdminShiftAvailabilityContext)
  if (!ctx) {
    throw new Error("useAdminShiftAvailability must be used within AdminShiftAvailabilityProvider")
  }
  return ctx
}
