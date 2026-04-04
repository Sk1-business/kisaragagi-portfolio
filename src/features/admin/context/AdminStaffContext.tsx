import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  deactivateAdminTrainer,
  fetchAdminTrainers,
  postAdminTrainer,
  putAdminTrainer,
} from "@/features/admin/api/trainersApi"
import type { Staff } from "@/features/admin/types/staff"

function isValidHexColor(s: string): boolean {
  const t = s.trim().toLowerCase()
  const h = t.startsWith("#") ? t : `#${t}`
  return /^#[0-9a-f]{6}$/.test(h)
}

function normalizeColorInput(s: string): string {
  const t = s.trim().toLowerCase()
  return t.startsWith("#") ? t : `#${t}`
}

type AdminStaffContextValue = {
  staffList: Staff[]
  loading: boolean
  /** 初回（または再取得）の一覧取得に失敗したとき */
  staffLoadError: boolean
  refetchStaff: () => Promise<void>
  addStaff: (input: {
    name: string
    color: string
    description?: string
  }) => Promise<Staff | null>
  updateStaff: (id: string, input: { name: string; color: string }) => Promise<boolean>
  deleteStaff: (staff: Staff) => Promise<void>
}

const AdminStaffContext = createContext<AdminStaffContextValue | null>(null)

export function AdminStaffProvider({ children }: { children: ReactNode }) {
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [staffLoadError, setStaffLoadError] = useState(false)

  const refetchStaff = useCallback(async () => {
    setLoading(true)
    setStaffLoadError(false)
    try {
      const list = await fetchAdminTrainers()
      setStaffList(list)
    } catch {
      setStaffLoadError(true)
      setStaffList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refetchStaff()
  }, [refetchStaff])

  const addStaff = useCallback(
    async (input: {
      name: string
      color: string
      description?: string
    }): Promise<Staff | null> => {
      const name = input.name.trim()
      const color = input.color.trim()
      if (!name || !isValidHexColor(color)) return null
      const normalized = normalizeColorInput(color)
      try {
        const created = await postAdminTrainer({
          name,
          color: normalized,
          description: input.description?.trim() || undefined,
        })
        setStaffList((prev) =>
          [...prev.filter((s) => s.id !== created.id), created].sort((a, b) =>
            a.name.localeCompare(b.name, "ja"),
          ),
        )
        return created
      } catch (e) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") throw e
        return null
      }
    },
    [],
  )

  const updateStaff = useCallback(
    async (id: string, input: { name: string; color: string }): Promise<boolean> => {
      const name = input.name.trim()
      const color = input.color.trim()
      if (!name || !isValidHexColor(color)) return false
      const normalized = normalizeColorInput(color)
      try {
        await putAdminTrainer(id, { name, color: normalized })
        setStaffList((prev) => {
          const idx = prev.findIndex((s) => s.id === id)
          if (idx < 0) return prev
          const next = [...prev]
          next[idx] = { ...next[idx], name, color: normalized }
          return next.sort((a, b) => a.name.localeCompare(b.name, "ja"))
        })
        return true
      } catch (e) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") throw e
        return false
      }
    },
    [],
  )

  const deleteStaff = useCallback(async (staff: Staff): Promise<void> => {
    await deactivateAdminTrainer(staff)
    setStaffList((prev) => prev.filter((s) => s.id !== staff.id))
  }, [])

  const value = useMemo(
    () => ({
      staffList,
      loading,
      staffLoadError,
      refetchStaff,
      addStaff,
      updateStaff,
      deleteStaff,
    }),
    [
      staffList,
      loading,
      staffLoadError,
      refetchStaff,
      addStaff,
      updateStaff,
      deleteStaff,
    ],
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
