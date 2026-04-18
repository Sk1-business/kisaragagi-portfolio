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
---

## 決済機能（クレジット / PayPay）を動かす手順

### 1. フロントの `.env` を設定

`SaaS_frontend/.env`（または `.env.local`）に以下を設定してください。

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### 2. Backend を先に起動

このフロントは決済APIを Backend 経由で呼び出します。`Struct` 側で次を実行してください。

- `uv run alembic upgrade head`
- `uv run uvicorn app.main:app --reload --port 8000`
- `stripe listen --forward-to http://localhost:8000/api/payments/webhook/stripe`（クレジット決済で必須）

### 3. フロントを起動

```bash
npm install
npm run dev
```

### 4. 動作確認

- クレジット決済: `credit` を選択して Stripe テストカードで支払い
- PayPay 決済: `paypay` を選択して支払いし、`/user/reservation/paypay-return` に戻る

### 5. よくある確認ポイント

- `VITE_API_BASE_URL` が `http://localhost:8000` になっているか
- Stripe の公開鍵と秘密鍵が同じアカウントのものか
- PayPay で 401 の場合、Backend の `PAYPAY_API_KEY` / `PAYPAY_API_SECRET` / `PAYPAY_MERCHANT_ID` の組み合わせを確認

## Stripe / PayPay アカウント準備手順（追補）

このフロントは Backend 側のキー設定が完了している前提で決済を呼び出します。

### 1. Stripe の準備（Backend 側）

- Stripe サインアップ: https://dashboard.stripe.com/register
- テストモード ON
- `Developers > API keys` からキー取得
  - `Publishable key` -> `VITE_STRIPE_PUBLISHABLE_KEY`（Frontend）
  - `Secret key` -> `STRIPE_SECRET_KEY`（Backend）
- `stripe listen --forward-to http://localhost:8000/api/payments/webhook/stripe`
  - 出力された `whsec_...` -> `STRIPE_WEBHOOK_SECRET`（Backend）

### 2. PayPay for Developers の準備（Backend 側）

- サインアップ: https://developer.paypay.ne.jp/
- Sandbox アプリ作成（Web Payment）
- 取得した値を Backend `.env` へ設定
  - `PAYPAY_API_KEY`
  - `PAYPAY_API_SECRET`
  - `PAYPAY_MERCHANT_ID`
  - `PAYPAY_MODE=sandbox`

### 3. Frontend `.env` 設定

`SaaS_frontend/.env`（または `.env.local`）:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### 4. 反映手順

- Backend 再起動
- Frontend 再起動
- 予約画面で `credit` / `paypay` を選んで動作確認
