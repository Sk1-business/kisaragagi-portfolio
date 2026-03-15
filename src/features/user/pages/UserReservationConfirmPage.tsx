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
import { updateUserReservation } from "@/features/user/api/userReservationApi"
import type { ReservationInputData } from "@/features/user/pages/UserReservationInputPage"
import { buildPathWithShopId, resolveShopName, useShopId } from "@/features/user/hooks/useShopId"

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return `${parsed.getFullYear()}年${parsed.getMonth() + 1}月${parsed.getDate()}日 (${WEEKDAY_LABELS[parsed.getDay()]})`
}

function maskCardNumber(cardNumber: string) {
  const digits = cardNumber.replace(/\s/g, "")
  if (digits.length < 4) return "••••"
  return `•••• •••• •••• ${digits.slice(-4)}`
}

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
  const location = useLocation()
  const navigate = useNavigate()
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

  if (isSubmitted) {
    const isReservationUpdate = Boolean(data.reservationId)
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
          <Link
            to={
              isReservationUpdate
                ? buildPathWithShopId(ROUTES.userMypageReservationDetail, shopId, {
                    reservationId: data.reservationId ?? "",
                  })
                : buildPathWithShopId(ROUTES.userMypage, shopId)
            }
          >
            {isReservationUpdate ? "予約詳細へ" : "マイページへ"}
          </Link>
        </Button>
      </section>
    )
  }

  const shopName = resolveShopName(shopId)
  const paymentLabel = data.paymentMethod === "credit" ? "クレジットカード" : "PayPay"
  const PaymentIcon = data.paymentMethod === "credit" ? CreditCard : Phone
  const isReservationUpdate = Boolean(data.reservationId)

  async function handleSubmit() {
    if (!isReservationUpdate || !data.reservationId) {
      setIsSubmitted(true)
      return
    }

    setSubmitError("")
    setIsSubmitting(true)
    const result = await updateUserReservation({
      reservationId: data.reservationId,
      date: data.date,
      time: data.time,
      mode: data.mode,
      trainerId: data.mode === "nomination" ? data.trainerId || null : null,
      trainerName: data.mode === "nomination" ? data.trainerName || null : null,
      note: data.note,
    })

    if (!result.ok) {
      setSubmitError(result.error)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    setIsSubmitted(true)
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white">
          <h2 className="font-bold">予約確認</h2>
          <p className="mt-0.5 text-xs text-slate-300">
            入力内容をご確認のうえ、「予約する」ボタンで確定してください。
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              予約情報
            </p>
            <InfoRow label="店舗" value={shopName} icon={<Store className="size-4" />} />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <InfoRow label="日付" value={data.date ? formatDateLabel(data.date) : "未選択"} icon={<CalendarDays className="size-4" />} />
              <InfoRow label="時間" value={data.time} icon={<Clock className="size-4" />} />
            </div>
            {data.mode === "nomination" && data.trainerName ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                  <UserRound className="size-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">指名トレーナー</p>
                  <p className="text-sm font-semibold text-foreground">{data.trainerName}</p>
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
          </div>

          <hr className="border-slate-100" />

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              予約者情報
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoRow label="お名前" value={data.fullName} icon={<UserRound className="size-4" />} />
              <InfoRow label="フリガナ" value={data.kana} icon={<UserRound className="size-4" />} />
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
            {isSubmitting ? "処理中..." : isReservationUpdate ? "予約変更を確定する" : "予約する"}
          </Button>
        </div>
        {submitError ? (
          <p className="px-6 pb-5 text-sm text-destructive">{submitError}</p>
        ) : null}
      </div>
    </section>
  )
}
