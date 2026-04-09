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
import { LineCallbackPage } from "@/features/auth/pages/LineCallbackPage"
import { AdminCalendarPage } from "@/features/admin/pages/AdminCalendarPage"
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage"
import { AdminReservationDetailPage } from "@/features/admin/pages/AdminReservationDetailPage"
import { AdminCancelledListPage } from "@/features/admin/pages/AdminCancelledListPage"
import { AdminShiftCalendarPage } from "@/features/admin/pages/AdminShiftCalendarPage"
import { AdminStaffPage } from "@/features/admin/pages/AdminStaffPage"
import { UserDashboardPage } from "@/features/user/pages/UserDashboardPage"
import { UserNominationPage } from "@/features/user/pages/UserNominationPage"
import { UserMypagePage } from "@/features/user/pages/UserMypagePage"
import { UserPaymentPage } from "@/features/user/pages/UserPaymentPage"
import { UserPaymentDetailPage } from "@/features/user/pages/UserPaymentDetailPage"
import { UserProfilePage } from "@/features/user/pages/UserProfilePage"
import { UserReservationConfirmPage } from "@/features/user/pages/UserReservationConfirmPage"
import { UserReservationChangeModePage } from "@/features/user/pages/UserReservationChangeModePage"
import { UserReservationInputPage } from "@/features/user/pages/UserReservationInputPage"
import { UserReservationDetailPage } from "@/features/user/pages/UserReservationDetailPage"
import { UserSchedulePage } from "@/features/user/pages/UserSchedulePage"
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
          <h1 className="text-2xl font-semibold tracking-tight">スマート予約プラットフォーム</h1>
        </div>
      </div>

      <div className="mb-6 flex items-center gap-2 rounded-xl bg-muted px-4 py-3">
        <BadgeAlert className="size-5 shrink-0" />
        <p className="text-xl font-bold tracking-tight">開発用のページです。</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserRound className="size-4" />
              予約者用
            </CardTitle>
            <CardDescription>開発用: 予約者向け認証ページに遷移します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full rounded-xl">
              <Link to={`${ROUTES.customerLogin}?shopId=sample-salon-2026`}>予約者ログインへ</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl">
              <Link to={`${ROUTES.customerSignup}?shopId=sample-salon-2026`}>予約者新規登録へ</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-4" />
              管理者・スタッフ用
            </CardTitle>
            <CardDescription>開発用: 管理者・スタッフ向け認証ページに遷移します</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full rounded-xl">
              <Link to={ROUTES.backofficeLogin}>管理者・スタッフログインへ</Link>
            </Button>
            <Button asChild variant="outline" className="w-full rounded-xl">
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
        <Route path={ROUTES.lineCallback} element={<LineCallbackPage />} />
        <Route path={ROUTES.backofficeLogin} element={<BackofficeLoginPage />} />
        <Route path={ROUTES.backofficeSignup} element={<BackofficeSignupPage />} />
        <Route element={<UserLayout />}>
          <Route path={ROUTES.userHome} element={<UserDashboardPage />} />
          <Route path={ROUTES.userReservationNomination} element={<UserNominationPage />} />
          <Route path={ROUTES.userReservationChangeMode} element={<UserReservationChangeModePage />} />
          <Route path={ROUTES.userReservationSchedule} element={<UserSchedulePage />} />
          <Route path={ROUTES.userReservationInput} element={<UserReservationInputPage />} />
          <Route path={ROUTES.userReservationConfirm} element={<UserReservationConfirmPage />} />
          <Route path={ROUTES.userMypage} element={<UserMypagePage />} />
          <Route path={ROUTES.userMypageReservationDetail} element={<UserReservationDetailPage />} />
          <Route path={ROUTES.userMypageProfile} element={<UserProfilePage />} />
          <Route path={ROUTES.userMypagePayment} element={<UserPaymentPage />} />
          <Route path={ROUTES.userMypagePaymentDetail} element={<UserPaymentDetailPage />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path={ROUTES.adminHome} element={<AdminDashboardPage />} />
          <Route path={ROUTES.adminCalendar} element={<AdminCalendarPage />} />
          <Route path={ROUTES.adminShiftCalendar} element={<AdminShiftCalendarPage />} />
          <Route path={ROUTES.adminCancelled} element={<AdminCancelledListPage />} />
          <Route path={ROUTES.adminStaff} element={<AdminStaffPage />} />
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
