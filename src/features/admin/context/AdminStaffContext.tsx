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
    image_url?: string
    display_order?: number
    /** サロンメニューID。POST /api/admin/trainers の menu_ids にまとめて送る */
    menuIds: string[]
  }) => Promise<Staff | null>
  updateStaff: (
    id: string,
    input: {
      name: string
      color: string
      description: string
      image_url: string
      display_order?: number
      menuIds: string[]
    },
  ) => Promise<boolean>
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
      image_url?: string
      display_order?: number
      menuIds: string[]
    }): Promise<Staff | null> => {
      const name = input.name.trim()
      const color = input.color.trim()
      if (!name || !isValidHexColor(color)) return null
      const normalized = normalizeColorInput(color)
      const menuIds = input.menuIds
        .map((id) => String(id).trim())
        .filter(Boolean)
      const base: Parameters<typeof postAdminTrainer>[0] = {
        name,
        color: normalized,
        description: input.description?.trim() || undefined,
        image_url: input.image_url?.trim() || undefined,
      }
      if (
        input.display_order !== undefined &&
        Number.isFinite(input.display_order)
      ) {
        base.display_order = Math.round(input.display_order)
      }
      try {
        const created = await postAdminTrainer({
          ...base,
          menu_ids: menuIds,
        })
        if (!created) return null
        const withMenus: Staff = {
          ...created,
          menuIds: menuIds.length > 0 ? [...menuIds] : created.menuIds,
        }
        setStaffList((prev) =>
          [...prev.filter((s) => s.id !== withMenus.id), withMenus].sort((a, b) =>
            a.name.localeCompare(b.name, "ja"),
          ),
        )
        return withMenus
      } catch (e) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") throw e
        return null
      }
    },
    [],
  )

  const updateStaff = useCallback(
    async (
      id: string,
      input: {
        name: string
        color: string
        description: string
        image_url: string
        display_order?: number
        menuIds: string[]
      },
    ): Promise<boolean> => {
      const name = input.name.trim()
      const color = input.color.trim()
      if (!name || !isValidHexColor(color)) return false
      const normalized = normalizeColorInput(color)
      const menuIds = input.menuIds
        .map((mid) => String(mid).trim())
        .filter(Boolean)
      try {
        await putAdminTrainer(id, {
          name,
          color: normalized,
          description: input.description,
          image_url: input.image_url,
          display_order: input.display_order,
          menu_ids: menuIds,
        })
        const descTrim = input.description.trim()
        const imgTrim = input.image_url.trim()
        setStaffList((prev) => {
          const idx = prev.findIndex((s) => s.id === id)
          if (idx < 0) return prev
          const next = [...prev]
          const cur = next[idx]
          next[idx] = {
            ...cur,
            name,
            color: normalized,
            description: descTrim || undefined,
            image_url: imgTrim || undefined,
            display_order: input.display_order,
            menuIds: [...menuIds],
          }
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
