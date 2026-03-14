import { type FormEvent, useEffect, useState } from "react"
import { CheckCircle2, CreditCard } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import {
  fetchPaymentCardById,
  updatePaymentCard,
  type PaymentCard,
} from "@/features/user/api/userPaymentApi"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"

export function UserPaymentDetailPage() {
  const shopId = useShopId()
  const [searchParams] = useSearchParams()
  const cardId = searchParams.get("cardId") ?? ""
  const [card, setCard] = useState<PaymentCard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [saveMessage, setSaveMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true
    fetchPaymentCardById(cardId)
      .then((result) => {
        if (!isMounted) return
        setCard(result)
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
    const formData = new FormData(event.currentTarget)
    const updatedCard: PaymentCard = {
      id: card.id,
      brand: String(formData.get("brand") ?? "Visa"),
      cardNumber: String(formData.get("cardNumber") ?? ""),
      expiry: String(formData.get("expiry") ?? ""),
      cvc: String(formData.get("cvc") ?? ""),
      holderName: String(formData.get("holderName") ?? ""),
    }
    const result = await updatePaymentCard(updatedCard)
    if (!result.ok) {
      setErrorMessage(result.error)
      return
    }
    setCard(result.card)
    setErrorMessage("")
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
      <div className="rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white">
          <h2 className="font-bold">カード詳細・編集</h2>
          <p className="mt-0.5 text-xs text-slate-300">登録済みカードの情報を確認・更新できます。</p>
        </div>

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
              <Input id="brand" name="brand" defaultValue={card.brand} required className="rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="holderName">カード名義</Label>
              <Input
                id="holderName"
                name="holderName"
                defaultValue={card.holderName}
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="cardNumber">カード番号</Label>
              <Input
                id="cardNumber"
                name="cardNumber"
                defaultValue={card.cardNumber}
                placeholder="0000 0000 0000 0000"
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiry">有効期限</Label>
              <Input
                id="expiry"
                name="expiry"
                defaultValue={card.expiry}
                placeholder="MM/YY"
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cvc">セキュリティコード</Label>
              <Input
                id="cvc"
                name="cvc"
                defaultValue={card.cvc}
                placeholder="123"
                required
                className="rounded-lg"
              />
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full rounded-xl">
            更新する
          </Button>
        </form>
      </div>

      <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
        <Link to={buildPathWithShopId(ROUTES.userMypagePayment, shopId)}>決済情報管理へ戻る</Link>
      </Button>
    </section>
  )
}
