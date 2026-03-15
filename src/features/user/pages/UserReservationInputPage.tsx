import { type FormEvent, useEffect, useState } from "react"
import {
  CalendarDays,
  Clock,
  CreditCard,
  MessageSquare,
  Phone,
  Star,
  UserRound,
} from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import mockTrainers from "@/features/user/api/mockTrainers.json"
import { fetchPaymentCards, type PaymentCard } from "@/features/user/api/userPaymentApi"
import { fetchUserProfile } from "@/features/user/api/userProfileApi"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"

interface Trainer {
  id: string
  name: string
  specialty: string
  rating: number
}

export interface ReservationInputData {
  reservationId?: string
  mode: string
  date: string
  time: string
  trainerId: string
  trainerName: string
  trainerRating: number
  fullName: string
  kana: string
  email: string
  phone: string
  note: string
  paymentMethod: string
  cardNumber: string
  cardExpiry: string
  cardCvc: string
}

const trainers = mockTrainers as Trainer[]
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

const PAYMENT_METHODS = [
  { id: "credit", label: "クレジットカード", icon: CreditCard },
  { id: "paypay", label: "PayPay", icon: Phone },
] as const

export function UserReservationInputPage() {
  const shopId = useShopId()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode") ?? "omakase"
  const trainerId = searchParams.get("trainerId") ?? ""
  const reservationId = searchParams.get("reservationId") ?? ""
  const date = searchParams.get("date") ?? ""
  const time = searchParams.get("time") ?? ""
  const selectedTrainer =
    mode === "nomination" ? trainers.find((trainer) => trainer.id === trainerId) : undefined

  const [paymentMethod, setPaymentMethod] = useState<string>("credit")
  const [fullName, setFullName] = useState("")
  const [kana, setKana] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState("")
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [useCustomCardInput, setUseCustomCardInput] = useState(false)

  useEffect(() => {
    let isMounted = true
    fetchUserProfile().then((profile) => {
      if (!isMounted) return
      setFullName(profile.fullName)
      setKana(profile.kana)
      setEmail(profile.email)
      setPhone(profile.phone)
    })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    fetchPaymentCards()
      .then((cards) => {
        if (!isMounted) return
        setPaymentCards(cards)
        if (cards.length > 0) {
          setSelectedCardId(cards[0].id)
          setUseCustomCardInput(false)
        } else {
          setSelectedCardId("")
          setUseCustomCardInput(true)
        }
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoadingCards(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fd = new FormData(event.currentTarget)
    const selectedCard = paymentCards.find((card) => card.id === selectedCardId)
    const useSavedCard = paymentMethod === "credit" && !useCustomCardInput && !!selectedCard

    const inputData: ReservationInputData = {
      reservationId: reservationId || undefined,
      mode,
      date,
      time,
      trainerId: selectedTrainer?.id ?? "",
      trainerName: selectedTrainer?.name ?? "",
      trainerRating: selectedTrainer?.rating ?? 0,
      fullName,
      kana,
      email,
      phone,
      note: String(fd.get("note") ?? ""),
      paymentMethod,
      cardNumber:
        paymentMethod === "credit"
          ? useSavedCard
            ? selectedCard.cardNumber
            : String(fd.get("cardNumber") ?? "")
          : "",
      cardExpiry:
        paymentMethod === "credit"
          ? useSavedCard
            ? selectedCard.expiry
            : String(fd.get("cardExpiry") ?? "")
          : "",
      cardCvc:
        paymentMethod === "credit"
          ? useSavedCard
            ? selectedCard.cvc
            : String(fd.get("cardCvc") ?? "")
          : "",
    }

    const confirmParams = new URLSearchParams()
    if (shopId) {
      confirmParams.set("shopId", shopId)
    }

    navigate(`${ROUTES.userReservationConfirm}?${confirmParams.toString()}`, {
      state: inputData,
    })
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(buildPathWithShopId(ROUTES.userHome, shopId))
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white">
          <h2 className="font-bold">予約情報入力</h2>
          <p className="mt-0.5 text-xs text-slate-300">予約に必要な情報を入力してください。</p>
        </div>

        <div className="space-y-1 border-b border-slate-100 px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            予約情報
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">日付</p>
                <p className="text-sm font-semibold text-foreground">
                  {date ? formatDateLabel(date) : "未選択"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Clock className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">時間</p>
                <p className="text-sm font-semibold text-foreground">{time || "未選択"}</p>
              </div>
            </div>
          </div>
          {selectedTrainer ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                <UserRound className="size-5 text-slate-400" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">指名トレーナー</p>
                <p className="text-sm font-semibold text-foreground">{selectedTrainer.name}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                <Star className="size-3 fill-current" />
                {selectedTrainer.rating.toFixed(1)}
              </span>
            </div>
          ) : (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-[11px] text-muted-foreground">予約モード</p>
                <p className="text-sm font-semibold text-foreground">おまかせ</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 border-b border-slate-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              予約者情報
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">お名前</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="山田 太郎"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="kana">フリガナ</Label>
                <Input
                  id="kana"
                  name="kana"
                  placeholder="ヤマダ タロウ"
                  value={kana}
                  onChange={(event) => setKana(event.target.value)}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">電話番号</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="090-0000-0000"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  required
                  className="rounded-lg"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                ご要望・備考
              </p>
            </div>
            <textarea
              name="note"
              rows={3}
              placeholder="ご要望やアレルギー等があればお書きください"
              className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          <div className="space-y-4 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                決済方法
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((method) => {
                const isActive = paymentMethod === method.id
                const Icon = method.icon
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : "border-slate-200 bg-white text-foreground hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="size-4" />
                    {method.label}
                  </button>
                )
              })}
            </div>

            {paymentMethod === "credit" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    登録済みカード
                  </p>
                  {isLoadingCards ? (
                    <p className="text-sm text-muted-foreground">カード情報を読み込み中です...</p>
                  ) : paymentCards.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {paymentCards.map((card) => {
                        const isSelected = selectedCardId === card.id && !useCustomCardInput
                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => {
                              setSelectedCardId(card.id)
                              setUseCustomCardInput(false)
                            }}
                            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                              isSelected
                                ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                : "border-slate-200 bg-white text-foreground hover:bg-slate-50"
                            }`}
                          >
                            <p className="font-semibold">{`${card.brand} ${maskCardNumber(card.cardNumber)}`}</p>
                            <p className={`text-xs ${isSelected ? "text-slate-200" : "text-muted-foreground"}`}>
                              {`有効期限: ${card.expiry}`}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      登録済みカードがありません。下記フォームから入力してください。
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  variant={useCustomCardInput ? "default" : "outline"}
                  className="rounded-xl"
                  onClick={() => {
                    setSelectedCardId("")
                    setUseCustomCardInput(true)
                  }}
                >
                  上記以外
                </Button>

                {useCustomCardInput ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="cardNumber">カード番号</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        placeholder="0000 0000 0000 0000"
                        required={paymentMethod === "credit" && useCustomCardInput}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cardExpiry">有効期限</Label>
                      <Input
                        id="cardExpiry"
                        name="cardExpiry"
                        placeholder="MM/YY"
                        required={paymentMethod === "credit" && useCustomCardInput}
                        className="rounded-lg"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cardCvc">セキュリティコード</Label>
                      <Input
                        id="cardCvc"
                        name="cardCvc"
                        placeholder="123"
                        required={paymentMethod === "credit" && useCustomCardInput}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 px-6 py-5">
            <Button type="button" variant="outline" size="lg" className="rounded-xl" onClick={handleBack}>
              前の画面へ戻る
            </Button>
            <Button type="submit" size="lg" className="flex-1 rounded-xl text-base">
              確認画面へ進む
            </Button>
          </div>
        </form>
      </div>
    </section>
  )
}
