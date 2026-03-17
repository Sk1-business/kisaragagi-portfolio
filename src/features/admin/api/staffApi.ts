import type { Staff } from "@/features/admin/types/staff"

const MOCK_STAFF: Staff[] = [
  { id: "st_001", name: "担当者A", color: "#3b82f6" },
  { id: "st_002", name: "担当者B", color: "#22c55e" },
  { id: "st_003", name: "担当者C", color: "#f59e0b" },
]

export async function fetchStaffList(): Promise<Staff[]> {
  await new Promise((r) => setTimeout(r, 100))
  return [...MOCK_STAFF]
}

export function getStaffById(id: string, list: Staff[]): Staff | undefined {
  return list.find((s) => s.id === id)
}
