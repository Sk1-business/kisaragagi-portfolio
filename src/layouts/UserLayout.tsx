import { ArrowLeft, Dumbbell } from "lucide-react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"

function getPageTitle(pathname: string): string {
  if (pathname === ROUTES.userHome) return "トップページ"
  if (pathname === ROUTES.userReservationNomination) return "トレーナー・メニュー選択"
  if (pathname === ROUTES.userReservationChangeMode) return "予約変更"
  if (pathname === ROUTES.userReservationSchedule) return "日時選択"
  if (pathname === ROUTES.userReservationInput) return "予約情報入力"
  if (pathname === ROUTES.userReservationConfirm) return "予約内容の確認"
  if (pathname === ROUTES.userReservationPaypayReturn) return "PayPay決済"
  return "予約画面"
}

export function UserLayout() {
  const shopId = useShopId()
  const navigate = useNavigate()
  const location = useLocation()

  const isTopLevel = location.pathname === ROUTES.userHome
  const pageTitle = getPageTitle(location.pathname)

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(buildPathWithShopId(ROUTES.userHome, shopId))
  }

  return (
    <main className="min-h-dvh bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {!isTopLevel ? (
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                type="button"
                onClick={handleBack}
                aria-label="前の画面へ戻る"
              >
                <ArrowLeft className="size-4" />
              </Button>
            ) : null}
            <Link to={buildPathWithShopId(ROUTES.userHome, shopId)} className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-900">
                <Dumbbell className="size-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-foreground">{pageTitle}</span>
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <Outlet />
      </div>
    </main>
  )
}
