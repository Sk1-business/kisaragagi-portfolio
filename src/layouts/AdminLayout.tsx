import { Link, NavLink, Outlet } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { AdminReservationsProvider } from "@/features/admin/context/AdminReservationsContext"

export function AdminLayout() {
  return (
    <AdminReservationsProvider>
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Admin</p>
          <h1 className="text-lg font-semibold">管理者画面</h1>
        </div>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="rounded-md">
            <NavLink to={ROUTES.adminHome} end>
              ダッシュボード
            </NavLink>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-md">
            <NavLink to={ROUTES.adminCalendar}>予約カレンダー</NavLink>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-md">
            <NavLink to={ROUTES.adminShiftCalendar}>シフトカレンダー</NavLink>
          </Button>
          <Button asChild variant="ghost" size="sm" className="rounded-md">
            <NavLink to={ROUTES.adminCancelled}>キャンセル一覧</NavLink>
          </Button>
          <Button asChild variant="outline" size="sm" className="ml-2 rounded-md">
            <Link to={ROUTES.landing}>トップへ</Link>
          </Button>
        </nav>
      </header>
      <Outlet />
    </main>
    </AdminReservationsProvider>
  )
}
