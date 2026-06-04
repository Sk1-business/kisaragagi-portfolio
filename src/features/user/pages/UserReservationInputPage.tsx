import { type FormEvent, useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  MessageSquare,
  Phone,
  UserRound,
} from "lucide-react"
import { Link, useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import {
  fetchPaymentCards,
  type PaymentCard,
} from "@/features/user/api/userPaymentApi"
import {
  createReservationPaymentIntent,
  createUserReservation,
  fetchMenuForReservationCheckout,
  finalizePaidUserReservation,
  type ReservationCheckoutMenu,
} from "@/features/user/api/userReservationApi"
import { fetchUserProfile } from "@/features/user/api/userProfileApi"
import { ReservationInputReviewSummary } from "@/features/user/components/ReservationInputReviewSummary"
import {
  UserReservationStripePayment,
  type UserReservationStripePaymentHandle,
} from "@/features/user/components/UserReservationStripePayment"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import {
  clearReservationUpdateIntent,
  usePersistentReservationId,
} from "@/features/user/hooks/usePersistentReservationId"
import { useUserTrainers } from "@/features/user/hooks/useUserTrainers"
import { addMinutesToTimeString, formatDateLongWithWeekday } from "@/lib/dateFormat"
import {
  isCompletePhoneSegments,
  joinPhoneSegments,
  parsePhoneToSegments,
  updatePhoneSegment,
  type PhoneSegments,
} from "@/lib/phone"

export interface ReservationInputData {
  reservationId?: string
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
  /** 確認画面の「想定時間」「料金」表示用（入力時点のメニュー情報） */
  menuDurationMinutes?: number | null
  menuPrice?: number | null
  /** credit のとき: 登録カード or 新規入力（新規は入力画面で Stripe → 同一ページで確認） */
  creditCardMode?: "saved" | "new"
  savedCardId?: string | null
  /** 確認画面表示用 */
  savedCardSummary?: string | null
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
  const [resolvedMenu, setResolvedMenu] = useState<ReservationCheckoutMenu | null>(null)
  const [resolvedMenuLoading, setResolvedMenuLoading] = useState(true)

  const [paymentMethod, setPaymentMethod] = useState<string>("credit")
  const [savedCards, setSavedCards] = useState<PaymentCard[]>([])
  const [savedCardsLoading, setSavedCardsLoading] = useState(true)
  const [creditCardMode, setCreditCardMode] = useState<"saved" | "new">("new")
  const [selectedSavedCardId, setSelectedSavedCardId] = useState("")
  const [savedCardResolveError, setSavedCardResolveError] = useState("")
  const [creditFlowError, setCreditFlowError] = useState("")
  const [savedCardsBootstrapped, setSavedCardsBootstrapped] = useState(false)
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneSegments, setPhoneSegments] = useState<PhoneSegments>(["", "", ""])
  const [phoneError, setPhoneError] = useState("")
  const [note, setNote] = useState("")
  const [reviewStep, setReviewStep] = useState(false)
  const [reviewData, setReviewData] = useState<ReservationInputData | null>(null)
  const [stripeClientSecret, setStripeClientSecret] = useState("")
  const [stripePublishableKey, setStripePublishableKey] = useState("")
  const [stripeAmountYen, setStripeAmountYen] = useState(0)
  const [skipCardPaymentInline, setSkipCardPaymentInline] = useState(false)
  const [stripeInitError, setStripeInitError] = useState("")
  const [isStripeReady, setIsStripeReady] = useState(false)
  const [finalSubmitError, setFinalSubmitError] = useState("")
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const stripePaymentRef = useRef<UserReservationStripePaymentHandle>(null)
  const { trainers } = useUserTrainers(shopId)
  const selectedTrainer =
    mode === "nomination" ? trainers.find((trainer) => trainer.id === trainerId) : undefined
  const displayMenuName =
    mode === "nomination" ? preferredMenuName || resolvedMenu?.name || "未定" : resolvedMenu?.name ?? "未定"
  const isZeroPriceMenu = resolvedMenu !== null && resolvedMenu.price <= 0
  const expectedTimeRange = useMemo(() => {
    if (!time) return "未選択"
    const minutes = resolvedMenu?.duration_minutes
    if (!minutes || minutes <= 0) return time
    return `${time}〜${addMinutesToTimeString(time, minutes)}`
  }, [time, resolvedMenu?.duration_minutes])

  const showInlineStripe =
    !isUpdateFlow &&
    paymentMethod === "credit" &&
    creditCardMode === "new" &&
    !isZeroPriceMenu

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      if (isUpdateFlow || !showInlineStripe) {
        setStripeClientSecret("")
        setStripePublishableKey("")
        setStripeAmountYen(0)
        setSkipCardPaymentInline(false)
        setIsStripeReady(false)
        setStripeInitError("")
        return
      }
      // 確認ステップでは既に取得した PaymentIntent を維持する（ここでクリアするとフォームが永遠に準備中になる）
      if (reviewStep) {
        return
      }
      if (!resolvedMenu || !date || !time || !shopId?.trim()) {
        return
      }
      setStripeInitError("")
      setIsStripeReady(false)
      setStripeClientSecret("")
      setStripePublishableKey("")
      setStripeAmountYen(0)
      setSkipCardPaymentInline(false)
      void createReservationPaymentIntent({
        shopSlug: shopId,
        menuId: resolvedMenu.menu_id,
        mode,
        trainerId: mode === "nomination" ? trainerId || null : null,
        date,
        time,
      }).then((result) => {
        if (!active) return
        if (!result.ok) {
          setStripeInitError(result.error)
          return
        }
        if ("skipPayment" in result && result.skipPayment) {
          setSkipCardPaymentInline(true)
          setIsStripeReady(true)
          return
        }
        setStripeClientSecret(result.clientSecret)
        setStripePublishableKey(result.publishableKey)
        setStripeAmountYen(result.amountYen)
      })
    })
    return () => {
      active = false
    }
  }, [
    reviewStep,
    isUpdateFlow,
    showInlineStripe,
    resolvedMenu,
    date,
    time,
    shopId,
    mode,
    trainerId,
  ])

  useEffect(() => {
    let isMounted = true
    queueMicrotask(() => {
      if (!isMounted) return
      if (!shopId || isZeroPriceMenu) {
        setSavedCards([])
        setSavedCardsLoading(false)
        return
      }
      setSavedCardsLoading(true)
      void fetchPaymentCards(shopId)
        .then((list) => {
          if (!isMounted) return
          setSavedCards(list)
        })
        .catch(() => {
          if (!isMounted) return
          setSavedCards([])
        })
        .finally(() => {
          if (!isMounted) return
          setSavedCardsLoading(false)
        })
    })
    return () => {
      isMounted = false
    }
  }, [shopId, isZeroPriceMenu])

  useEffect(() => {
    queueMicrotask(() => {
      if (savedCardsLoading || savedCardsBootstrapped) return
      if (savedCards.length > 0) {
        setCreditCardMode("saved")
        setSelectedSavedCardId(savedCards[0].id)
      }
      setSavedCardsBootstrapped(true)
    })
  }, [savedCardsLoading, savedCards, savedCardsBootstrapped])

  useEffect(() => {
    queueMicrotask(() => {
      if (creditCardMode !== "saved" || savedCards.length > 0) return
      setCreditCardMode("new")
    })
  }, [creditCardMode, savedCards.length])

  useEffect(() => {
    queueMicrotask(() => {
      setCreditFlowError("")
    })
  }, [paymentMethod, creditCardMode, selectedSavedCardId])

  useEffect(() => {
    queueMicrotask(() => {
      if (paymentMethod !== "credit" || creditCardMode !== "saved") {
        setSavedCardResolveError("")
        return
      }
      setSavedCardResolveError(selectedSavedCardId ? "" : "登録カードを選択してください。")
    })
  }, [paymentMethod, creditCardMode, selectedSavedCardId])

  useEffect(() => {
    let isMounted = true
    void fetchUserProfile().then((profile) => {
      if (!isMounted) return
      queueMicrotask(() => {
        const [parsedLastName, ...restName] = profile.fullName.trim().split(/\s+/)
        setLastName(parsedLastName ?? "")
        setFirstName(restName.join(" "))
        setEmail(profile.email)
        setPhoneSegments(parsePhoneToSegments(profile.phone))
      })
    })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true
    queueMicrotask(() => {
      if (!isMounted) return
      if (!shopId?.trim()) {
        setResolvedMenu(null)
        setResolvedMenuLoading(false)
        return
      }
      setResolvedMenuLoading(true)
      void fetchMenuForReservationCheckout({
        shopSlug: shopId,
        preferredMenuId: preferredMenuId || undefined,
        mode,
        trainerId: mode === "nomination" ? trainerId || null : null,
      })
        .then((menu) => {
          if (!isMounted) return
          setResolvedMenu(menu)
        })
        .catch(() => {
          if (!isMounted) return
          setResolvedMenu(null)
        })
        .finally(() => {
          if (!isMounted) return
          setResolvedMenuLoading(false)
        })
    })
    return () => {
      isMounted = false
    }
  }, [shopId, preferredMenuId, mode, trainerId])

  function buildInputData(): ReservationInputData | null {
    if (!resolvedMenu) return null
    const zeroPrice = resolvedMenu.price <= 0
    const fullName = `${lastName} ${firstName}`.trim()
    const phone = joinPhoneSegments(phoneSegments)
    const isNomination = mode === "nomination"
    const selectedMenuName = isNomination ? preferredMenuName || resolvedMenu.name : resolvedMenu.name
    const selectedSavedCard = savedCards.find((c) => c.id === selectedSavedCardId)
    const isCredit = !zeroPrice && paymentMethod === "credit"
    const useSavedStripe =
      isCredit && creditCardMode === "saved" && Boolean(selectedSavedCardId.trim())

    return {
      ...(isUpdateFlow && reservationId ? { reservationId } : {}),
      isUpdatingExistingReservation: isUpdateFlow,
      mode,
      date,
      time,
      trainerId: trainerId || selectedTrainer?.id || "",
      trainerName: trainerName || selectedTrainer?.name || "",
      trainerRating: selectedTrainer?.rating ?? 0,
      menuId: resolvedMenu.menu_id,
      menuName: selectedMenuName,
      fullName,
      email,
      phone,
      note,
      paymentMethod: zeroPrice ? "free" : paymentMethod,
      cardNumber: "",
      cardExpiry: "",
      cardCvc: "",
      menuDurationMinutes: resolvedMenu.duration_minutes,
      menuPrice: resolvedMenu.price,
      creditCardMode: isCredit ? creditCardMode : undefined,
      savedCardId: useSavedStripe ? selectedSavedCardId.trim() : null,
      savedCardSummary:
        useSavedStripe && selectedSavedCard
          ? `${selectedSavedCard.brand} ${selectedSavedCard.maskedNumber}`
          : null,
    }
  }

  function handleGoReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isCompletePhoneSegments(phoneSegments)) {
      setPhoneError("電話番号は数字のみで3-4-4桁を入力してください。")
      return
    }
    setPhoneError("")
    setCreditFlowError("")

    if (!resolvedMenu) {
      setCreditFlowError("メニュー情報を取得できませんでした。しばらくしてから再度お試しください。")
      return
    }

    const zeroPrice = resolvedMenu.price <= 0

    if (!zeroPrice && paymentMethod === "credit" && creditCardMode === "saved") {
      if (savedCards.length === 0) {
        setCreditFlowError("登録済みのカードがありません。新しいカードを選ぶか、マイページでカードを登録してください。")
        return
      }
      if (!selectedSavedCardId.trim()) {
        setCreditFlowError("登録カードを選択してください。")
        return
      }
      if (savedCardResolveError) {
        return
      }
    }

    if (showInlineStripe && !skipCardPaymentInline) {
      if (stripeInitError) {
        setCreditFlowError(stripeInitError)
        return
      }
      if (!stripeClientSecret || !stripePublishableKey) {
        setCreditFlowError("決済フォームの準備ができていません。少し待ってから再度お試しください。")
        return
      }
      if (!isStripeReady) {
        setCreditFlowError("カード入力フォームの読み込みが完了するまでお待ちください。")
        return
      }
    }

    const inputData = buildInputData()
    if (!inputData) return

    const useInlineNewCardFlow =
      showInlineStripe && inputData.paymentMethod === "credit" && inputData.creditCardMode === "new"

    if (useInlineNewCardFlow) {
      setReviewData(inputData)
      setReviewStep(true)
      setFinalSubmitError("")
      return
    }

    navigate(ROUTES.userReservationConfirm, {
      state: inputData,
    })
  }

  async function handleFinalSubmit() {
    if (!reviewData || !shopId?.trim()) return
    setFinalSubmitError("")
    setIsSubmittingFinal(true)

    const commonPayload = {
      date: reviewData.date,
      time: reviewData.time,
      mode: reviewData.mode,
      trainerId: reviewData.mode === "nomination" ? reviewData.trainerId || null : null,
      trainerName: reviewData.mode === "nomination" ? reviewData.trainerName || null : null,
      note: reviewData.note,
      fullName: reviewData.fullName,
      email: reviewData.email,
      phone: reviewData.phone,
      preferredMenuId: reviewData.menuId,
      shopSlug: shopId,
      paymentMethod: reviewData.paymentMethod,
    }

    try {
      if (reviewData.paymentMethod === "credit") {
        if (skipCardPaymentInline) {
          const result = await createUserReservation({
            ...commonPayload,
            paymentMethod: "free",
          })
          if (!result.ok) {
            setFinalSubmitError(result.error)
            setIsSubmittingFinal(false)
            return
          }
        } else {
          if (!stripePaymentRef.current) {
            setFinalSubmitError("お支払いフォームの準備ができていません。")
            setIsSubmittingFinal(false)
            return
          }
          const paymentIntentId = await stripePaymentRef.current.confirm()
          const paid = await finalizePaidUserReservation({
            ...commonPayload,
            paymentIntentId,
          })
          if (!paid.ok) {
            setFinalSubmitError(paid.error)
            setIsSubmittingFinal(false)
            return
          }
        }
      } else {
        const result = await createUserReservation(commonPayload)
        if (!result.ok) {
          setFinalSubmitError(result.error)
          setIsSubmittingFinal(false)
          return
        }
      }

      clearReservationUpdateIntent()
      setIsSubmittingFinal(false)
      setIsCompleted(true)
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "お支払いに失敗しました。"
      setFinalSubmitError(message)
      setIsSubmittingFinal(false)
    }
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(buildPathWithShopId(ROUTES.userHome, shopId))
  }

  const reviewExpectedTimeRange = useMemo(() => {
    if (!reviewData?.time) return "未選択"
    const minutes = reviewData.menuDurationMinutes
    if (!minutes || minutes <= 0) return reviewData.time
    return `${reviewData.time}〜${addMinutesToTimeString(reviewData.time, minutes)}`
  }, [reviewData])

  const reviewDisplayPriceText = useMemo(() => {
    if (!reviewData) return "未定"
    if (reviewData.paymentMethod === "free" || skipCardPaymentInline) return "現地で決済"
    if (stripeAmountYen > 0) return `¥${stripeAmountYen.toLocaleString()}`
    if (reviewData.menuPrice != null) return `¥${reviewData.menuPrice.toLocaleString()}`
    return "未定"
  }, [reviewData, skipCardPaymentInline, stripeAmountYen])

  const confirmButtonDisabled =
    resolvedMenuLoading ||
    !resolvedMenu ||
    (showInlineStripe &&
      !skipCardPaymentInline &&
      (!stripeClientSecret || !stripePublishableKey || !isStripeReady))

  if (isCompleted) {
    return (
      <section className="flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-bold text-foreground">予約が完了しました</h2>
        <p className="mt-2 text-sm text-muted-foreground">マイページから内容をご確認いただけます。</p>
        <Button asChild size="lg" className="mt-6 rounded-xl">
          <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>マイページへ</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <UserSectionCard
        title={reviewStep ? "予約内容の確認" : "予約情報入力"}
        subtitle={
          reviewStep
            ? "内容をご確認のうえ、確定してください。"
            : "予約に必要な情報を入力してください。"
        }
      >
        {!reviewStep ? (
          <div className="space-y-1 border-b border-slate-100 px-6 py-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {"予約情報"}
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] text-muted-foreground">{"日付"}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {date ? formatDateLongWithWeekday(date) : "未選択"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <Clock className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] text-muted-foreground">{"想定時間"}</p>
                  <p className="text-sm font-semibold text-foreground">{expectedTimeRange}</p>
                </div>
              </div>
            </div>
            {mode === "nomination" ? (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
                  <UserRound className="size-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">{"指名トレーナー"}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {(selectedTrainer?.name ?? trainerName?.trim()) || "一覧の読み込み中"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] text-muted-foreground">{"予約モード"}</p>
                  <p className="text-sm font-semibold text-foreground">{"おまかせ"}</p>
                </div>
              </div>
            )}
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground">{"メニュー"}</p>
                  <p className="truncate text-sm font-semibold text-foreground">{displayMenuName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <CreditCard className="size-4 shrink-0 text-muted-foreground" />
                <div>
                  <p className="text-[11px] text-muted-foreground">{"料金"}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {resolvedMenuLoading
                      ? "読み込み中…"
                      : isZeroPriceMenu
                        ? "現地で決済"
                        : resolvedMenu != null
                          ? `¥${resolvedMenu.price.toLocaleString()}`
                          : "未定"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {!reviewStep ? (
          <form id="reservation-input-form" onSubmit={handleGoReview}>
          <div className="space-y-5 border-b border-slate-100 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {"予約者情報"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lastName">{"姓"}</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder={"山田"}
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="firstName">{"名"}</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder={"太郎"}
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  required
                  className="rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{"メールアドレス"}</Label>
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
                <Label>{"電話番号"}</Label>
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
                {"ご要望・備考"}
              </p>
            </div>
            <textarea
              name="note"
              rows={3}
              placeholder={"ご要望やアレルギー情報があればご記入ください"}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>

          {!isZeroPriceMenu ? (
            <div className="space-y-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {"決済方法"}
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
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <p className="text-sm font-medium text-foreground">{"クレジットカードの指定"}</p>
                  {savedCardsLoading ? (
                    <p className="text-xs text-muted-foreground">{"登録カードを読み込み中…"}</p>
                  ) : null}
                  {!savedCardsLoading && savedCards.length > 0 ? (
                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 has-[:checked]:border-slate-900 has-[:checked]:ring-1 has-[:checked]:ring-slate-900">
                      <input
                        type="radio"
                        name="creditCardMode"
                        className="mt-1"
                        checked={creditCardMode === "saved"}
                        onChange={() => setCreditCardMode("saved")}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm font-medium">{"マイページに登録したカードを使う"}</span>
                        {creditCardMode === "saved" ? (
                          <div className="mt-2 space-y-2">
                            {savedCards.map((card) => {
                              const checked = selectedSavedCardId === card.id
                              return (
                                <button
                                  key={card.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedSavedCardId(card.id)
                                    setCreditCardMode("saved")
                                  }}
                                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                                    checked
                                      ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                                      : "border-slate-200 bg-white text-foreground hover:bg-slate-50"
                                  }`}
                                >
                                  <span className="font-medium">{card.brand}</span>
                                  <span className="ml-2 opacity-90">{card.maskedNumber}</span>
                                  <span className="ml-2 text-xs opacity-80">期限 {card.expiry}</span>
                                </button>
                              )
                            })}
                            {savedCardResolveError ? (
                              <p className="text-xs text-destructive">{savedCardResolveError}</p>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </label>
                  ) : null}
                  {!savedCardsLoading && savedCards.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      {"登録済みのカードはありません。下の「新しいカードを入力する」で続けるか、"}
                      <Link
                        to={buildPathWithShopId(ROUTES.userMypagePayment, shopId)}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        {"マイページのお支払い設定"}
                      </Link>
                      {"から登録できます。"}
                    </p>
                  ) : null}

                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 has-[:checked]:border-slate-900 has-[:checked]:ring-1 has-[:checked]:ring-slate-900">
                    <input
                      type="radio"
                      name="creditCardMode"
                      className="mt-1"
                      checked={creditCardMode === "new"}
                      onChange={() => {
                        setCreditCardMode("new")
                        setSavedCardResolveError("")
                      }}
                    />
                    <div>
                      <span className="text-sm font-medium">{"新しいカードを入力する"}</span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {
                          "この画面の下に表示される Stripe のフォームにカード番号等を入力してください。内容確認後に決済します。"
                        }
                      </p>
                    </div>
                  </label>

                  {creditFlowError ? <p className="text-xs text-destructive">{creditFlowError}</p> : null}
                </div>
              ) : null}
            </div>
          ) : null}
          </form>
        ) : null}

        {reviewStep && reviewData ? (
          <ReservationInputReviewSummary
            data={reviewData}
            displayPriceText={reviewDisplayPriceText}
            expectedTimeRange={reviewExpectedTimeRange}
          />
        ) : null}

        {showInlineStripe && stripeInitError ? (
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="text-sm text-destructive">{stripeInitError}</p>
          </div>
        ) : null}

        {showInlineStripe &&
        !skipCardPaymentInline &&
        !stripeClientSecret &&
        !stripeInitError &&
        resolvedMenu &&
        date &&
        time ? (
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="text-sm text-muted-foreground">決済フォームを準備しています…</p>
          </div>
        ) : null}

        {showInlineStripe && stripeClientSecret && stripePublishableKey ? (
          <div className="space-y-4 border-b border-slate-100 px-6 py-5">
            <div
              className={reviewStep && reviewData ? "space-y-4" : "hidden"}
              aria-hidden={!(reviewStep && reviewData)}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {"決済方法"}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {PAYMENT_METHODS.map((method) => {
                  const activeMethod = reviewStep && reviewData ? reviewData.paymentMethod : paymentMethod
                  const isActive = activeMethod === method.id
                  const Icon = method.icon
                  return (
                    <div
                      key={method.id}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : "border-slate-200 bg-white text-muted-foreground opacity-60"
                      }`}
                    >
                      <Icon className="size-4" />
                      {method.label}
                    </div>
                  )
                })}
              </div>
            </div>
            <UserReservationStripePayment
              key={stripeClientSecret}
              ref={stripePaymentRef}
              clientSecret={stripeClientSecret}
              publishableKey={stripePublishableKey}
              amountYen={stripeAmountYen}
              onReadyChange={setIsStripeReady}
            />
          </div>
        ) : null}

        <div className="flex gap-3 px-6 py-5">
          {!reviewStep ? (
            <>
              <Button type="button" variant="outline" size="lg" className="rounded-xl" onClick={handleBack}>
                {"前の画面へ戻る"}
              </Button>
              <Button
                type="submit"
                form="reservation-input-form"
                size="lg"
                className="flex-1 rounded-xl text-base"
                disabled={confirmButtonDisabled}
              >
                確認画面へ進む
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="rounded-xl"
                onClick={() => {
                  setReviewStep(false)
                  setFinalSubmitError("")
                }}
              >
                <ArrowLeft className="mr-1 size-4" />
                前の画面へ戻る
              </Button>
              <Button
                type="button"
                size="lg"
                className="flex-1 rounded-xl text-base"
                disabled={
                  isSubmittingFinal ||
                  (reviewData?.paymentMethod === "credit" &&
                    !skipCardPaymentInline &&
                    !isStripeReady)
                }
                onClick={() => {
                  void handleFinalSubmit()
                }}
              >
                {isSubmittingFinal ? "送信中..." : "予約を確定する"}
              </Button>
            </>
          )}
        </div>
        {finalSubmitError ? (
          <p className="px-6 pb-5 text-sm text-destructive">{finalSubmitError}</p>
        ) : null}
      </UserSectionCard>
    </section>
  )
}
