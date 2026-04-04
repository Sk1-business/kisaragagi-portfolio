import { ADMIN_TRAINERS_LIST_PATH } from "@/constants/adminApi"
import { apiFetch } from "@/lib/api"
import type { Staff } from "@/features/admin/types/staff"

function normalizeTrainerColor(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim() : ""
  if (/^#[0-9A-Fa-f]{6}$/i.test(s)) return s.toLowerCase()
  if (/^[0-9A-Fa-f]{6}$/i.test(s)) return `#${s.toLowerCase()}`
  return "#64748b"
}

/** `trainers.is_active` — true のときだけ一覧に含める。未指定は true とみなす（後方互換） */
function parseTrainerIsActive(o: Record<string, unknown>): boolean {
  const v = o.is_active ?? o.isActive
  if (v === undefined || v === null) return true
  if (typeof v === "boolean") return v
  if (typeof v === "number") return v === 1
  if (typeof v === "string") {
    const t = v.trim().toLowerCase()
    return t === "1" || t === "true"
  }
  return Boolean(v)
}

/** `GET /api/admin/trainers` の各行を `Staff` に（`trainer_id` / `id`・`name`・`color` 等） */
export function mapTrainerRowToStaff(row: unknown): Staff | null {
  if (!row || typeof row !== "object") return null
  const o = row as Record<string, unknown>
  if (!parseTrainerIsActive(o)) return null
  const idRaw = o.trainer_id ?? o.id
  const id = idRaw != null ? String(idRaw) : ""
  const name = typeof o.name === "string" ? o.name.trim() : ""
  if (!id || !name) return null
  const color = normalizeTrainerColor(
    o.color ?? o.display_color ?? o.calendar_color,
  )
  const descRaw = o.description
  const description =
    typeof descRaw === "string" && descRaw.trim()
      ? descRaw.trim()
      : undefined
  return { id, name, color, description }
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
 * 対象サロンのトレーナー（`is_active` が true / 1 の行のみ。未指定は表示する）。
 * 要 `access_token` Cookie。
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
 * `POST /api/admin/trainers` — トレーナー登録。
 * `display_order` はサーバーが当サロンの `trainers.display_order` 最大値+1で採番する。
 * `is_active: true` はサーバー側デフォルト。
 */
export async function postAdminTrainer(input: {
  name: string
  color: string
  /** 未入力のときは送らない（NULL 相当） */
  description?: string
}): Promise<Staff> {
  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    color: input.color.trim(),
  }
  const d = input.description?.trim()
  if (d) {
    payload.description = d
  }

  const res = await apiFetch(ADMIN_TRAINERS_LIST_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
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
