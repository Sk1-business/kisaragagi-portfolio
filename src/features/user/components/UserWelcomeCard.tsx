import { ArrowRight, CalendarSearch, Clock3, MapPin, Scissors, UserRound } from "lucide-react"
import { Link } from "react-router-dom"

import { ROUTES } from "@/constants/routes"
import { buildPathWithShopId } from "@/features/user/hooks/useShopId"
import type { UserDashboardSummary } from "@/features/user/types/userDashboard"

interface UserWelcomeCardProps {
  summary: UserDashboardSummary
  shopId?: string
  reservationId?: string
}

export function UserWelcomeCard({ summary, shopId, reservationId }: UserWelcomeCardProps) {
  const schedulePath = buildPathWithShopId(ROUTES.userReservationSchedule, shopId)
  const lookupPath = buildPathWithShopId(ROUTES.userReservationLookup, shopId)

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-[2rem] shadow-lg">
        <div className="relative h-72 sm:h-80">
          <img
            src={summary.shopImageUrl}
            alt={summary.shopName}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[oklch(0.28_0.06_18/0.82)] via-[oklch(0.28_0.04_20/0.2)] to-transparent" />
          <div className="absolute left-0 right-0 top-0 p-6">
            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-md sm:text-3xl">
              {summary.shopName}
            </h2>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85">
              {summary.message}
            </p>
          </div>
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-2">
          <div className="flex items-start gap-3 bg-card p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <MapPin className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground">所在地</p>
              <p className="mt-1 text-sm leading-snug text-foreground">{summary.shopAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-card p-5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Clock3 className="size-4" />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-muted-foreground">営業時間</p>
              <p className="mt-1 text-sm leading-snug text-foreground">
                {summary.businessHours}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] bg-card shadow-lg">
        <div className="border-b border-border px-6 py-5">
          <h3 className="text-lg font-bold text-foreground">予約メニュー</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            新規予約または既存予約の確認・変更を選択してください。
          </p>
        </div>
        <div className="grid gap-4 p-6">
          <Link
            to={schedulePath}
            state={
              reservationId
                ? { mode: "nomination", reservationId, isUpdatingExistingReservation: true }
                : { mode: "nomination", isUpdatingExistingReservation: false }
            }
            className="group flex items-center gap-4 rounded-[1.5rem] bg-primary p-5 text-primary-foreground shadow-sm transition hover:opacity-95"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
              <UserRound className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">新規予約</p>
              <p className="mt-0.5 text-xs text-primary-foreground/75">日時→メニュー→担当スタッフの順で選択します</p>
            </div>
            <ArrowRight className="ml-auto size-4 opacity-70 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
          </Link>
          <Link
            to={lookupPath}
            className="group flex items-center gap-4 rounded-[1.5rem] border border-border bg-background p-5 shadow-sm transition hover:bg-accent"
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <CalendarSearch className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">予約確認・変更</p>
              <p className="mt-0.5 text-xs text-muted-foreground">メールアドレスまたは電話番号で予約を確認します</p>
            </div>
            <ArrowRight className="ml-auto size-4 text-muted-foreground opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
          </Link>
        </div>
      </div>

      {summary.coupons && summary.coupons.length > 0 ? (
        <div className="rounded-[2rem] bg-card p-6 shadow-lg">
          <h3 className="text-lg font-bold text-foreground">ホットペッパー掲載クーポン</h3>
          <ul className="mt-4 space-y-3">
            {summary.coupons.map((coupon) => (
              <li key={coupon.title} className="rounded-[1.25rem] border border-border bg-background px-4 py-4">
                <p className="font-semibold text-foreground">{coupon.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{coupon.description}</p>
                <p className="mt-2 text-sm font-medium text-primary">¥{coupon.priceYen.toLocaleString()}</p>
              </li>
            ))}
          </ul>
          {summary.hotpepperUrl ? (
            <a
              href={summary.hotpepperUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary underline"
            >
              <Scissors className="size-4" />
              ホットペッパービューティーでこのサロンを見る
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
