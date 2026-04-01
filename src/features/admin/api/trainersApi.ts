import { ADMIN_TRAINERS_LIST_PATH } from "@/constants/adminApi"
import { apiFetch } from "@/lib/api"
import type { Staff } from "@/features/admin/types/staff"

function normalizeTrainerColor(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim() : ""
  if (/^#[0-9A-Fa-f]{6}$/i.test(s)) return s.toLowerCase()
  if (/^[0-9A-Fa-f]{6}$/i.test(s)) return `#${s.toLowerCase()}`
  return "#64748b"
}

/** `GET /api/admin/trainers` の各行を `Staff` に（`trainer_id` / `id`・`name`・`color` 等） */
export function mapTrainerRowToStaff(row: unknown): Staff | null {
  if (!row || typeof row !== "object") return null
  const o = row as Record<string, unknown>
  const idRaw = o.trainer_id ?? o.id
  const id = idRaw != null ? String(idRaw) : ""
  const name = typeof o.name === "string" ? o.name.trim() : ""
  if (!id || !name) return null
  const color = normalizeTrainerColor(
    o.color ?? o.display_color ?? o.calendar_color,
  )
  return { id, name, color }
}

function extractTrainerRows(data: unknown): unknown[] {
  const out: unknown[] = []
  if (Array.isArray(data)) {
    for (const x of data) {
      if (x && typeof x === "object") out.push(x)
    }
  } else if (data && typeof data === "object") {
    const o = data as Record<string, unknown>
    const arr = o.trainers ?? o.items ?? o.data ?? o.results ?? o.rows
    if (Array.isArray(arr)) {
      for (const x of arr) {
        if (x && typeof x === "object") out.push(x)
      }
    }
  }
  return out
}

/**
 * 対象サロンの全トレーナー（`trainers` テーブル相当）。要 `access_token` Cookie。
 */
export async function fetchAdminTrainers(): Promise<Staff[]> {
  const res = await apiFetch(ADMIN_TRAINERS_LIST_PATH, { method: "GET" })
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED")
  }
  if (!res.ok) {
    throw new Error("FETCH_FAILED")
  }
  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = null
  }
  const rows = extractTrainerRows(data)
  const list: Staff[] = []
  for (const row of rows) {
    const s = mapTrainerRowToStaff(row)
    if (s) list.push(s)
  }
  return list.sort((a, b) => a.name.localeCompare(b.name, "ja"))
}

/**
 * カレンダー絞り込み用のトレーナー名一覧（`fetchAdminTrainers` ベース）。
 */
export async function fetchAdminTrainerNames(): Promise<string[]> {
  const staff = await fetchAdminTrainers()
  return [...new Set(staff.map((s) => s.name.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "ja"),
  )
}

function trainerDetailUrl(trainerId: string): string {
  return `${ADMIN_TRAINERS_LIST_PATH}/${encodeURIComponent(trainerId)}`
}

/**
 * `PUT /api/admin/trainers/{trainer_id}` — `name`・表示色（`color`）を更新。
 */
export async function putAdminTrainer(
  trainerId: string,
  input: { name: string; color: string },
): Promise<void> {
  const res = await apiFetch(trainerDetailUrl(trainerId), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name.trim(),
      color: input.color.trim(),
    }),
  })
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED")
  }
  if (!res.ok) {
    throw new Error("FETCH_FAILED")
  }
}

/**
 * `POST /api/admin/trainers` — トレーナー追加（バックエンド実装がある場合）。
 */
export async function postAdminTrainer(input: {
  name: string
  color: string
}): Promise<Staff> {
  const res = await apiFetch(ADMIN_TRAINERS_LIST_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name.trim(),
      color: input.color.trim(),
    }),
  })
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED")
  }
  if (!res.ok) {
    throw new Error("FETCH_FAILED")
  }
  let data: unknown
  try {
    data = await res.json()
  } catch {
    data = null
  }
  const mapped = mapTrainerRowToStaff(data)
  if (mapped) return mapped
  const list = await fetchAdminTrainers()
  const n = input.name.trim()
  const found = list.find((s) => s.name === n)
  if (found) return found
  throw new Error("INVALID_RESPONSE")
}

/**
 * `PUT /api/admin/trainers/{trainer_id}` で無効化（`is_active: false`）。
 * 編集と同じエンドポイントのため、`name`・`color` も送る（PUT 部分更新でないサーバー向け）。
 * 過去の予約データはサーバー側で保持される想定。
 */
export async function deactivateAdminTrainer(staff: Staff): Promise<void> {
  const res = await apiFetch(trainerDetailUrl(staff.id), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: staff.name.trim(),
      color: staff.color.trim(),
      is_active: false,
    }),
  })
  if (res.status === 401) {
    throw new Error("UNAUTHORIZED")
  }
  if (!res.ok) {
    throw new Error("FETCH_FAILED")
  }
}
