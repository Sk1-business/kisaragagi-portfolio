import { Scissors, ShieldCheck, UserRound } from "lucide-react"
import { useState, type ReactNode } from "react"
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom"

import { DEMO_CUSTOMER, DEMO_OWNER, DEMO_SALON_SLUG } from "@/demo/demoAccounts"
import { appSurface, showDemoHints } from "@/demo/appSurface"
import { routerBasename } from "@/demo/demoMode"
import { isValidSalonSlug } from "@/features/auth/lib/salonSlug"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import {
  BackofficeInitialSetupPage,
  BackofficeLoginPage,
  BackofficeSetupBusinessHoursPage,
  BackofficeSetupBookingRulesPage,
  BackofficeSetupDonePage,
  BackofficeSignupPage,
  BackofficeSignupVerifyPage,
  BackofficeSignupVerifySentPage,
  CustomerLoginPage,
  CustomerSignupPage,
} from "@/features/auth/pages"
import { AdminCalendarPage } from "@/features/admin/pages/AdminCalendarPage"
import { AdminCancelledListPage } from "@/features/admin/pages/AdminCancelledListPage"
import { AdminReservationLedgerPage } from "@/features/admin/pages/AdminReservationLedgerPage"
import { AdminDashboardPage } from "@/features/admin/pages/AdminDashboardPage"
import { AdminNewReservationConfirmPage } from "@/features/admin/pages/AdminNewReservationConfirmPage"
import { AdminNewReservationPage } from "@/features/admin/pages/AdminNewReservationPage"
import { AdminReservationDetailPage } from "@/features/admin/pages/AdminReservationDetailPage"
import { AdminShiftCalendarPage } from "@/features/admin/pages/AdminShiftCalendarPage"
import { AdminMenusPage } from "@/features/admin/pages/AdminMenusPage"
import { AdminPaymentsPage } from "@/features/admin/pages/AdminPaymentsPage"
import { AdminSalonSettingsPage } from "@/features/admin/pages/AdminSalonSettingsPage"
import { AdminSalonProfilePage } from "@/features/admin/pages/AdminSalonProfilePage"
import { AdminSecurityPage } from "@/features/admin/pages/AdminSecurityPage"
import { AdminCustomersPage } from "@/features/admin/pages/AdminCustomersPage"
import { AdminSalesPage } from "@/features/admin/pages/AdminSalesPage"
import { CommerceDraftPage, PrivacyDraftPage } from "@/features/legal/LegalDraftPage"
import { AdminStaffPage } from "@/features/admin/pages/AdminStaffPage"
import { UserDashboardPage } from "@/features/user/pages/UserDashboardPage"
import { UserNominationPage } from "@/features/user/pages/UserNominationPage"
import { UserReservationDetailPage } from "@/features/user/pages/UserReservationDetailPage"
import { UserReservationLookupPage } from "@/features/user/pages/UserReservationLookupPage"
import { SalonPublicEntryPage } from "@/features/user/pages/SalonPublicEntryPage"
import { UserReservationConfirmPage } from "@/features/user/pages/UserReservationConfirmPage"
import { UserReservationChangeModePage } from "@/features/user/pages/UserReservationChangeModePage"
import { UserReservationInputPage } from "@/features/user/pages/UserReservationInputPage"
import { UserPayPayReturnPage } from "@/features/user/pages/UserPayPayReturnPage"
import { UserSchedulePage } from "@/features/user/pages/UserSchedulePage"
import { AdminLayout } from "./layouts/AdminLayout"
import { OwnerOnlyRoute } from "./layouts/OwnerOnlyRoute"
import { UserLayout } from "./layouts/UserLayout"

