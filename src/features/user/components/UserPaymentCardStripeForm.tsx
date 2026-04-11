import { forwardRef, useEffect, useImperativeHandle, useState } from "react"

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe, type Stripe } from "@stripe/stripe-js"

export type UserPaymentCardStripeFormHandle = {
  submit: () => Promise<string>
}

type InnerProps = {
  onReadyChange: (ready: boolean) => void
}

const StripeSetupInner = forwardRef<UserPaymentCardStripeFormHandle, InnerProps>(
  function StripeSetupInner({ onReadyChange }, ref) {
    const stripe = useStripe()
    const elements = useElements()

    useImperativeHandle(
      ref,
      () => ({
        async submit() {
          if (!stripe || !elements) {
            throw new Error("決済フォームの準備ができていません。")
          }
          const submitted = await elements.submit()
          if (submitted.error) {
            throw new Error(submitted.error.message ?? "カード情報を確認してください。")
          }
          const returnUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`
          const { error, setupIntent } = await stripe.confirmSetup({
            elements,
            redirect: "if_required",
            confirmParams: {
              return_url: returnUrl,
            },
          })
          if (error) {
            throw new Error(error.message ?? "カード登録に失敗しました。")
          }
          if (!setupIntent?.id) {
            throw new Error("カード登録が完了しませんでした。")
          }
          return setupIntent.id
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
  onReadyChange: (ready: boolean) => void
}

export const UserPaymentCardStripeForm = forwardRef<UserPaymentCardStripeFormHandle, Props>(
  function UserPaymentCardStripeForm({ clientSecret, publishableKey, onReadyChange }, ref) {
    const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)

    useEffect(() => {
      setStripePromise(loadStripe(publishableKey))
    }, [publishableKey])

    if (!stripePromise) return null

    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <StripeSetupInner ref={ref} onReadyChange={onReadyChange} />
      </Elements>
    )
  },
)
