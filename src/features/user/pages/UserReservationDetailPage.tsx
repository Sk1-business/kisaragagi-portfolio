import { useState } from "react"
import { AlertTriangle, CalendarDays, Clock, MessageSquare, Store, UserRound } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import mockReservations from "@/features/user/api/mockReservations.json"
import { buildPathWithShopId, resolveShopName, useShopId } from "@/features/user/hooks/useShopId"

interface Reservation {
  id: string
  date: string
  time: string
  mode: string
  trainerName: string | null
  status: string
  note: string
}

const reservations = mockReservations as Reservation[]
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日 (${WEEKDAY_LABELS[parsed.getDay()]})`
}

export function UserReservationDetailPage() {
  const shopId = useShopId()
  const params = new URLSearchParams(window.location.search)
  const reservationId = params.get("reservationId") ?? ""
  const reservation = reservations.find((r) => r.id === reservationId)
  const [isCancelled, setIsCancelled] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)

  if (!reservation) {
    return (
      <section className="py-16 text-center">
        <p className="text-sm text-muted-foreground">予約が見つかりませんでした。</p>
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
          <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>マイページへ戻る</Link>
        </Button>
      </section>
    )
  }

  const isUpcoming = reservation.status === "upcoming" && !isCancelled
  const shopName = resolveShopName(shopId)

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white">
          <h2 className="font-bold">予約詳細</h2>
          <p className="mt-0.5 text-xs text-slate-300">予約の詳細情報を確認できます。</p>
        </div>

        {isCancelled ? (
          <div className="mx-5 mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertTriangle className="size-5 shrink-0 text-red-500" />
            <p className="text-sm font-medium text-red-700">この予約はキャンセルされました。</p>
          </div>
        ) : null}

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Store className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">店舗</p>
              <p className="text-sm font-semibold text-foreground">{shopName}</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">日付</p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDateLabel(reservation.date)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">時間</p>
                <p className="text-sm font-semibold text-foreground">{reservation.time}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
              <UserRound className="size-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">
                {reservation.mode === "nomination" ? "指名トレーナー" : "予約モード"}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {reservation.mode === "nomination" ? reservation.trainerName : "おまかせ"}
              </p>
            </div>
          </div>

          {reservation.note ? (
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">ご要望・備考</p>
                <p className="text-sm text-foreground">{reservation.note}</p>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div>
              <p className="text-[11px] text-muted-foreground">ステータス</p>
              <p className="text-sm font-semibold text-foreground">
                {isCancelled
                  ? "キャンセル済み"
                  : reservation.status === "upcoming"
                    ? "予約確定"
                    : "完了"}
              </p>
            </div>
          </div>
        </div>

        {isUpcoming ? (
          <div className="border-t border-slate-100 px-5 py-4">
            <Button
              type="button"
              variant="destructive"
              size="lg"
              className="w-full rounded-xl"
              onClick={() => setShowCancelDialog(true)}
            >
              予約をキャンセルする
            </Button>
          </div>
        ) : null}
      </div>

      {showCancelDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowCancelDialog(false)}
            onKeyDown={() => {}}
            role="presentation"
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="size-5 text-red-600" />
            </div>
            <h3 className="mt-3 text-base font-bold text-foreground">予約をキャンセルしますか？</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              この操作は取り消せません。本当にキャンセルしてもよろしいですか？
            </p>
            <div className="mt-5 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setShowCancelDialog(false)}
              >
                戻る
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setIsCancelled(true)
                  setShowCancelDialog(false)
                }}
              >
                キャンセルする
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
        <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>マイページへ戻る</Link>
      </Button>
    </section>
  )
}
