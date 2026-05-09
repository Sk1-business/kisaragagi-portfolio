import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Clock, MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import {
  buildSignupVerificationUrl,
  clearSignupVerification,
  peekSignupVerification,
  SIGNUP_VERIFICATION_TTL_MS,
} from "@/features/auth/lib/signupVerification"

type LocationState = {
  email?: string
  token?: string
  expiresAt?: number
  link?: string
} | null

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0:00"
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function BackofficeSignupVerifySentPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navState = (location.state as LocationState) ?? null

  // location.state が無い（直接アクセス・リロード）場合は localStorage から復元
  const fallback = useMemo(() => peekSignupVerification(), [])
  const email = navState?.email ?? fallback?.email ?? ""
  const token = navState?.token ?? fallback?.token ?? ""
  const expiresAt =
    navState?.expiresAt ??
    fallback?.expiresAt ??
    (fallback ? fallback.issuedAt + SIGNUP_VERIFICATION_TTL_MS : 0)
  const link = navState?.link ?? (token ? buildSignupVerificationUrl(token) : "")
  const isDev = import.meta.env.DEV

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!expiresAt) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [expiresAt])

  const remainingMs = expiresAt ? Math.max(0, expiresAt - now) : 0
  const expired = expiresAt > 0 && remainingMs <= 0

  // 期限切れ後はストレージのトークンを掃除
  useEffect(() => {
    if (expired) clearSignupVerification()
  }, [expired])

  // セッションが何も無い（直接アクセス）の場合はメール入力画面に戻す
  useEffect(() => {
    if (!email && !token) {
      navigate(ROUTES.backofficeSignup, { replace: true })
    }
  }, [email, token, navigate])

  function handleStartOver() {
    clearSignupVerification()
    navigate(ROUTES.backofficeSignup, { replace: true })
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // 失敗時は黙る（ユーザーは手動で選択コピーできる）
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-10 sm:px-6">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
          管理者・スタッフ用
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight">認証メールを送信しました</h1>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <MailCheck className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-neutral-700">
              <span className="font-semibold text-neutral-900">{email || "（メールアドレス未取得）"}</span>{" "}
              宛に認証用リンクを送信しました。受信したメールに記載されたリンクをクリックして、認証を完了してください。
            </p>
            <p className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
              <Clock className="size-3.5" />
              リンクは <span className="font-semibold text-neutral-700">5 分間</span> 有効、
              かつ <span className="font-semibold text-neutral-700">1 回限り</span> 使用できます。
            </p>
          </div>
        </div>

        <div
          className={
            "mt-5 rounded-lg border px-4 py-3 text-sm " +
            (expired
              ? "border-red-200 bg-red-50 text-red-700"
              : remainingMs <= 60_000
                ? "border-amber-200 bg-amber-50 text-amber-800"
                : "border-neutral-200 bg-neutral-50 text-neutral-700")
          }
          role="status"
          aria-live="polite"
        >
          {expired ? (
            <div className="space-y-2">
              <p className="font-semibold">リンクの有効期限が切れました。</p>
              <p>新しい認証メールを送信するには、もう一度メールアドレスから入力してください。</p>
            </div>
          ) : (
            <p>
              残り時間: <span className="font-mono text-base font-semibold">{formatRemaining(remainingMs)}</span>
            </p>
          )}
        </div>

        {isDev && link && !expired ? (
          <div className="mt-5 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
            <p className="mb-1 font-semibold text-neutral-700">
              [開発モード] 実環境ではメールが届きます。下記リンクをクリックして認証を進めてください:
            </p>
            <div className="flex items-center gap-2">
              <a
                href={link}
                className="break-all font-mono text-xs text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
              >
                {link}
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void handleCopy()}
                className="shrink-0"
              >
                コピー
              </Button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleStartOver}>
            別のメールアドレスでやり直す
          </Button>
        </div>
      </div>
    </main>
  )
}
