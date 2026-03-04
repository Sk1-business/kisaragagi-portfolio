import { ArrowLeft, Dumbbell } from "lucide-react"
import { Link, Outlet, useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"

export function UserLayout() {
  const location = useLocation()
  const isTopLevel = location.pathname === ROUTES.userHome

  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {!isTopLevel ? (
              <Button asChild variant="ghost" size="icon-sm" className="rounded-full">
                <Link to={ROUTES.userHome}>
                  <ArrowLeft className="size-4" />
                </Link>
              </Button>
            ) : null}
            <Link to={ROUTES.userHome} className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-slate-900">
                <Dumbbell className="size-4 text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  予約者画面
                </p>
                <p className="text-sm font-semibold text-foreground">店舗情報</p>
              </div>
            </Link>
          </div>
          <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground">
            <Link to={ROUTES.landing}>トップへ</Link>
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Outlet />
      </div>
    </main>
  )
}
