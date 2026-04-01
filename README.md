# Struct Front

予約管理SaaS（モック）用のフロントエンドプロジェクトです。  
Vite + React + TypeScript をベースに、Tailwind CSS と shadcn/ui を利用しています。

## 技術スタック

- Frontend: React
- Build Tool: Vite
- Language: TypeScript
- Styling: Tailwind CSS
- UI: shadcn/ui, Lucide Icons
- Routing: React Router

## バージョン

主要な依存関係のバージョン（`package.json` 時点）:

- Node.js: 18+ 推奨
- npm: 9+ 推奨
- React: `^19.2.0`
- React DOM: `^19.2.0`
- TypeScript: `~5.9.3`
- Vite: `^7.3.1`
- React Router DOM: `^7.13.1`
- Tailwind CSS: `^4.2.1`
- @tailwindcss/vite: `^4.2.1`
- Lucide React: `^0.575.0`

## クローン方法

### Windows (PowerShell)

```bash
git clone <your-repository-url>
cd Struct_front
npm install
```

### Mac (Terminal)

```bash
git clone <your-repository-url>
cd Struct_front
npm install
```

## 管理者画面（モック）

- 予約: `localStorage` `saas_admin_reservations_v2`
- スタッフ: `saas_admin_staff_v1`（`/admin/staff`）。同名（前後空白除き）の登録・編集は不可。未終了の確定予約がある担当は削除不可。

## バックエンド・周辺ツール（開発）

| 用途 | 接続 |
|------|------|
| FastAPI（API サーバー） | `http://localhost:8000` |
| PostgreSQL 16（メイン DB） | ポート `5433` |
| Mailpit（SMTP / Web UI） | SMTP `1025` / Web UI `http://localhost:8025` |
| Adminer（DB ブラウザ） | `http://localhost:8081` |

フロントの `npm run dev` は `/api` を上記 FastAPI にプロキシします（既定 `http://localhost:8000`。変更は `.env` の `VITE_DEV_PROXY_TARGET`）。`.env.example` を参照。

**バックエンドリポジトリ**: 本プロジェクトと同階層の **Struct**（FastAPI）。管理者ログイン／ログアウト／`me` は `Struct/app/api/admin/auth.py`（ルーターに `prefix=/api/admin`）と対応しています。フロント側のパス定数は `src/constants/adminApi.ts` を参照。

### 管理者ログイン（API 連携時）

バックエンドに登録したアカウント例:

- メール: `admin@example.com`
- パスワード: `admin123`

（モック画面の開発用表示とも一致）

### 管理者向け API（フロントが想定するエンドポイント）

| メソッド | パス | 説明 |
|----------|------|------|
| `POST` | `/api/admin/login` | 認証成功時 `Set-Cookie` で `access_token`（HttpOnly 等はサーバー設定） |
| `POST` | `/api/admin/logout` | Cookie を削除。以降は未認証扱い |
| `GET` | `/api/admin/me` | セッション有効なら `200`、無効・未ログインなら `401`（管理者レイアウトの表示前チェック・戻る操作後の再検証に使用） |
| `GET` | `/api/admin/reservations` | 予約一覧（要ログイン）。実装は `Struct/app/api/admin/reservations.py`。**ページネーション** `items` / `total` / `page` / `per_page`。クエリは `date`, `view`（`day`\|`week`）等（詳細は OpenAPI）。フロントは `month` 表示時は日付指定なしで全件をページング取得、`day`\|`week` では該当範囲に絞り込み |
| `GET` | `/api/admin/reservations/{reservation_id}` | 予約1件（要ログイン）。`ReservationOut`。予約詳細画面（`/admin/reservations/:id`）で使用 |

ログアウト後は `replace` でログイン画面へ遷移し、戻る／bfcache 復帰時も `GET /api/admin/me` で再確認してセッション切れならログインへ戻します。

予約カレンダー（`/admin/calendar`）表示時に `GET /api/admin/reservations` を呼び、一覧をコンテキストへ反映します。`401` のときはログイン画面へ遷移します。

## 開発・ビルド

```bash
# 開発サーバー起動
npm run dev

# Lint
npm run lint

# 本番ビルド
npm run build
```
