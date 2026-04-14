import { forwardRef, useEffect, useImperativeHandle, useState } from "react"

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe } from "@stripe/stripe-js"

export type UserReservationStripePaymentHandle = {
  confirm: () => Promise<string>
}

type SavedPmProps = {
  stripePromise: Promise<Stripe | null>
  clientSecret: string
  savedPaymentMethodId: string
  amountYen: number
  onReadyChange: (ready: boolean) => void
}

const SavedPaymentMethodConfirm = forwardRef<UserReservationStripePaymentHandle, SavedPmProps>(
  function SavedPaymentMethodConfirm(
    { stripePromise, clientSecret, savedPaymentMethodId, amountYen, onReadyChange },
    ref,
  ) {
    useImperativeHandle(
      ref,
      () => ({
        async confirm() {
          const stripe = await stripePromise
          if (!stripe) {
            throw new Error("決済の準備ができていません。")
          }
          const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`
          const { error, paymentIntent } = await stripe.confirmPayment({
            clientSecret,
            confirmParams: {
              payment_method: savedPaymentMethodId,
              return_url: returnUrl,
            },
            redirect: "if_required",
          })
          if (error) {
            throw new Error(error.message ?? "決済に失敗しました。")
          }
          if (!paymentIntent?.id) {
            throw new Error("決済が完了しませんでした。")
          }
          return paymentIntent.id
        },
      }),
      [stripePromise, clientSecret, savedPaymentMethodId],
    )

    useEffect(() => {
      let active = true
      void stripePromise.then((stripe) => {
        if (active) onReadyChange(Boolean(stripe))
      })
      return () => {
        active = false
        onReadyChange(false)
      }
    }, [stripePromise, onReadyChange])

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">ご請求額: ¥{amountYen.toLocaleString()}</p>
        <p className="text-[11px] text-muted-foreground">
          登録済みカードでお支払いします。「予約を確定する」で決済を実行します。3D
          セキュアが求められる場合は画面の案内に従ってください。
        </p>
      </div>
    )
  },
)

type InnerProps = {
  onReadyChange: (ready: boolean) => void
}

const StripePaymentInner = forwardRef<UserReservationStripePaymentHandle, InnerProps>(
  function StripePaymentInner({ onReadyChange }, ref) {
    const stripe = useStripe()
    const elements = useElements()

    useImperativeHandle(
      ref,
      () => ({
        async confirm() {
          if (!stripe || !elements) {
            throw new Error("決済フォームの準備ができていません。")
          }
          const submit = await elements.submit()
          if (submit.error) {
            throw new Error(submit.error.message ?? "カード情報を確認してください。")
          }
          const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`
          const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required",
            confirmParams: {
              return_url: returnUrl,
            },
          })
          if (error) {
            throw new Error(error.message ?? "決済に失敗しました。")
          }
          if (!paymentIntent?.id) {
            throw new Error("決済が完了しませんでした。")
          }
          return paymentIntent.id
        },
      }),
      [stripe, elements],
    )

    useEffect(() => {
      onReadyChange(Boolean(stripe && elements))
    }, [stripe, elements, onReadyChange])

    return (
      <div className="space-y-3">
        <p className="text-[11px] text-muted-foreground">
          カード情報は Stripe のセキュアフォームで処理され、サーバーには保存されません。
        </p>
        <PaymentElement />
      </div>
    )
  },
)

type Props = {
  clientSecret: string
  publishableKey: string
  amountYen: number
  onReadyChange: (ready: boolean) => void
  /** 指定時は Payment Element を出さず、登録済み Stripe PM で確定する */
  savedPaymentMethodId?: string | null
}

export const UserReservationStripePayment = forwardRef<UserReservationStripePaymentHandle, Props>(
  function UserReservationStripePayment(
    { clientSecret, publishableKey, amountYen, onReadyChange, savedPaymentMethodId },
    ref,
  ) {
    const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
    const trimmedSavedPm = savedPaymentMethodId?.trim() || ""

    useEffect(() => {
      setStripePromise(loadStripe(publishableKey))
    }, [publishableKey])

    if (!stripePromise) return null

    if (trimmedSavedPm) {
      return (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
          <p className="text-xs font-semibold text-foreground">オンライン決済（クレジット）</p>
          <SavedPaymentMethodConfirm
            ref={ref}
            stripePromise={stripePromise}
            clientSecret={clientSecret}
            savedPaymentMethodId={trimmedSavedPm}
            amountYen={amountYen}
            onReadyChange={onReadyChange}
          />
        </div>
      )
    }

    return (
      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold text-foreground">オンライン決済（クレジット）</p>
        <p className="text-sm font-medium text-foreground">ご請求額: ¥{amountYen.toLocaleString()}</p>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentInner ref={ref} onReadyChange={onReadyChange} />
        </Elements>
      </div>
    )
  },
)
