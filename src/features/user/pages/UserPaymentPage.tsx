import { useEffect, useRef, useState } from "react"
import { CheckCircle2, CreditCard, Plus, Trash2 } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import {
  createCardSetupIntent,
  deletePaymentCard,
  describePaymentSetupFailure,
  fetchPaymentCards,
  finalizeCardSetup,
  type PaymentCard,
} from "@/features/user/api/userPaymentApi"
import { UserConfirmDialog } from "@/features/user/components/UserConfirmDialog"
import {
  UserPaymentCardStripeForm,
  type UserPaymentCardStripeFormHandle,
} from "@/features/user/components/UserPaymentCardStripeForm"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"

export function UserPaymentPage() {
  const shopId = useShopId()
  const [cards, setCards] = useState<PaymentCard[]>([])
  const [saveMessage, setSaveMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTargetCardId, setDeleteTargetCardId] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  const [showAddForm, setShowAddForm] = useState(false)
  const [addError, setAddError] = useState("")
  const [isPreparingSetup, setIsPreparingSetup] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [isStripeReady, setIsStripeReady] = useState(false)
  const [setupClientSecret, setSetupClientSecret] = useState("")
  const [setupPublishableKey, setSetupPublishableKey] = useState("")
  const stripeSetupRef = useRef<UserPaymentCardStripeFormHandle>(null)
  const setupRequestGenRef = useRef(0)

  const deleteTargetCard = cards.find((card) => card.id === deleteTargetCardId) ?? null

  useEffect(() => {
    let isMounted = true
    fetchPaymentCards(shopId)
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
  }, [shopId])

  async function handleDelete(cardId: string) {
    setDeleteTargetCardId(cardId)
    setDeleteError("")
    setShowDeleteDialog(true)
  }

  async function confirmDelete() {
    if (!deleteTargetCardId) return
    setIsDeleting(true)
    const result = await deletePaymentCard(deleteTargetCardId, shopId)
    if (!result.ok) {
      setDeleteError("カードの削除に失敗しました。")
      setIsDeleting(false)
      return
    }
    setCards((prev) => prev.filter((c) => c.id !== deleteTargetCardId))
    setShowDeleteDialog(false)
    setDeleteTargetCardId("")
    setIsDeleting(false)
  }

  function closeAddForm() {
    setupRequestGenRef.current += 1
    setShowAddForm(false)
    setAddError("")
    setSetupClientSecret("")
    setSetupPublishableKey("")
    setIsStripeReady(false)
    setIsPreparingSetup(false)
  }

  async function openAddForm() {
    const gen = ++setupRequestGenRef.current
    setAddError("")
    setSetupClientSecret("")
    setSetupPublishableKey("")
    setIsStripeReady(false)
    setShowAddForm(true)
    setIsPreparingSetup(true)
    try {
      const setup = await createCardSetupIntent(shopId)
      if (gen !== setupRequestGenRef.current) return
      setSetupClientSecret(setup.clientSecret)
      setSetupPublishableKey(setup.publishableKey)
    } catch (error: unknown) {
      if (gen !== setupRequestGenRef.current) return
      setAddError(describePaymentSetupFailure(error))
    } finally {
      if (gen === setupRequestGenRef.current) {
        setIsPreparingSetup(false)
      }
    }
  }

  async function handleAddCard() {
    if (!stripeSetupRef.current) {
      setAddError("カードフォームの準備ができていません。")
      return
    }
    setIsAdding(true)
    setAddError("")
    try {
      const setupIntentId = await stripeSetupRef.current.submit()
      const result = await finalizeCardSetup(setupIntentId, undefined, shopId)
      if (!result.ok) {
        setAddError(result.error)
        setIsAdding(false)
        return
      }
      setCards((prev) => [result.card, ...prev.filter((card) => card.id !== result.card.id)])
      closeAddForm()
      setSaveMessage("カードを登録しました")
      setTimeout(() => setSaveMessage(""), 2000)
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "カード登録に失敗しました。"
      setAddError(message)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <section className="space-y-5">
      <UserSectionCard title="決済情報管理" subtitle="保存済みカードの追加・削除を行えます。">
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
                    {`${card.brand} ${card.maskedNumber}`}
                  </p>
                  <p className="text-xs text-muted-foreground">{`有効期限: ${card.expiry}`}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="ml-auto rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => handleDelete(card.id)}
                  aria-label="カードを削除"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <CreditCard className="mx-auto mb-2 size-8 text-slate-300" />
              <p className="text-sm text-muted-foreground">保存済みのカードがありません。</p>
            </div>
          )}

          {showAddForm ? (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-foreground">新しいカードを追加</p>
              {addError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                  {addError}
                </div>
              ) : null}
              {isPreparingSetup ? (
                <p className="text-sm text-muted-foreground">登録フォームを準備しています...</p>
              ) : setupClientSecret && setupPublishableKey ? (
                <UserPaymentCardStripeForm
                  ref={stripeSetupRef}
                  clientSecret={setupClientSecret}
                  publishableKey={setupPublishableKey}
                  onReadyChange={setIsStripeReady}
                />
              ) : addError ? (
                <p className="text-sm text-muted-foreground">
                  上記をご確認のうえ、必要なら「キャンセル」後に再度「カードを追加」してください。
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {setupClientSecret && setupPublishableKey ? (
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => {
                      void handleAddCard()
                    }}
                    disabled={isAdding || !isStripeReady || isPreparingSetup}
                  >
                    {isAdding ? "登録中..." : "登録する"}
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-lg"
                  onClick={closeAddForm}
                  disabled={isAdding}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => {
                void openAddForm()
              }}
              disabled={isPreparingSetup}
            >
              <Plus className="size-4" />
              カードを追加
            </Button>
          )}
        </div>
      </UserSectionCard>

      <UserConfirmDialog
        open={showDeleteDialog}
        title="カードを削除しますか？"
        content={
          deleteTargetCard ? (
            <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">{deleteTargetCard.brand}</p>
              <p className="text-xs text-muted-foreground">{deleteTargetCard.maskedNumber}</p>
            </div>
          ) : null
        }
        description={<>この操作は取り消せません。</>}
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
