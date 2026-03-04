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

## 開発・ビルド

```bash
# 開発サーバー起動
npm run dev

# Lint
npm run lint

# 本番ビルド
npm run build
```

## 環境変数

`/api/health` などのAPIアクセス先は `VITE_API_BASE_URL` で設定します。

- 開発時: `.env.development`（例: `http://localhost:8000`）
- 本番時: デプロイ先の環境変数に `VITE_API_BASE_URL` を設定
- 共有用テンプレート: `.env.example`

