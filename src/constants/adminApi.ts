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
} as const

/** Struct `app/api/admin/trainers.py` — `GET /trainers`（prefix `/api/admin`） */
export const ADMIN_TRAINERS_LIST_PATH = "/api/admin/trainers" as const

/** Struct `app/api/admin/reservations.py` — `GET /reservations`（prefix `/api/admin`） */
export const ADMIN_RESERVATIONS_LIST_PATH = "/api/admin/reservations" as const
