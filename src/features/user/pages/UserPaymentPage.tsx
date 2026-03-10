import { type FormEvent, useState } from "react"
import { CheckCircle2, CreditCard, Plus, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"

interface CardInfo {
  id: string
  last4: string
  expiry: string
  brand: string
}

const INITIAL_CARDS: CardInfo[] = [
  { id: "card-001", last4: "4242", expiry: "12/28", brand: "Visa" },
]

export function UserPaymentPage() {
  const shopId = useShopId()
  const [cards, setCards] = useState<CardInfo[]>(INITIAL_CARDS)
  const [isAdding, setIsAdding] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  function handleDelete(cardId: string) {
    setCards((prev) => prev.filter((c) => c.id !== cardId))
  }

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const cardNumber = String(formData.get("newCardNumber") ?? "")
    const expiry = String(formData.get("newCardExpiry") ?? "")
    const last4 = cardNumber.replace(/\s/g, "").slice(-4)
    const newCard: CardInfo = {
      id: `card-${Date.now()}`,
      last4,
      expiry,
      brand: "Visa",
    }
    setCards((prev) => [...prev, newCard])
    setIsAdding(false)
    setSaveMessage("カードを追加しました")
    setTimeout(() => setSaveMessage(""), 2000)
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white">
          <h2 className="font-bold">決済情報管理</h2>
          <p className="mt-0.5 text-xs text-slate-300">
            登録済みのクレジットカード情報を確認・変更できます。
          </p>
        </div>

        <div className="space-y-3 p-5">
          {saveMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" />
              {saveMessage}
            </div>
          ) : null}

          {cards.length > 0 ? (
            cards.map((card) => (
              <div
                key={card.id}
                className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-200">
                  <CreditCard className="size-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {`${card.brand} •••• ${card.last4}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{`有効期限: ${card.expiry}`}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDelete(card.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <CreditCard className="mx-auto mb-2 size-8 text-slate-300" />
              <p className="text-sm text-muted-foreground">登録済みのカードがありません。</p>
            </div>
          )}

          {isAdding ? (
            <form onSubmit={handleAdd} className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-foreground">新しいカードを追加</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="newCardNumber">カード番号</Label>
                  <Input
                    id="newCardNumber"
                    name="newCardNumber"
                    placeholder="0000 0000 0000 0000"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newCardExpiry">有効期限</Label>
                  <Input
                    id="newCardExpiry"
                    name="newCardExpiry"
                    placeholder="MM/YY"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newCardCvc">セキュリティコード</Label>
                  <Input
                    id="newCardCvc"
                    name="newCardCvc"
                    placeholder="123"
                    required
                    className="rounded-lg"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="rounded-lg">
                  追加する
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-lg"
                  onClick={() => setIsAdding(false)}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="size-4" />
              カードを追加
            </Button>
          )}
        </div>
      </div>

      <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
        <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>マイページへ戻る</Link>
      </Button>
    </section>
  )
}
