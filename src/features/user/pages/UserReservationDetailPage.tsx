import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  CreditCard,
  MessageSquare,
  Store,
  UserRound,
} from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import {
  cancelUserReservation,
  evaluateReservationCancellation,
  evaluateReservationUpdate,
  fetchReservationPolicies,
  formatPaymentStatusLabel,
  formatReservationPaymentMethod,
  type CancellationPolicy,
  type ReservationChangePolicy,
} from "@/features/user/api/userReservationApi"
import { UserConfirmDialog } from "@/features/user/components/UserConfirmDialog"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { usePersistentReservationId } from "@/features/user/hooks/usePersistentReservationId"
import { useSalonName } from "@/features/user/hooks/useSalonName"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import { useUserReservation } from "@/features/user/hooks/useUserReservation"
import { formatDateLongWithWeekday } from "@/lib/dateFormat"

export function UserReservationDetailPage() {
  const shopId = useShopId()
  const shopName = useSalonName(shopId)
  const navigate = useNavigate()
  const reservationId = usePersistentReservationId()
  const { reservation, isLoading: isReservationLoading } = useUserReservation(reservationId, shopId)
  const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy | null>(null)
  const [reservationChangePolicy, setReservationChangePolicy] =
    useState<ReservationChangePolicy | null>(null)
  const [isPolicyLoading, setIsPolicyLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showPolicyAlertDialog, setShowPolicyAlertDialog] = useState(false)
  const [policyAlertMessage, setPolicyAlertMessage] = useState("")
  const [cancelError, setCancelError] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    let isMounted = true
    setIsPolicyLoading(true)
    setLoadError("")

    void fetchReservationPolicies()
      .then(({ cancellation, change }) => {
        if (!isMounted) return
        setCancellationPolicy(cancellation)
        setReservationChangePolicy(change)
      })
      .catch(() => {
        if (!isMounted) return
        setLoadError("予約情報の取得に失敗しました。")
      })
      .finally(() => {
        if (!isMounted) return
        setIsPolicyLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

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

  if (isReservationLoading || isPolicyLoading) {
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
  const editPath = buildPathWithShopId(ROUTES.userReservationChangeMode, shopId)

  function showPolicyAlert(message: string) {
    setPolicyAlertMessage(message)
    setShowPolicyAlertDialog(true)
  }

  return (
    <section className="space-y-5">
      <UserSectionCard title="予約詳細" subtitle="予約の詳細情報を確認できます。">

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
                  {formatDateLongWithWeekday(reservation.date)}
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

          {reservation.paymentMethod ||
          reservation.paymentStatus ||
          reservation.paymentAmountYen != null ||
          reservation.paymentRecordStatus ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <CreditCard className="size-4" />
                決済情報
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] text-muted-foreground">決済方法</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatReservationPaymentMethod(reservation.paymentMethod)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">予約の決済状況</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatPaymentStatusLabel(reservation.paymentStatus)}
                  </p>
                </div>
                {reservation.paymentAmountYen != null ? (
                  <div>
                    <p className="text-[11px] text-muted-foreground">決済金額</p>
                    <p className="text-sm font-semibold text-foreground">
                      ¥{reservation.paymentAmountYen.toLocaleString()}
                      {reservation.paymentCurrency && reservation.paymentCurrency !== "jpy"
                        ? ` (${reservation.paymentCurrency})`
                        : ""}
                    </p>
                  </div>
                ) : null}
                {reservation.paymentRecordStatus ? (
                  <div>
                    <p className="text-[11px] text-muted-foreground">決済レコード状態</p>
                    <p className="text-sm font-semibold text-foreground">
                      {formatPaymentStatusLabel(reservation.paymentRecordStatus)}
                    </p>
                  </div>
                ) : null}
                {reservation.paymentPaidAt ? (
                  <div className="sm:col-span-2">
                    <p className="text-[11px] text-muted-foreground">支払完了日時</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(reservation.paymentPaidAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                ) : null}
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
                    showPolicyAlert(
                      updateEvaluation.reason ?? "予約変更ポリシーにより予約変更できません。",
                    )
                    return
                  }
                  navigate(editPath, {
                    state: { reservationId: reservation.id, isUpdatingExistingReservation: true },
                  })
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
                    showPolicyAlert(
                      cancellationEvaluation.reason ?? "キャンセルポリシーによりキャンセルできません。",
                    )
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
      </UserSectionCard>

      <UserConfirmDialog
        open={showCancelDialog}
        title="予約をキャンセルしますか？"
        description={
          <>
            この操作は取り消せません。
            <br />
            本当にキャンセルしてもよろしいですか？
          </>
        }
        onCancel={() => setShowCancelDialog(false)}
        onConfirm={async () => {
          setCancelError("")
          setIsCancelling(true)
          const result = await cancelUserReservation(reservation.id)
          if (!result.ok) {
            setCancelError(result.error)
            setIsCancelling(false)
            return
          }
          navigate(buildPathWithShopId(ROUTES.userMypage, shopId), { replace: true })
        }}
        confirmLabel="キャンセルする"
        isConfirming={isCancelling}
        confirmDisabled={isCancelling || !cancellationEvaluation.canCancel}
        cancelDisabled={isCancelling}
        errorMessage={cancelError}
        variant="destructive"
      />

      <UserConfirmDialog
        open={showPolicyAlertDialog}
        title="ご案内"
        description={policyAlertMessage}
        onCancel={() => setShowPolicyAlertDialog(false)}
        onConfirm={() => setShowPolicyAlertDialog(false)}
        confirmLabel="閉じる"
        showCancelButton={false}
        variant="default"
      />

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
