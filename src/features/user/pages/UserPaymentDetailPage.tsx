import { type FormEvent, useEffect, useState } from "react"
import { CheckCircle2, CreditCard } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import {
  fetchPaymentCardById,
  updatePaymentCard,
  type PaymentCard,
} from "@/features/user/api/userPaymentApi"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import { formatCardNumber, formatExpiry, MAJOR_BRANDS, validateExpiry } from "@/lib/paymentCard"

function splitHolderName(holderName: string) {
  const trimmed = holderName.trim()
  if (!trimmed) {
    return { firstName: "", lastName: "" }
  }
  const parts = trimmed.split(/\s+/)
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  }
}

export function UserPaymentDetailPage() {
  const shopId = useShopId()
  const location = useLocation()
  const cardIdFromState = (location.state as { cardId?: string } | null)?.cardId ?? ""
  const cardId = cardIdFromState
  const [card, setCard] = useState<PaymentCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [brand, setBrand] = useState<string>("Visa")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [cardNumber, setCardNumber] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [cardNumberError, setCardNumberError] = useState("")
  const [expiryError, setExpiryError] = useState("")
  const [cvcError, setCvcError] = useState("")

  useEffect(() => {
    let isMounted = true
    fetchPaymentCardById(cardId)
      .then((result) => {
        if (!isMounted) return
        setCard(result)
        if (!result) return
        const splitName = splitHolderName(result.holderName)
        setBrand(result.brand || "Visa")
        setFirstName(splitName.firstName)
        setLastName(splitName.lastName)
        setCardNumber(formatCardNumber(result.cardNumber))
        setExpiry(formatExpiry(result.expiry))
        setCvc(result.cvc)
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [cardId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!card) return
    const cardDigits = cardNumber.replace(/\s/g, "")
    if (cardDigits.length !== 16) {
      setCardNumberError("カード番号は16桁で入力してください。")
      return
    }
    const holderName = `${firstName.trim()} ${lastName.trim()}`.trim()
    const nextExpiryError = validateExpiry(expiry)
    if (nextExpiryError) {
      setExpiryError(nextExpiryError)
      return
    }
    if (cvc.length < 3 || cvc.length > 4) {
      setCvcError("セキュリティコードは3〜4桁で入力してください。")
      return
    }

    const updatedCard: PaymentCard = {
      id: card.id,
      brand,
      cardNumber,
      expiry,
      cvc,
      holderName,
    }
    const result = await updatePaymentCard(updatedCard)
    if (!result.ok) {
      setErrorMessage(result.error)
      return
    }
    setCard(result.card)
    setErrorMessage("")
    setCardNumberError("")
    setExpiryError("")
    setCvcError("")
    setSaveMessage("カード情報を更新しました")
    setTimeout(() => setSaveMessage(""), 2000)
  }

  if (isLoading) {
    return (
      <section className="py-16 text-center">
        <p className="text-sm text-muted-foreground">カード情報を読み込み中です...</p>
      </section>
    )
  }

  if (!card) {
    return (
      <section className="py-16 text-center">
        <p className="text-sm text-muted-foreground">カード情報が見つかりませんでした。</p>
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
          <Link to={buildPathWithShopId(ROUTES.userMypagePayment, shopId)}>決済情報管理へ戻る</Link>
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <UserSectionCard title="カード詳細・編集" subtitle="登録済みカードの情報を確認・更新できます。">

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {saveMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" />
              {saveMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-200">
              <CreditCard className="size-5 text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{`${card.brand} •••• ${card.cardNumber.replace(/\s/g, "").slice(-4)}`}</p>
              <p className="text-xs text-muted-foreground">{`有効期限: ${card.expiry}`}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand">ブランド</Label>
              <select
                id="brand"
                name="brand"
                value={brand}
                onChange={(event) => setBrand(event.target.value)}
                required
                className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {MAJOR_BRANDS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>カード名義</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="holderFirstName"
                  name="holderFirstName"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value.toUpperCase())}
                  placeholder="TARO"
                  required
                  className="rounded-lg"
                />
                <Input
                  id="holderLastName"
                  name="holderLastName"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value.toUpperCase())}
                  placeholder="YAMADA"
                  required
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cardNumber">カード番号</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                value={cardNumber}
                onChange={(event) => {
                  setCardNumber(formatCardNumber(event.target.value))
                  setCardNumberError("")
                }}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                required
                className="rounded-lg"
              />
              {cardNumberError ? <p className="text-xs text-destructive">{cardNumberError}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry">有効期限</Label>
              <Input
                id="expiry"
                name="expiry"
                value={expiry}
                onChange={(event) => {
                  const formatted = formatExpiry(event.target.value)
                  setExpiry(formatted)
                  if (formatted.length < 5) {
                    setExpiryError("")
                    return
                  }
                  setExpiryError(validateExpiry(formatted))
                }}
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder="MM/YY"
                required
                className="rounded-lg"
              />
              {expiryError ? <p className="text-xs text-destructive">{expiryError}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cvc">セキュリティコード</Label>
              <Input
                id="cvc"
                name="cvc"
                value={cvc}
                onChange={(event) => {
                  setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))
                  setCvcError("")
                }}
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                required
                className="rounded-lg"
              />
              {cvcError ? <p className="text-xs text-destructive">{cvcError}</p> : null}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full rounded-xl">
            更新する
          </Button>
        </form>
      </UserSectionCard>

      <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
        <Link to={buildPathWithShopId(ROUTES.userMypagePayment, shopId)}>決済情報管理へ戻る</Link>
      </Button>
    </section>
  )
}
