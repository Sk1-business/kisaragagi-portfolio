import { useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageSquare,
  Phone,
  Star,
  Store,
  UserRound,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { createUserReservation, updateUserReservation } from "@/features/user/api/userReservationApi"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { useSalonName } from "@/features/user/hooks/useSalonName"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import {
  clearReservationUpdateIntent,
  readReservationUpdateIntent,
  usePersistentReservationId,
} from "@/features/user/hooks/usePersistentReservationId"
import type { ReservationInputData } from "@/features/user/pages/UserReservationInputPage"
import { formatDateLongWithWeekday } from "@/lib/dateFormat"
import { maskCardNumber } from "@/lib/paymentCard"

function InfoRow({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value || "—"}</p>
      </div>
    </div>
  )
}

export function UserReservationConfirmPage() {
  const shopId = useShopId()
  const shopName = useSalonName(shopId)
  const location = useLocation()
  const navigate = useNavigate()
  const persistentReservationId = usePersistentReservationId()
  const data = location.state as ReservationInputData | null
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!data) {
    return (
      <section className="py-16 text-center">
        <p className="text-sm text-muted-foreground">予約情報が見つかりませんでした。</p>
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
          <Link to={buildPathWithShopId(ROUTES.userHome, shopId)}>店舗情報へ戻る</Link>
        </Button>
      </section>
    )
  }

  /** state が欠けても session の変更意図で復元（明示的 false の新規予約は除外） */
  const treatAsReservationUpdateFlow =
    data.isUpdatingExistingReservation === true ||
    (data.isUpdatingExistingReservation !== false && readReservationUpdateIntent())

  const effectiveReservationId = (
    data.reservationId?.trim() ||
    (treatAsReservationUpdateFlow ? persistentReservationId : "")
  ).trim()

  if (isSubmitted) {
    const isReservationUpdate =
      treatAsReservationUpdateFlow && Boolean(effectiveReservationId)
    const successMessage = isReservationUpdate
      ? "予約変更が完了しました。更新内容はマイページで確認できます。"
      : "ご予約内容は登録メールアドレスへ送信されます。"
    return (
      <section className="flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {isReservationUpdate ? "予約変更が完了しました" : "予約が完了しました"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{successMessage}</p>
        <Button asChild size="lg" className="mt-6 rounded-xl">
          <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>マイページへ</Link>
        </Button>
      </section>
    )
  }

  const paymentLabel = data.paymentMethod === "credit" ? "クレジットカード" : "PayPay"
  const PaymentIcon = data.paymentMethod === "credit" ? CreditCard : Phone
  const isChangeReservationFlow = treatAsReservationUpdateFlow
  const isReservationUpdate = treatAsReservationUpdateFlow && Boolean(effectiveReservationId)

  async function handleSubmit() {
    if (!data) return

    if (!isReservationUpdate) {
      setSubmitError("")
      setIsSubmitting(true)
      const result = await createUserReservation({
        date: data.date,
        time: data.time,
        mode: data.mode,
        trainerId: data.mode === "nomination" ? data.trainerId || null : null,
        trainerName: data.mode === "nomination" ? data.trainerName || null : null,
        note: data.note,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        preferredMenuId: data.menuId,
        shopSlug: shopId,
        paymentMethod: data.paymentMethod,
      })
      if (!result.ok) {
        setSubmitError(result.error)
        setIsSubmitting(false)
        return
      }
      clearReservationUpdateIntent()
      setIsSubmitting(false)
      setIsSubmitted(true)
      return
    }

    if (!effectiveReservationId) {
      setSubmitError("予約IDが見つかりません。やり直してください。")
      return
    }
    setSubmitError("")
    setIsSubmitting(true)
    const result = await updateUserReservation({
      reservationId: effectiveReservationId,
      date: data.date,
      time: data.time,
      mode: data.mode,
      trainerId: data.mode === "nomination" ? data.trainerId || null : null,
      trainerName: data.mode === "nomination" ? data.trainerName || null : null,
      note: data.note,
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
    })

    if (!result.ok) {
      setSubmitError(result.error)
      setIsSubmitting(false)
      return
    }

    clearReservationUpdateIntent()
    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  return (
    <section className="space-y-5">
      <UserSectionCard
        title="予約確認"
        subtitle={
          isChangeReservationFlow
            ? "入力内容をご確認のうえ、「予約変更を確定する」で更新してください。"
            : "入力内容をご確認のうえ、「予約を確定する」で確定してください。"
        }
      >

        <div className="space-y-5 p-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              予約情報
            </p>
            <InfoRow label="店舗" value={shopName} icon={<Store className="size-4" />} />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <InfoRow label="日付" value={data.date ? formatDateLongWithWeekday(data.date) : "未選択"} icon={<CalendarDays className="size-4" />} />
              <InfoRow label="時間" value={data.time} icon={<Clock className="size-4" />} />
            </div>
            {data.mode === "nomination" ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                  <UserRound className="size-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">指名トレーナー</p>
                  <p className="text-sm font-semibold text-foreground">
                    {data.trainerName?.trim() || "（トレーナー名の取得待ち）"}
                  </p>
                </div>
                {data.trainerRating > 0 ? (
                  <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                    <Star className="size-3 fill-current" />
                    {data.trainerRating.toFixed(1)}
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="mt-3">
                <InfoRow label="予約モード" value="おまかせ" icon={<CalendarDays className="size-4" />} />
              </div>
            )}
            <div className="mt-3">
              <InfoRow label="メニュー" value={data.menuName || "未定"} icon={<MessageSquare className="size-4" />} />
            </div>
          </div>

          <hr className="border-slate-100" />

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              予約者情報
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="お名前" value={data.fullName} icon={<UserRound className="size-4" />} />
              <InfoRow label="メールアドレス" value={data.email} icon={<MessageSquare className="size-4" />} />
              <InfoRow label="電話番号" value={data.phone} icon={<Phone className="size-4" />} />
            </div>
          </div>

          {data.note ? (
            <>
              <hr className="border-slate-100" />
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  ご要望・備考
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-foreground">
                  {data.note}
                </div>
              </div>
            </>
          ) : null}

          <hr className="border-slate-100" />

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              決済方法
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="決済方法" value={paymentLabel} icon={<PaymentIcon className="size-4" />} />
              {data.paymentMethod === "credit" && data.cardNumber ? (
                <InfoRow label="カード番号" value={maskCardNumber(data.cardNumber)} icon={<CreditCard className="size-4" />} />
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-6 py-5">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="rounded-xl"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-1 size-4" />
            修正する
          </Button>
          <Button
            type="button"
            size="lg"
            className="flex-1 rounded-xl text-base"
            onClick={() => {
              void handleSubmit()
            }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "処理中..."
              : isChangeReservationFlow
                ? "予約変更を確定する"
                : "予約を確定する"}
          </Button>
        </div>
        {submitError ? (
          <p className="px-6 pb-5 text-sm text-destructive">{submitError}</p>
        ) : null}
      </UserSectionCard>
    </section>
  )
}
