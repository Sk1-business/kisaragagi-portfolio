import { useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { AdminHeaderAvatar } from "@/features/auth/components/AdminHeaderAvatar"
import { useAdminProfile } from "@/features/auth/context/AdminProfileContext"
import { postAdminLogout } from "@/features/auth/api/adminLogoutApi"
import { AdminReservationsProvider } from "@/features/admin/context/AdminReservationsContext"
import { AdminShiftAvailabilityProvider } from "@/features/admin/context/AdminShiftAvailabilityContext"
import { AdminStaffProvider } from "@/features/admin/context/AdminStaffContext"
import { AdminAuthGuard } from "@/layouts/AdminAuthGuard"
import {
  LogoutConfirmDialog,
  LogoutSuccessDialog,
} from "@/layouts/AdminLogoutDialogs"

/** `AdminAuthGuard` 内（`AdminProfileProvider` 配下）でマウントする */
function AdminLayoutContent() {
  const profile = useAdminProfile()
  const navigate = useNavigate()
  const location = useLocation()
  const isOwner = profile.role === "owner"
  const isStaff = !isOwner
  const profileName = profile.name.trim()
  const onAdminHome = location.pathname === ROUTES.adminHome
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [successOpen, setSuccessOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  function openLogoutConfirm() {
    setLogoutError(null)
    setConfirmOpen(true)
  }

  function cancelLogoutConfirm() {
    if (loggingOut) return
    setConfirmOpen(false)
  }

  async function confirmLogout() {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      const ok = await postAdminLogout()
      if (!ok) {
        setLogoutError("ログアウトに失敗しました。通信状態を確認して再試行してください。")
        return
      }
      setConfirmOpen(false)
      setSuccessOpen(true)
    } finally {
      setLoggingOut(false)
    }
  }

  function dismissSuccessAndGoToLogin() {
    setSuccessOpen(false)
    navigate(ROUTES.backofficeLogin, { replace: true })
  }

  return (
    <>
    <main className="mx-auto min-h-dvh w-full max-w-6xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <AdminHeaderAvatar name={profile.name} avatarUrl={profile.avatarUrl} />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {isOwner ? "ADMIN" : "STAFF"}
            </p>
            {profile.salonName ? (
              <p className="truncate text-sm font-medium text-muted-foreground">{profile.salonName}</p>
            ) : null}
            <h1 className="text-lg font-semibold leading-tight">
              {isOwner ? "管理者画面" : "スタッフ画面"}
            </h1>
            {profileName && isOwner ? (
              <p className="truncate text-sm text-muted-foreground">{profileName}</p>
            ) : null}
          </div>
        </div>
        {isOwner ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            {!onAdminHome ? (
              <Button asChild variant="ghost" size="sm" className="rounded-md">
                <Link to={ROUTES.adminHome}>ダッシュボードへ</Link>
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md"
              disabled={loggingOut}
              onClick={openLogoutConfirm}
            >
              ログアウト
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-end gap-2">
            <p className="text-right text-sm text-muted-foreground">
              ようこそ、{profileName || "スタッフ"}さん
            </p>
            <nav className="flex flex-wrap items-center justify-end gap-2">
              <Button asChild variant="ghost" size="sm" className="rounded-md">
                <NavLink to={ROUTES.adminHome} end>
                  ダッシュボード
                </NavLink>
              </Button>
              <Button asChild variant="ghost" size="sm" className="rounded-md">
                <NavLink to={ROUTES.adminCalendar}>予約カレンダー</NavLink>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-md"
                onClick={() =>
                  navigate(ROUTES.adminNewReservation, {
                    state: { bookingNotBeforeIso: new Date().toISOString() },
                  })
                }
              >
                新規予約
              </Button>
              <Button asChild variant="ghost" size="sm" className="rounded-md">
                <NavLink to={ROUTES.adminShiftCalendar}>シフトカレンダー</NavLink>
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
          </div>
        )}
      </header>
      <Outlet />
    </main>

    <LogoutConfirmDialog
      open={confirmOpen}
      confirming={loggingOut}
      errorMessage={logoutError}
      onCancel={cancelLogoutConfirm}
      onConfirm={() => void confirmLogout()}
    />
    <LogoutSuccessDialog open={successOpen} onDismiss={dismissSuccessAndGoToLogin} />
    </>
  )
}

export function AdminLayout() {
  return (
    <AdminReservationsProvider>
    <AdminStaffProvider>
    <AdminShiftAvailabilityProvider>
    <AdminAuthGuard>
    <AdminLayoutContent />
    </AdminAuthGuard>
    </AdminShiftAvailabilityProvider>
    </AdminStaffProvider>
    </AdminReservationsProvider>
  )
}
