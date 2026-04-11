import { useEffect, useState } from "react"
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  CreditCard,
  Pencil,
  UserRound,
} from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import {
  fetchUserReservations,
  formatReservationExpectedTimeRange,
  type UserReservation,
} from "@/features/user/api/userReservationApi"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import { formatDateLongWithWeekday } from "@/lib/dateFormat"

function getReservationTimestamp(reservation: UserReservation) {
  const parsed = new Date(`${reservation.date}T${reservation.time}:00`)
  return Number.isNaN(parsed.getTime()) ? new Date(`${reservation.date}T00:00:00`).getTime() : parsed.getTime()
}

/** 日本時間の今日を YYYY-MM-DD */
function todayYmdJst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
}

function addCalendarDaysToYmd(ymd: string, deltaDays: number): string {
  const [y, m, d] = ymd.split("-").map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return ymd
  const t = Date.UTC(y, m - 1, d) + deltaDays * 86_400_000
  const dt = new Date(t)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(dt.getUTCDate()).padStart(2, "0")
  return `${yy}-${mm}-${dd}`
}

/** 予約日が日本時間で「昨日以前」なら過去扱い（当日・明日以降は現在の予約に残す） */
function isReservationDateOnOrBeforeYesterdayJst(reservationDate: string): boolean {
  const yesterday = addCalendarDaysToYmd(todayYmdJst(), -1)
  return reservationDate <= yesterday
}

type TabType = "upcoming" | "past"

const TABS: { key: TabType; label: string }[] = [
  { key: "upcoming", label: "現在の予約" },
  { key: "past", label: "過去の予約" },
]

export function UserMypagePage() {
  const shopId = useShopId()
  const [activeTab, setActiveTab] = useState<TabType>("upcoming")
  const [reservations, setReservations] = useState<UserReservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")

  useEffect(() => {
    let isMounted = true
    fetchUserReservations(shopId)
      .then((data) => {
        if (!isMounted) return
        setLoadError("")
        setReservations(data)
      })
      .catch(() => {
        if (!isMounted) return
        setLoadError("予約情報の取得に失敗しました。")
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [shopId])

  const filteredReservations = reservations
    .filter((reservation) => {
      const dateIsPast = isReservationDateOnOrBeforeYesterdayJst(reservation.date)
      if (activeTab === "upcoming") {
        return reservation.status === "upcoming" && !dateIsPast
      }
      return (
        reservation.status === "past" ||
        reservation.status === "cancelled" ||
        (reservation.status === "upcoming" && dateIsPast)
      )
    })
    .sort((a, b) =>
      activeTab === "upcoming"
        ? getReservationTimestamp(a) - getReservationTimestamp(b)
        : getReservationTimestamp(b) - getReservationTimestamp(a),
    )

  return (
    <section className="space-y-5">
      <UserSectionCard title="マイページ" subtitle="予約の確認やプロフィール編集ができます。">
        <div className="flex border-b border-slate-200">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 py-3 text-center text-sm font-semibold transition ${
                  isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
                {isActive ? (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
                ) : null}
              </button>
            )
          })}
        </div>

        <div className="space-y-3 p-5">
          {isLoading ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">予約情報を読み込み中です...</p>
            </div>
          ) : loadError ? (
            <div className="py-10 text-center">
              <p className="text-sm text-destructive">{loadError}</p>
            </div>
          ) : filteredReservations.length > 0 ? (
            filteredReservations.map((reservation) => (
              <Link
                key={reservation.id}
                to={buildPathWithShopId(ROUTES.userMypageReservationDetail, shopId)}
                state={{ reservationId: reservation.id }}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  {reservation.mode === "nomination" ? (
                    <UserRound className="size-5 text-slate-500" />
                  ) : (
                    <CalendarDays className="size-5 text-slate-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                    <CalendarDays className="size-3.5 shrink-0 text-muted-foreground" />
                    {formatDateLongWithWeekday(reservation.date)}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3.5 shrink-0" />
                    <span>
                      想定時間{" "}
                      {formatReservationExpectedTimeRange(reservation.time, reservation.serviceEndAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    メニュー: {reservation.menuName?.trim() || "未定"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {reservation.mode === "nomination"
                      ? `指名トレーナー: ${reservation.trainerName ?? "—"}`
                      : "予約モード: おまかせ"}
                  </p>
                  {reservation.status === "cancelled" ? (
                    <p className="mt-0.5 text-xs font-semibold text-red-600">キャンセル済み</p>
                  ) : null}
                </div>
                <ArrowRight className="ml-auto size-4 text-muted-foreground opacity-50 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </Link>
            ))
          ) : (
            <div className="py-10 text-center">
              <CalendarDays className="mx-auto mb-2 size-8 text-slate-300" />
              <p className="text-sm text-muted-foreground">
                {activeTab === "upcoming"
                  ? "現在の予約はありません。"
                  : "過去の予約はありません。"}
              </p>
            </div>
          )}
        </div>
      </UserSectionCard>

      <div className="rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-foreground">アカウント設定</h3>
        </div>
        <div className="divide-y divide-slate-100">
          <Link
            to={buildPathWithShopId(ROUTES.userMypageProfile, shopId)}
            className="group flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <Pencil className="size-4 text-violet-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">プロフィール編集</p>
              <p className="text-xs text-muted-foreground">名前・メール・電話番号を変更</p>
            </div>
            <ChevronRight className="ml-auto size-4 text-muted-foreground opacity-50 transition group-hover:opacity-100" />
          </Link>
          <Link
            to={buildPathWithShopId(ROUTES.userMypagePayment, shopId)}
            className="group flex items-center gap-4 px-6 py-4 transition hover:bg-slate-50"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
              <CreditCard className="size-4 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">決済情報管理</p>
              <p className="text-xs text-muted-foreground">クレジットカードの登録・変更</p>
            </div>
            <ChevronRight className="ml-auto size-4 text-muted-foreground opacity-50 transition group-hover:opacity-100" />
          </Link>
        </div>
      </div>

      <Button asChild size="lg" className="w-full rounded-xl">
        <Link to={buildPathWithShopId(ROUTES.userHome, shopId)}>店舗情報へ戻る</Link>
      </Button>
    </section>
  )
}
