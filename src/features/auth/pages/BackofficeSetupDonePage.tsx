import { useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"

/**
 * 初期設定（サロン情報→営業日・営業時間）の暫定完了画面。
 * 以降のステップ（メニュー/料金、スタッフ等）は未実装のため、
 * ここでは登録継続の導線を示すだけのプレースホルダー。
 */
export function BackofficeSetupDonePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const navState = location.state as
    | { fromBusinessHours?: boolean; email?: string }
    | null
  const email = typeof navState?.email === "string" ? navState.email : ""
  const fromBusinessHours = Boolean(navState?.fromBusinessHours)

  // 直接URLを叩いた場合は前ステップへ戻す
  useEffect(() => {
    if (!fromBusinessHours) {
      navigate(ROUTES.backofficeInitialSetup, { replace: true })
    }
  }, [fromBusinessHours, navigate])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-6"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          営業日・営業時間を保存しました
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          ここまでの初期設定はローカルに保存されました。
          <br />
          以降のステップ（メニュー/料金、スタッフ登録など）は現在準備中です。
        </p>
        {email ? (
          <p className="mt-4 text-xs text-emerald-700">
            認証済みメールアドレス: <span className="font-mono">{email}</span>
          </p>
        ) : null}

        <div className="mt-6 flex flex-col items-stretch gap-2 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(ROUTES.backofficeSetupBusinessHours, {
                replace: true,
                state: { fromInitialSetup: true, email },
              })
            }
          >
            営業日・営業時間を見直す
          </Button>
          <Button asChild type="button">
            <Link to={ROUTES.backofficeLogin}>ログイン画面へ</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