function LandingPage() {
  const [slug, setSlug] = useState(DEMO_SALON_SLUG)
  const salonSlug = slug.trim().toLowerCase()
  const slugReady = salonSlug.length >= 3 && isValidSalonSlug(salonSlug)
  const demo = showDemoHints()
  const surface = appSurface()

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 flex items-center gap-5">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Scissors className="size-7" />
        </div>
        <div>
          <p className="text-xs font-medium tracking-[0.28em] text-primary">SALON BOOKING</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance">
            {surface === "customer" ? "予約する" : "どちらで入りますか"}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {surface === "customer"
              ? "サロンIDを入れると、そのお店の予約ページが開きます。"
              : "お客様はサロンを開いて予約します。お店の人は、自分のサロンの台帳から入ります。"}
          </p>
        </div>
      </div>
      <div className={surface === "customer" ? "grid gap-5" : "grid gap-5 md:grid-cols-2"}>
        <Card className="border-0 shadow-md">
          <CardHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <UserRound className="size-5" />
            </div>
            <p className="text-xs font-medium tracking-wide text-primary">お客様</p>
            <CardTitle className="text-2xl">予約する</CardTitle>
            <CardDescription>
              サロンIDを入れると、そのお店の予約ページが開きます。前払いと当日払いを選べます。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="block space-y-1 text-sm" htmlFor="landing-salon-slug">
              <span className="text-muted-foreground">サロンID</span>
              <Input
                id="landing-salon-slug"
                value={slug}
                spellCheck={false}
                autoCapitalize="none"
                onChange={(event) => setSlug(event.target.value)}
              />
            </label>
            {slugReady ? (
              <>
                <Button asChild className="w-full">
                  <Link to={`/s/${salonSlug}`}>このサロンを開く</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/user/reservation/lookup?shopId=${salonSlug}`}>予約の確認</Link>
                </Button>
              </>
            ) : (
              <p className="text-xs text-destructive">サロンIDは英数字とハイフンで、3文字以上にしてください。</p>
            )}
            {demo ? (
              <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
                見本のサロンIDは {DEMO_SALON_SLUG}。お客様 {DEMO_CUSTOMER.email} / {DEMO_CUSTOMER.password}
              </p>
            ) : null}
          </CardContent>
        </Card>
        {surface === "customer" ? null : (
        <Card className="border-0 bg-primary text-primary-foreground shadow-md">
          <CardHeader>
            <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary-foreground/15">
              <ShieldCheck className="size-5" />
            </div>
            <p className="text-xs font-medium tracking-wide text-primary-foreground/70">スタッフ・経営者</p>
            <CardTitle className="text-2xl text-primary-foreground">お店を見る</CardTitle>
            <CardDescription className="text-primary-foreground/75">
              ログインすると、そのアカウントのサロンが開きます。新規登録すると、そのサロンの予約ページと管理画面が始まります。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link to={ROUTES.backofficeLogin}>管理画面ログインへ</Link>
            </Button>
            <Button asChild variant="outline" className="w-full border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Link to={ROUTES.backofficeSignup}>サロンを新規登録</Link>
            </Button>
            {demo ? (
              <p className="pt-2 text-xs leading-relaxed text-primary-foreground/70">
                見本のオーナー {DEMO_OWNER.email} / {DEMO_OWNER.password}
              </p>
            ) : null}
          </CardContent>
        </Card>
        )}
      </div>
      <p className="mt-8 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <Link className="underline" to={ROUTES.privacy}>プライバシーポリシー</Link>
        <Link className="underline" to={ROUTES.commerce}>特定商取引法に基づく表記</Link>
      </p>
    </main>
  )
}

function SurfaceGate({ children }: { children: ReactNode }) {
  const location = useLocation()
  const surface = appSurface()
  const path = location.pathname
  if (surface === "admin" && path === "/") {
    return <Navigate to={ROUTES.backofficeLogin} replace />
  }
  if (
    surface === "customer" &&
    (path.startsWith("/admin") || path.startsWith("/backoffice"))
  ) {
    return <Navigate to={ROUTES.landing} replace />
  }
  return children
}

function App() {
  return (
    <BrowserRouter basename={routerBasename()}>
      <SurfaceGate>
      <Routes>
        <Route path={ROUTES.landing} element={<LandingPage />} />
        <Route path={ROUTES.privacy} element={<PrivacyDraftPage />} />
        <Route path={ROUTES.commerce} element={<CommerceDraftPage />} />

        <Route path={ROUTES.customerLogin} element={<CustomerLoginPage />} />
        <Route path={ROUTES.customerSignup} element={<CustomerSignupPage />} />
        <Route path={ROUTES.backofficeLogin} element={<BackofficeLoginPage />} />
        <Route path={ROUTES.backofficeSignup} element={<BackofficeSignupPage />} />
        <Route path={ROUTES.salonPublic} element={<SalonPublicEntryPage />} />
        <Route
          path={ROUTES.backofficeSignupVerifySent}
          element={<BackofficeSignupVerifySentPage />}
        />
        <Route
          path={ROUTES.backofficeSignupVerify}
          element={<BackofficeSignupVerifyPage />}
        />
        <Route
          path={ROUTES.backofficeInitialSetup}
          element={<BackofficeInitialSetupPage />}
        />
        <Route
          path={ROUTES.backofficeSetupDone}
          element={<BackofficeSetupDonePage />}
        />
        <Route element={<UserLayout />}>
          <Route path={ROUTES.userHome} element={<UserDashboardPage />} />
          <Route path={ROUTES.userReservationLookup} element={<UserReservationLookupPage />} />
          <Route path={ROUTES.userReservationList} element={<UserReservationLookupPage />} />
          <Route path={ROUTES.userReservationDetail} element={<UserReservationDetailPage />} />
          <Route path={ROUTES.userReservationNomination} element={<UserNominationPage />} />
          <Route path={ROUTES.userReservationChangeMode} element={<UserReservationChangeModePage />} />
          <Route path={ROUTES.userReservationSchedule} element={<UserSchedulePage />} />
          <Route path={ROUTES.userReservationInput} element={<UserReservationInputPage />} />
          <Route path={ROUTES.userReservationConfirm} element={<UserReservationConfirmPage />} />
          <Route path={ROUTES.userReservationPaypayReturn} element={<UserPayPayReturnPage />} />
        </Route>

        <Route element={<AdminLayout />}>
          <Route path={ROUTES.adminHome} element={<AdminDashboardPage />} />
          <Route path={ROUTES.adminCalendar} element={<AdminCalendarPage />} />
          <Route path={ROUTES.adminShiftCalendar} element={<AdminShiftCalendarPage />} />
          <Route
            path={ROUTES.backofficeSetupBusinessHours}
            element={<BackofficeSetupBusinessHoursPage />}
          />
          <Route
            path={ROUTES.backofficeSetupBookingRules}
            element={<BackofficeSetupBookingRulesPage />}
          />
          <Route path={ROUTES.adminCancelled} element={<AdminCancelledListPage />} />
          <Route path={ROUTES.adminReservationLedger} element={<AdminReservationLedgerPage />} />
          <Route
            path={ROUTES.adminStaff}
            element={
              <OwnerOnlyRoute>
                <AdminStaffPage />
              </OwnerOnlyRoute>
            }
          />
          <Route
            path={ROUTES.adminMenus}
            element={
              <OwnerOnlyRoute>
                <AdminMenusPage />
              </OwnerOnlyRoute>
            }
          />
          <Route
            path={ROUTES.adminPayments}
            element={
              <OwnerOnlyRoute>
                <AdminPaymentsPage />
              </OwnerOnlyRoute>
            }
          />
          <Route
            path={ROUTES.adminSalonSettings}
            element={
              <OwnerOnlyRoute>
                <AdminSalonSettingsPage />
              </OwnerOnlyRoute>
            }
          />
          <Route
            path={ROUTES.adminSalonProfile}
            element={
              <OwnerOnlyRoute>
                <AdminSalonProfilePage />
              </OwnerOnlyRoute>
            }
          />
          <Route path={ROUTES.adminSecurity} element={<AdminSecurityPage />} />
          <Route path={ROUTES.adminCustomers} element={<AdminCustomersPage />} />
          <Route
            path={ROUTES.adminSales}
            element={
              <OwnerOnlyRoute>
                <AdminSalesPage />
              </OwnerOnlyRoute>
            }
          />
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
      </SurfaceGate>
    </BrowserRouter>
  )
}

export default App
