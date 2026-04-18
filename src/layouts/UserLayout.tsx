import { ArrowLeft, Dumbbell, LogOut, UserRound } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { logoutCustomer } from "@/features/auth/api/customerAuthApi"
import { useCustomerSessionIdleTimeout } from "@/features/auth/hooks/useCustomerSessionIdleTimeout"
import { fetchSalonPage } from "@/features/user/api/userSalonApi"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import { subscribeCustomerSessionInvalidation } from "@/lib/customerSession"

export function UserLayout() {
  const shopId = useShopId()
  const navigate = useNavigate()
  const location = useLocation()
  const [shopName, setShopName] = useState("予約ポータル")

  useCustomerSessionIdleTimeout(true)

  useEffect(() => {
    if (!shopId) return
    fetchSalonPage(shopId)
      .then((s) => setShopName(s.salon_name || "予約ポータル"))
      .catch(() => {})
  }, [shopId])

  useEffect(() => {
    return subscribeCustomerSessionInvalidation((reason) => {
      const params = new URLSearchParams()
      if (shopId) params.set("shopId", shopId)
      if (reason === "idle") params.set("reason", "idle_timeout")
      else params.set("reason", "session_expired")
      const q = params.toString()
      void logoutCustomer().finally(() => {
        navigate(`${ROUTES.customerLogin}${q ? `?${q}` : ""}`, { replace: true })
      })
    })
  }, [navigate, shopId])

  const isTopLevel = location.pathname === ROUTES.userHome

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(buildPathWithShopId(ROUTES.userHome, shopId))
  }

  async function handleLogout() {
    await logoutCustomer()
    navigate(buildPathWithShopId(ROUTES.customerLogin, shopId))
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
              <div className="leading-tight">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  予約者画面
                </p>
                <p className="text-sm font-semibold text-foreground">{shopName}</p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)} aria-label="マイページ">
                <UserRound className="size-3.5 min-[420px]:mr-1" />
                <span className="max-[419px]:sr-only">マイページ</span>
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => void handleLogout()}
              aria-label="ログアウト"
            >
              <LogOut className="size-3.5 min-[420px]:mr-1" />
              <span className="max-[419px]:sr-only">ログアウト</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <Outlet />
      </div>
    </main>
  )
}
