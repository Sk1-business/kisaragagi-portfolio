import { type FormEvent, useEffect, useState } from "react"
import { CheckCircle2, CreditCard, Pencil, Plus, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import {
  addPaymentCard,
  deletePaymentCard,
  fetchPaymentCards,
  type PaymentCard,
} from "@/features/user/api/userPaymentApi"
import { UserConfirmDialog } from "@/features/user/components/UserConfirmDialog"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import { formatCardNumber, formatExpiry, MAJOR_BRANDS, validateExpiry } from "@/lib/paymentCard"

export function UserPaymentPage() {
  const shopId = useShopId()
  const [cards, setCards] = useState<PaymentCard[]>([])
  const [isAdding, setIsAdding] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [newCardNumber, setNewCardNumber] = useState("")
  const [newCardBrand, setNewCardBrand] = useState<string>("Visa")
  const [newCardHolderName, setNewCardHolderName] = useState("")
  const [newCardExpiry, setNewCardExpiry] = useState("")
  const [newCardCvc, setNewCardCvc] = useState("")
  const [newCardError, setNewCardError] = useState("")
  const [newCardExpiryError, setNewCardExpiryError] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTargetCardId, setDeleteTargetCardId] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  const deleteTargetCard = cards.find((card) => card.id === deleteTargetCardId) ?? null

  useEffect(() => {
    let isMounted = true
    fetchPaymentCards()
      .then((result) => {
        if (!isMounted) return
        setCards(result)
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  async function handleDelete(cardId: string) {
    setDeleteTargetCardId(cardId)
    setDeleteError("")
    setShowDeleteDialog(true)
  }

  async function confirmDelete() {
    if (!deleteTargetCardId) return
    setIsDeleting(true)
    const result = await deletePaymentCard(deleteTargetCardId)
    if (!result.ok) {
      setDeleteError("カード情報の削除に失敗しました。")
      setIsDeleting(false)
      return
    }
    setCards((prev) => prev.filter((c) => c.id !== deleteTargetCardId))
    setShowDeleteDialog(false)
    setDeleteTargetCardId("")
    setIsDeleting(false)
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cardDigits = newCardNumber.replace(/\s/g, "")
    if (cardDigits.length !== 16) {
      setNewCardError("カード番号は16桁で入力してください。")
      return
    }
    if (newCardCvc.length < 3 || newCardCvc.length > 4) {
      setNewCardError("セキュリティコードは3〜4桁で入力してください。")
      return
    }
    const expiryError = validateExpiry(newCardExpiry)
    if (expiryError) {
      setNewCardExpiryError(expiryError)
      return
    }
    setNewCardError("")
    setNewCardExpiryError("")
    const addResult = await addPaymentCard({
      brand: newCardBrand,
      cardNumber: newCardNumber,
      expiry: newCardExpiry,
      cvc: newCardCvc,
      holderName: newCardHolderName,
    })
    if (!addResult.ok) {
      setNewCardError(addResult.error)
      return
    }
    setCards((prev) => [...prev, addResult.card])
    setNewCardBrand("Visa")
    setNewCardNumber("")
    setNewCardHolderName("")
    setNewCardExpiry("")
    setNewCardCvc("")
    setIsAdding(false)
    setSaveMessage("カードを追加しました")
    setTimeout(() => setSaveMessage(""), 2000)
  }

  return (
    <section className="space-y-5">
      <UserSectionCard
        title="決済情報管理"
        subtitle="登録済みのクレジットカード情報を確認・変更できます。"
      >
        <div className="space-y-3 p-5">
          {saveMessage ? (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" />
              {saveMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">カード情報を読み込み中です...</p>
            </div>
          ) : cards.length > 0 ? (
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
                    {`${card.brand} •••• ${card.cardNumber.replace(/\s/g, "").slice(-4)}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{`有効期限: ${card.expiry}`}</p>
                </div>
                <Button
                  asChild
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full"
                  aria-label={`${card.brand}カードを編集`}
                >
                  <Link
                    to={buildPathWithShopId(ROUTES.userMypagePaymentDetail, shopId)}
                    state={{ cardId: card.id }}
                  >
                    <Pencil className="size-4" />
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDelete(card.id)}
                  aria-label={`${card.brand}カードを削除`}
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
              {newCardError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {newCardError}
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="newCardBrand">ブランド</Label>
                  <select
                    id="newCardBrand"
                    name="newCardBrand"
                    value={newCardBrand}
                    onChange={(event) => setNewCardBrand(event.target.value)}
                    required
                    className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {MAJOR_BRANDS.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="newCardNumber">カード番号</Label>
                  <Input
                    id="newCardNumber"
                    name="newCardNumber"
                    value={newCardNumber}
                    onChange={(event) => {
                      setNewCardNumber(formatCardNumber(event.target.value))
                      setNewCardError("")
                    }}
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="newCardHolderName">カード名義</Label>
                  <Input
                    id="newCardHolderName"
                    name="newCardHolderName"
                    value={newCardHolderName}
                    onChange={(event) => setNewCardHolderName(event.target.value.toUpperCase())}
                    placeholder="TARO YAMADA"
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newCardExpiry">有効期限</Label>
                  <Input
                    id="newCardExpiry"
                    name="newCardExpiry"
                    value={newCardExpiry}
                    onChange={(event) => {
                      const formatted = formatExpiry(event.target.value)
                      setNewCardExpiry(formatted)
                      setNewCardError("")
                      if (formatted.length < 5) {
                        setNewCardExpiryError("")
                        return
                      }
                      setNewCardExpiryError(validateExpiry(formatted))
                    }}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/YY"
                    required
                    className="rounded-lg"
                  />
                  {newCardExpiryError ? <p className="text-xs text-destructive">{newCardExpiryError}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newCardCvc">セキュリティコード</Label>
                  <Input
                    id="newCardCvc"
                    name="newCardCvc"
                    value={newCardCvc}
                    onChange={(event) => {
                      setNewCardCvc(event.target.value.replace(/\D/g, "").slice(0, 4))
                      setNewCardError("")
                    }}
                    inputMode="numeric"
                    autoComplete="cc-csc"
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
      </UserSectionCard>

      <UserConfirmDialog
        open={showDeleteDialog}
        title="カード情報を削除しますか？"
        content={
          deleteTargetCard ? (
            <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{deleteTargetCard.brand}</p>
              <p className="text-xs text-muted-foreground">
                {`カード番号: •••• •••• •••• ${deleteTargetCard.cardNumber.replace(/\D/g, "").slice(-4)}`}
              </p>
            </div>
          ) : null
        }
        description={
          <>
            この操作は取り消せません。
            <br />
            本当に削除してもよろしいですか？
          </>
        }
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        confirmLabel="削除する"
        isConfirming={isDeleting}
        confirmDisabled={isDeleting}
        cancelDisabled={isDeleting}
        errorMessage={deleteError}
        variant="destructive"
      />

      <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
        <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>マイページへ戻る</Link>
      </Button>
    </section>
  )
}
