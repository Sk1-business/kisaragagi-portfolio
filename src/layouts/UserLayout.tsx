import { ArrowLeft, Dumbbell, LogOut, UserRound } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import {
  checkCustomerSessionAlive,
  logoutCustomer,
} from "@/features/auth/api/customerAuthApi"
import { useCustomerSessionIdleTimeout } from "@/features/auth/hooks/useCustomerSessionIdleTimeout"
import { fetchSalonPage } from "@/features/user/api/userSalonApi"
import { buildPathWithShopId, resolveShopName, useShopId } from "@/features/user/hooks/useShopId"
import { subscribeCustomerSessionInvalidated } from "@/lib/customerSession"

export function UserLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const shopId = useShopId()
  const [shopName, setShopName] = useState(() => resolveShopName(shopId))
  const isTopLevel = location.pathname === ROUTES.userHome
  const sessionEndingRef = useRef(false)
  const [sessionVerified, setSessionVerified] = useState(false)

  const endCustomerSessionAndRedirect = useCallback(
    async (reason: "idle_timeout" | "session_expired") => {
      if (sessionEndingRef.current) return
      sessionEndingRef.current = true
      try {
        await logoutCustomer()
        navigate(`${ROUTES.customerLogin}?reason=${reason}`, { replace: true })
      } finally {
        sessionEndingRef.current = false
      }
    },
    [navigate],
  )

  useCustomerSessionIdleTimeout(true)

  useEffect(() => {
    return subscribeCustomerSessionInvalidated((source) => {
      const reason = source === "idle" ? "idle_timeout" : "session_expired"
      void endCustomerSessionAndRedirect(reason)
    })
  }, [endCustomerSessionAndRedirect])

  /** 戻る・BFCache 復帰でも未ログインなら予約者画面を表示しない */
  useEffect(() => {
    let cancelled = false

    async function guard() {
      if (sessionEndingRef.current) return
      const ok = await checkCustomerSessionAlive()
      if (cancelled) return
      if (!ok) {
        navigate(`${ROUTES.customerLogin}?reason=require_login`, { replace: true })
        return
      }
      setSessionVerified(true)
    }

    void guard()
    return () => {
      cancelled = true
    }
  }, [location.pathname, location.key, navigate])

  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (!event.persisted) return
      void (async () => {
        if (sessionEndingRef.current) return
        const ok = await checkCustomerSessionAlive()
        if (!ok) {
          navigate(`${ROUTES.customerLogin}?reason=require_login`, { replace: true })
        }
      })()
    }

    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [navigate])

  async function handleLogout() {
    await logoutCustomer()
    navigate(ROUTES.customerLogin, { replace: true })
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(buildPathWithShopId(ROUTES.userHome, shopId))
  }

  useEffect(() => {
    if (!shopId) {
      setShopName("店舗")
      return
    }

    let mounted = true
    void fetchSalonPage(shopId)
      .then((page) => {
        if (!mounted) return
        setShopName(page.salon_name || resolveShopName(shopId))
      })
      .catch(() => {
        if (!mounted) return
        setShopName(resolveShopName(shopId))
      })

    return () => {
      mounted = false
    }
  }, [shopId])

  if (!sessionVerified) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white px-4">
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      </main>
    )
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
              <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>
                <UserRound className="mr-1 size-3.5" />
                マイページ
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={handleLogout}
            >
              <LogOut className="mr-1 size-3.5" />
              ログアウト
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Outlet />
      </div>
    </main>
  )
}
