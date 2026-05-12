/**
 * Struct バックエンドの管理者認証 API。
 * 実装: リポジトリ `Struct/app/api/admin/auth.py` のルーター
 * （`app/main.py` で `prefix="/api/admin"` が付与される）
 *
 * - POST …/login   — Set-Cookie: access_token
 * - POST …/logout  — Cookie 削除
 * - GET  …/me      — セッション確認（AdminAuthGuard で使用）
 */
export const ADMIN_AUTH_PATHS = {
  login: "/api/admin/login",
  logout: "/api/admin/logout",
  me: "/api/admin/me",
  /** Struct `POST /api/admin/signup` — admin_users + salons + salon_profiles を作成 */
  signup: "/api/admin/signup",
} as const

/** Struct `app/api/admin/profile.py` — `GET/PUT /api/admin/profile` */
export const ADMIN_PROFILE_PATH = "/api/admin/profile" as const

/** Struct `app/api/admin/trainers.py` — `GET /trainers`（prefix `/api/admin`） */
export const ADMIN_TRAINERS_LIST_PATH = "/api/admin/trainers" as const

/**
 * Struct `app/api/admin/admin_users.py` —
 * `GET/POST /api/admin/admin-users` … 管理者/スタッフアカウント（admin_users）の作成・一覧。
 * オーナー権限が必要。
 */
export const ADMIN_USERS_LIST_PATH = "/api/admin/admin-users" as const

/** `GET/POST …/trainers/{trainer_id}/shifts` */
export function adminTrainerShiftsPath(trainerId: string): string {
  return `${ADMIN_TRAINERS_LIST_PATH}/${encodeURIComponent(trainerId)}/shifts`
}

/** Struct `app/api/admin/reservations.py` — `GET /reservations`（prefix `/api/admin`） */
export const ADMIN_RESERVATIONS_LIST_PATH = "/api/admin/reservations" as const

/** Struct `app/api/admin/settings.py` — `GET /settings`（`business_hours` 等） */
export const ADMIN_SETTINGS_PATH = "/api/admin/settings" as const

/** メニュー CRUD（`GET/POST /menus`、`PUT/DELETE /menus/{menu_id}`） */
export const ADMIN_MENUS_LIST_PATH = "/api/admin/menus" as const

export function adminMenuDetailPath(menuId: string): string {
  return `${ADMIN_MENUS_LIST_PATH}/${encodeURIComponent(menuId)}`
}
