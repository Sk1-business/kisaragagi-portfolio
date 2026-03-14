import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, CalendarDays, Clock, MessageSquare, Store, UserRound } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import {
  cancelUserReservation,
  evaluateReservationCancellation,
  evaluateReservationUpdate,
  fetchCancellationPolicy,
  fetchReservationChangePolicy,
  fetchUserReservationById,
  type CancellationPolicy,
  type ReservationChangePolicy,
  type UserReservation,
} from "@/features/user/api/userReservationApi"
import { buildPathWithShopId, resolveShopName, useShopId } from "@/features/user/hooks/useShopId"
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日 (${WEEKDAY_LABELS[parsed.getDay()]})`
}

export function UserReservationDetailPage() {
  const shopId = useShopId()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const reservationId = searchParams.get("reservationId") ?? ""
  const [reservation, setReservation] = useState<UserReservation | null>(null)
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy | null>(null)
  const [reservationChangePolicy, setReservationChangePolicy] =
    useState<ReservationChangePolicy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showPolicyAlertDialog, setShowPolicyAlertDialog] = useState(false)
  const [policyAlertMessage, setPolicyAlertMessage] = useState("")
  const [cancelError, setCancelError] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)
    setLoadError("")

    Promise.all([
      fetchUserReservationById(reservationId),
      fetchCancellationPolicy(),
      fetchReservationChangePolicy(),
    ])
      .then(([reservationData, cancellationPolicyData, reservationChangePolicyData]) => {
        if (!isMounted) return
        setReservation(reservationData)
        setCancellationPolicy(cancellationPolicyData)
        setReservationChangePolicy(reservationChangePolicyData)
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
  }, [reservationId])

  const cancellationEvaluation = useMemo(() => {
    if (!reservation || !cancellationPolicy) return { canCancel: false, reason: "" }
    const result = evaluateReservationCancellation(reservation, cancellationPolicy)
    return { canCancel: result.canCancel, reason: result.reason ?? "" }
  }, [cancellationPolicy, reservation])

  const updateEvaluation = useMemo(() => {
    if (!reservation || !reservationChangePolicy) return { canUpdate: false, reason: "" }
    const result = evaluateReservationUpdate(reservation, reservationChangePolicy)
    return { canUpdate: result.canUpdate, reason: result.reason ?? "" }
  }, [reservation, reservationChangePolicy])

  if (isLoading) {
    return (
      <section className="py-16 text-center">
        <p className="text-sm text-muted-foreground">予約情報を読み込み中です...</p>
      </section>
    )
  }

  if (loadError) {
    return (
      <section className="py-16 text-center">
        <p className="text-sm text-destructive">{loadError}</p>
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
          <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>マイページへ戻る</Link>
        </Button>
      </section>
    )
  }

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

  const isCancelled = reservation.status === "cancelled"
  const isUpcoming = reservation.status === "upcoming"
  const shopName = resolveShopName(shopId)
  const editPath = buildPathWithShopId(ROUTES.userReservationSchedule, shopId, {
    mode: reservation.mode,
    reservationId: reservation.id,
    trainerId: reservation.mode === "nomination" ? (reservation.trainerId ?? "") : "",
  })

  function showPolicyAlert(message: string) {
    setPolicyAlertMessage(message)
    setShowPolicyAlertDialog(true)
  }

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
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full rounded-xl"
                onClick={() => {
                  if (!updateEvaluation.canUpdate) {
                    showPolicyAlert("24時間前を過ぎているため予約変更できません。")
                    return
                  }
                  navigate(editPath)
                }}
              >
                予約を変更する
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="w-full rounded-xl"
                onClick={() => {
                  if (!cancellationEvaluation.canCancel) {
                    showPolicyAlert("24時間前を過ぎているためキャンセルできません。")
                    return
                  }
                  setShowCancelDialog(true)
                }}
              >
                予約をキャンセルする
              </Button>
            </div>
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
            {cancelError ? <p className="mt-3 text-xs text-destructive">{cancelError}</p> : null}
            <div className="mt-5 flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={isCancelling}
                onClick={() => setShowCancelDialog(false)}
              >
                戻る
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1 rounded-xl"
                disabled={isCancelling || !cancellationEvaluation.canCancel}
                onClick={async () => {
                  setCancelError("")
                  setIsCancelling(true)
                  const result = await cancelUserReservation(reservation.id)
                  if (!result.ok) {
                    setCancelError(result.error)
                    setIsCancelling(false)
                    return
                  }
                  setReservation(result.reservation)
                  setShowCancelDialog(false)
                  setIsCancelling(false)
                }}
              >
                {isCancelling ? "処理中..." : "キャンセルする"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {showPolicyAlertDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowPolicyAlertDialog(false)}
            onKeyDown={() => {}}
            role="presentation"
          />
          <div className="relative mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <p className="text-sm text-foreground">{policyAlertMessage}</p>
            <div className="mt-5">
              <Button
                type="button"
                className="w-full rounded-xl"
                onClick={() => setShowPolicyAlertDialog(false)}
              >
                閉じる
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-bold text-foreground">各種ポリシー</h3>
        </div>
        <div className="space-y-4 p-5">
          {reservationChangePolicy ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-foreground">{reservationChangePolicy.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{reservationChangePolicy.summary}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                {reservationChangePolicy.detailLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {cancellationPolicy ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-foreground">{cancellationPolicy.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{cancellationPolicy.summary}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                {cancellationPolicy.detailLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>

      <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
        <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>マイページへ戻る</Link>
      </Button>
    </section>
  )
}
