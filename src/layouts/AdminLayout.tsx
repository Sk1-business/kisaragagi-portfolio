import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { postAdminLogout } from "@/features/auth/api/adminLogoutApi"
import { AdminReservationsProvider } from "@/features/admin/context/AdminReservationsContext"
import { AdminShiftAvailabilityProvider } from "@/features/admin/context/AdminShiftAvailabilityContext"
import { AdminStaffProvider } from "@/features/admin/context/AdminStaffContext"
import { AdminAuthGuard } from "@/layouts/AdminAuthGuard"
import {
  LogoutConfirmDialog,
  LogoutSuccessDialog,
} from "@/layouts/AdminLogoutDialogs"

export function AdminLayout() {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  function openLogoutConfirm() {
    setConfirmOpen(true)
  }

  function cancelLogoutConfirm() {
    if (loggingOut) return
    setConfirmOpen(false)
  }

  async function confirmLogout() {
    setLoggingOut(true)
    try {
      await postAdminLogout()
    } finally {
      setLoggingOut(false)
      setConfirmOpen(false)
      setSuccessOpen(true)
    }
  }

  function dismissSuccessAndGoToLogin() {
    setSuccessOpen(false)
    navigate(ROUTES.backofficeLogin, { replace: true })
  }

  return (
    <AdminReservationsProvider>
    <AdminStaffProvider>
    <AdminShiftAvailabilityProvider>
    <AdminAuthGuard>
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
          <Button asChild variant="ghost" size="sm" className="rounded-md">
            <NavLink to={ROUTES.adminStaff}>スタッフ管理</NavLink>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="ml-2 rounded-md"
            disabled={loggingOut}
            onClick={openLogoutConfirm}
          >
            ログアウト
          </Button>
        </nav>
      </header>
      <Outlet />
    </main>

    <LogoutConfirmDialog
      open={confirmOpen}
      confirming={loggingOut}
      onCancel={cancelLogoutConfirm}
      onConfirm={() => void confirmLogout()}
    />
    <LogoutSuccessDialog open={successOpen} onDismiss={dismissSuccessAndGoToLogin} />
    </AdminAuthGuard>
    </AdminShiftAvailabilityProvider>
    </AdminStaffProvider>
    </AdminReservationsProvider>
  )
}
