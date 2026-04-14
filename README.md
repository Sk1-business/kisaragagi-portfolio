# Struct Front

予約管理SaaS用のフロントエンド（画面側）プロジェクトです。

---

## このプロジェクトで使っている技術

| 技術 | 役割 |
|---|---|
| **React** | 画面の部品（ボタン、フォームなど）を組み立てるためのライブラリ |
| **TypeScript** | JavaScript に型チェックを加えた言語。入力ミスをビルド時に検出できる |
| **Vite** | 開発サーバーの起動やビルド（本番用ファイルの生成）を行うツール |
| **Tailwind CSS** | クラス名を書くだけでスタイルが当たる CSS フレームワーク |
| **shadcn/ui** | Tailwind ベースの UI 部品集（ボタン、カードなど） |
| **React Router** | ページ遷移を管理するライブラリ |
| **Lucide Icons** | アイコン素材集 |

---

## 環境構築（初回のみ）

以下の 3 つのソフトウェアをインストールします。

### 1. Git（ソースコードの管理ツール）

| OS | 手順 |
|---|---|
| **Mac** | ターミナルで `git --version` を実行。未インストールの場合は自動でインストールが始まります |
| **Windows** | [git-scm.com](https://git-scm.com/) からインストーラをダウンロードし、画面の指示に従ってインストール |

### 2. Node.js（JavaScript の実行環境）

Node.js をインストールすると、パッケージ管理ツール **npm** も一緒に入ります。

| OS | 手順 |
|---|---|
| **Mac** | [nodejs.org](https://nodejs.org/) から **LTS 版**（推奨版）をダウンロードしてインストール |
| **Windows** | 同上。インストーラの指示に従い、デフォルト設定のまま進めて OK |

> **推奨バージョン**: Node.js 18 以上 / npm 9 以上

インストール後、ターミナル（Mac）または PowerShell（Windows）で以下を実行して確認できます。

```bash
node -v
npm -v
```

### 3. Cursor（コードエディタ）

[Cursor](https://www.cursor.com/) をインストールしてください（Windows / Mac 両対応）。  
本プロジェクトでは Cursor に AI ルール（`.cursor/rules/`）を設定しており、コーディング時に自動でプロジェクトのルールが適用されます。

---

## プロジェクトのセットアップ

ターミナル（Mac）または PowerShell（Windows）を開き、以下のコマンドを**順番に**実行してください。

### 1. ソースコードを取得する

```bash
git clone <リポジトリURL>
```

> `<リポジトリURL>` はチームから共有される GitHub の URL に置き換えてください。

### 2. プロジェクトフォルダに移動する

```bash
cd SaaS_frontend
```

### 3. 必要なパッケージをインストールする

```bash
npm install
```

初回は数分かかることがあります。完了すると `node_modules` フォルダが作られます。

### 4. 開発サーバーを起動する

```bash
npm run dev
```

起動後、ターミナルに表示される URL（通常 `http://localhost:5173`）をブラウザで開くと画面が表示されます。

**止めるとき**: ターミナルで `Ctrl + C` を押してください。

---

## よく使うコマンド

プロジェクトフォルダ内で実行します。

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバーを起動する（コード変更が即座に画面に反映される） |
| `npm run build` | 本番用ファイルを生成する（`dist` フォルダに出力） |
| `npm run lint` | コードの書き方チェックを実行する |
| `npm run preview` | `build` で生成したファイルをローカルで確認する |

---

## トラブルシューティング

### `npm install` でエラーが出る

- Node.js のバージョンが古い可能性があります。`node -v` で 18 以上か確認してください。
- ネットワーク接続を確認してください（パッケージのダウンロードが必要です）。

### `npm run dev` でポートが使用中と表示される

別のアプリが同じポート（5173）を使っています。  
既に起動している開発サーバーがないか確認するか、ターミナルを閉じてやり直してください。

### 画面が真っ白になる

ブラウザの開発者ツール（`F12`）を開き、Console タブでエラーメッセージを確認してください。

---

## バージョン情報

主要な依存関係のバージョン（`package.json` 時点）:

- Node.js: 18+ 推奨
- npm: 9+ 推奨
- React: `^19.2.0`
- TypeScript: `~5.9.3`
- Vite: `^7.3.1`
- Tailwind CSS: `^4.2.1`
- @tailwindcss/vite: `^4.2.1`
- Lucide React: `^0.575.0`

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
