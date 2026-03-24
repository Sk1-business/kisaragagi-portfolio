import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { cloneDefaultStaff } from "@/features/admin/api/staffApi"
import type { Staff } from "@/features/admin/types/staff"

const STORAGE_KEY = "saas_admin_staff_v1"

function newStaffId(): string {
  return `st_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
}

function isValidHexColor(s: string): boolean {
  const t = s.trim().toLowerCase()
  const h = t.startsWith("#") ? t : `#${t}`
  return /^#[0-9a-f]{6}$/.test(h)
}

function normalizeColorInput(s: string): string {
  const t = s.trim().toLowerCase()
  return t.startsWith("#") ? t : `#${t}`
}

function loadInitial(): Staff[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed) && parsed.length > 0) {
        const list = parsed.filter(
          (x): x is Staff =>
            x != null &&
            typeof x === "object" &&
            typeof (x as Staff).id === "string" &&
            typeof (x as Staff).name === "string" &&
            typeof (x as Staff).color === "string",
        )
        if (list.length > 0) return list
      }
    }
  } catch {
    /* ignore */
  }
  return cloneDefaultStaff()
}

type AdminStaffContextValue = {
  staffList: Staff[]
  loading: boolean
  addStaff: (input: { name: string; color: string }) => Staff | null
  updateStaff: (id: string, input: { name: string; color: string }) => boolean
  deleteStaff: (id: string) => void
}

const AdminStaffContext = createContext<AdminStaffContextValue | null>(null)

export function AdminStaffProvider({ children }: { children: ReactNode }) {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setStaffList(loadInitial())
    setLoading(false)
  }, [])

  const addStaff = useCallback((input: { name: string; color: string }): Staff | null => {
    const name = input.name.trim()
    const color = input.color.trim()
    if (!name || !isValidHexColor(color)) return null
    const normalized = normalizeColorInput(color)
    const staff: Staff = { id: newStaffId(), name, color: normalized }
    setStaffList((prev) => {
      const next = [...prev, staff]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    return staff
  }, [])

  const updateStaff = useCallback((id: string, input: { name: string; color: string }): boolean => {
    const name = input.name.trim()
    const color = input.color.trim()
    if (!name || !isValidHexColor(color)) return false
    const normalized = normalizeColorInput(color)
    let ok = false
    setStaffList((prev) => {
      const idx = prev.findIndex((s) => s.id === id)
      if (idx < 0) return prev
      ok = true
      const next = [...prev]
      next[idx] = { ...next[idx], name, color: normalized }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
    return ok
  }, [])

  const deleteStaff = useCallback((id: string) => {
    setStaffList((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (next.length === prev.length) return prev
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      staffList,
      loading,
      addStaff,
      updateStaff,
      deleteStaff,
    }),
    [staffList, loading, addStaff, updateStaff, deleteStaff],
  )

  return (
    <AdminStaffContext.Provider value={value}>{children}</AdminStaffContext.Provider>
  )
}

export function useAdminStaff() {
  const ctx = useContext(AdminStaffContext)
  if (!ctx) {
    throw new Error("useAdminStaff must be used within AdminStaffProvider")
  }
  return ctx
}
