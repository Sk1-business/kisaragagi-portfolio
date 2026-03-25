import { type FormEvent, useEffect, useState } from "react"
import {
  CalendarDays,
  Clock,
  CreditCard,
  MessageSquare,
  Phone,
  UserRound,
} from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import { fetchPaymentCards, type PaymentCard } from "@/features/user/api/userPaymentApi"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { fetchUserProfile } from "@/features/user/api/userProfileApi"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import { usePersistentReservationId } from "@/features/user/hooks/usePersistentReservationId"
import { useUserTrainers } from "@/features/user/hooks/useUserTrainers"
import { formatDateLongWithWeekday } from "@/lib/dateFormat"
import { formatCardNumber, formatExpiry, maskCardNumber, validateExpiry } from "@/lib/paymentCard"
import {
  isCompletePhoneSegments,
  joinPhoneSegments,
  parsePhoneToSegments,
  updatePhoneSegment,
  type PhoneSegments,
} from "@/lib/phone"

export interface ReservationInputData {
  reservationId?: string
  /** true のときのみ既存予約の変更（sessionStorage の古い ID では新規扱いにしない） */
  isUpdatingExistingReservation?: boolean
  mode: string
  date: string
  time: string
  trainerId: string
  trainerName: string
  trainerRating: number
  menuId?: string
  menuName: string
  fullName: string
  email: string
  phone: string
  note: string
  paymentMethod: string
  cardNumber: string
  cardExpiry: string
  cardCvc: string
}


const PAYMENT_METHODS = [
  { id: "credit", label: "クレジットカード", icon: CreditCard },
  { id: "paypay", label: "PayPay", icon: Phone },
] as const

