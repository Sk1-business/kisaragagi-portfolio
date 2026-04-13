import { BadgeAlert, Dumbbell, ShieldCheck, UserRound } from "lucide-react"
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import {
  BackofficeLoginPage,
  BackofficeSignupPage,
  CustomerLoginPage,
  CustomerSignupPage,
} from "@/features/auth/pages"
import { AdminCalendarPage } from "@/features/admin/pages/AdminCalendarPage"
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage"
import { AdminNewReservationConfirmPage } from "@/features/admin/pages/AdminNewReservationConfirmPage"
import { AdminNewReservationPage } from "@/features/admin/pages/AdminNewReservationPage"
import { AdminReservationDetailPage } from "@/features/admin/pages/AdminReservationDetailPage"
import { AdminShiftCalendarPage } from "@/features/admin/pages/AdminShiftCalendarPage"
import { AdminMenusPage } from "@/features/admin/pages/AdminMenusPage"
import { AdminStaffPage } from "@/features/admin/pages/AdminStaffPage"
import { UserDashboardPage } from "@/features/user/pages/UserDashboardPage"
import { AdminLayout } from "./layouts/AdminLayout"
import { UserLayout } from "./layouts/UserLayout"

function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-4xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="rounded-lg border border-border bg-card p-2">
          <Dumbbell className="size-5 text-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">予約管理SaaS</p>
          <h1 className="text-2xl font-semibold tracking-tight">Effortless is Stylish</h1>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2 rounded-lg bg-muted px-4 py-3">
        <BadgeAlert className="size-5 shrink-0" />
        <p className="text-xl font-bold tracking-tight">開発用のページです。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-lg shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="size-4" />
              予約者用
            </CardTitle>
            <CardDescription>開発用: 予約者向け認証ページに遷移します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full rounded-md">
              <Link to={ROUTES.customerLogin}>予約者ログインへ</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-md">
              <Link to={ROUTES.customerSignup}>予約者新規登録へ</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-lg shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-4" />
              管理者・スタッフ用
            </CardTitle>
            <CardDescription>開発用: 管理者・スタッフ向け認証ページに遷移します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full rounded-md">
              <Link to={ROUTES.backofficeLogin}>管理者・スタッフログインへ</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-md">
              <Link to={ROUTES.backofficeSignup}>管理者・スタッフ新規登録へ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.landing} element={<LandingPage />} />

        <Route path={ROUTES.customerLogin} element={<CustomerLoginPage />} />
        <Route path={ROUTES.customerSignup} element={<CustomerSignupPage />} />
        <Route path={ROUTES.backofficeLogin} element={<BackofficeLoginPage />} />
        <Route path={ROUTES.backofficeSignup} element={<BackofficeSignupPage />} />
        <Route element={<UserLayout />}>
          <Route path={ROUTES.userHome} element={<UserDashboardPage />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path={ROUTES.adminHome} element={<AdminDashboardPage />} />
          <Route path={ROUTES.adminCalendar} element={<AdminCalendarPage />} />
          <Route path={ROUTES.adminShiftCalendar} element={<AdminShiftCalendarPage />} />
          <Route
            path={ROUTES.adminCancelled}
            element={<Navigate to={ROUTES.adminHome} replace />}
          />
          <Route path={ROUTES.adminStaff} element={<AdminStaffPage />} />
          <Route path={ROUTES.adminMenus} element={<AdminMenusPage />} />
          <Route
            path={ROUTES.adminNewReservationConfirm}
            element={<AdminNewReservationConfirmPage />}
          />
          <Route path={ROUTES.adminNewReservation} element={<AdminNewReservationPage />} />
          <Route
            path={ROUTES.adminReservationDetail}
            element={<AdminReservationDetailPage />}
          />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