export function UserReservationInputPage() {
  const shopId = useShopId()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as {
    mode?: string
    trainerId?: string
    trainerName?: string
    reservationId?: string
    isUpdatingExistingReservation?: boolean
    date?: string
    time?: string
    preferredMenuId?: string
    preferredMenuName?: string
  } | null) ?? null
  const mode = state?.mode ?? "omakase"
  const trainerId = state?.trainerId ?? ""
  const trainerName = state?.trainerName ?? ""
  const isUpdateFlow = state?.isUpdatingExistingReservation === true
  const stateReservationId = (state?.reservationId ?? "").trim()
  const persistentReservationId = usePersistentReservationId()
  const reservationId = isUpdateFlow
    ? (stateReservationId || persistentReservationId).trim()
    : ""
  const date = state?.date ?? ""
  const time = state?.time ?? ""
  const preferredMenuId = state?.preferredMenuId ?? ""
  const preferredMenuName = state?.preferredMenuName ?? ""

  const [paymentMethod, setPaymentMethod] = useState<string>("credit")
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneSegments, setPhoneSegments] = useState<PhoneSegments>(["", "", ""])
  const [phoneError, setPhoneError] = useState("")
  const [paymentCards, setPaymentCards] = useState<PaymentCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState("")
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [useCustomCardInput, setUseCustomCardInput] = useState(false)
  const [customCardNumber, setCustomCardNumber] = useState("")
  const [customCardExpiry, setCustomCardExpiry] = useState("")
  const [customCardCvc, setCustomCardCvc] = useState("")
  const [cardInputError, setCardInputError] = useState("")
  const [cardExpiryError, setCardExpiryError] = useState("")
  const { trainers } = useUserTrainers(shopId)
  const selectedTrainer =
    mode === "nomination" ? trainers.find((trainer) => trainer.id === trainerId) : undefined

  useEffect(() => {
    let isMounted = true
    fetchUserProfile().then((profile) => {
      if (!isMounted) return
      const [parsedLastName, ...restName] = profile.fullName.trim().split(/\s+/)
      setLastName(parsedLastName ?? "")
      setFirstName(restName.join(" "))
      setEmail(profile.email)
      setPhoneSegments(parsePhoneToSegments(profile.phone))
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
      .catch(() => {
        if (!isMounted) return
        setPaymentCards([])
        setSelectedCardId("")
        setUseCustomCardInput(true)
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
    const useManualCard = paymentMethod === "credit" && useCustomCardInput

    if (useManualCard) {
      const cardDigits = customCardNumber.replace(/\s/g, "")
      if (cardDigits.length !== 16) {
        setCardInputError("カード番号は16桁で入力してください。")
        return
      }
      const expiryError = validateExpiry(customCardExpiry)
      if (expiryError) {
        setCardExpiryError(expiryError)
        return
      }
      if (customCardCvc.length < 3 || customCardCvc.length > 4) {
        setCardInputError("セキュリティコードは3〜4桁で入力してください。")
        return
      }
      setCardInputError("")
      setCardExpiryError("")
    }
    if (!isCompletePhoneSegments(phoneSegments)) {
      setPhoneError("電話番号は数字のみで3-4-4桁を入力してください。")
      return
    }
    setPhoneError("")
    const fullName = `${lastName} ${firstName}`.trim()
    const phone = joinPhoneSegments(phoneSegments)
    const isNomination = mode === "nomination"
    const selectedMenuName = isNomination ? preferredMenuName || "未定" : "未定"
    const selectedMenuId = isNomination ? preferredMenuId || undefined : undefined

    const inputData: ReservationInputData = {
      ...(isUpdateFlow && reservationId ? { reservationId } : {}),
      isUpdatingExistingReservation: isUpdateFlow,
      mode,
      date,
      time,
      trainerId: trainerId || selectedTrainer?.id || "",
      trainerName: trainerName || selectedTrainer?.name || "",
      trainerRating: selectedTrainer?.rating ?? 0,
      menuId: selectedMenuId,
      menuName: selectedMenuName,
      fullName,
      email,
      phone,
      note: String(fd.get("note") ?? ""),
      paymentMethod,
      cardNumber:
        paymentMethod === "credit"
          ? useSavedCard
            ? selectedCard.cardNumber
            : customCardNumber
          : "",
      cardExpiry:
        paymentMethod === "credit"
          ? useSavedCard
            ? selectedCard.expiry
            : customCardExpiry
          : "",
      cardCvc:
        paymentMethod === "credit"
          ? useSavedCard
            ? selectedCard.cvc
            : customCardCvc
          : "",
    }

    navigate(ROUTES.userReservationConfirm, {
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
      <UserSectionCard title="予約情報入力" subtitle="予約に必要な情報を入力してください。">

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
                  {date ? formatDateLongWithWeekday(date) : "未選択"}
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
          {mode === "nomination" ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                <UserRound className="size-5 text-slate-400" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">指名トレーナー</p>
                <p className="text-sm font-semibold text-foreground">
                  {(selectedTrainer?.name ?? trainerName?.trim()) || "（一覧の読み込み中）"}
                </p>
              </div>
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
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">メニュー</p>
              <p className="text-sm font-semibold text-foreground">
                {mode === "nomination" ? preferredMenuName || "未定" : "未定"}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 border-b border-slate-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              予約者情報
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lastName">姓</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="山田"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="firstName">名</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="太郎"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
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
                <Label>電話番号</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="phone1"
                    type="tel"
                    inputMode="numeric"
                    placeholder="090"
                    value={phoneSegments[0]}
                    onChange={(event) => {
                      setPhoneSegments((prev) => updatePhoneSegment(prev, 0, event.target.value))
                      setPhoneError("")
                    }}
                    required
                    className="min-w-0 flex-1 rounded-lg text-center"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    id="phone2"
                    type="tel"
                    inputMode="numeric"
                    placeholder="1234"
                    value={phoneSegments[1]}
                    onChange={(event) => {
                      setPhoneSegments((prev) => updatePhoneSegment(prev, 1, event.target.value))
                      setPhoneError("")
                    }}
                    required
                    className="min-w-0 flex-1 rounded-lg text-center"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    id="phone3"
                    type="tel"
                    inputMode="numeric"
                    placeholder="5678"
                    value={phoneSegments[2]}
                    onChange={(event) => {
                      setPhoneSegments((prev) => updatePhoneSegment(prev, 2, event.target.value))
                      setPhoneError("")
                    }}
                    required
                    className="min-w-0 flex-1 rounded-lg text-center"
                  />
                </div>
                {phoneError ? <p className="text-xs text-destructive">{phoneError}</p> : null}
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
                    {cardInputError ? (
                      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 sm:col-span-2">
                        {cardInputError}
                      </div>
                    ) : null}
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="cardNumber">カード番号</Label>
                      <Input
                        id="cardNumber"
                        name="cardNumber"
                        value={customCardNumber}
                        onChange={(event) => {
                          setCustomCardNumber(formatCardNumber(event.target.value))
                          setCardInputError("")
                        }}
                        inputMode="numeric"
                        autoComplete="cc-number"
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
                        value={customCardExpiry}
                        onChange={(event) => {
                          const formatted = formatExpiry(event.target.value)
                          setCustomCardExpiry(formatted)
                          if (formatted.length < 5) {
                            setCardExpiryError("")
                            return
                          }
                          setCardExpiryError(validateExpiry(formatted))
                        }}
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        required={paymentMethod === "credit" && useCustomCardInput}
                        className="rounded-lg"
                      />
                      {cardExpiryError ? <p className="text-xs text-destructive">{cardExpiryError}</p> : null}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="cardCvc">セキュリティコード</Label>
                      <Input
                        id="cardCvc"
                        name="cardCvc"
                        value={customCardCvc}
                        onChange={(event) => {
                          setCustomCardCvc(event.target.value.replace(/\D/g, "").slice(0, 4))
                          setCardInputError("")
                        }}
                        inputMode="numeric"
                        autoComplete="cc-csc"
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
      </UserSectionCard>
    </section>
  )
}
