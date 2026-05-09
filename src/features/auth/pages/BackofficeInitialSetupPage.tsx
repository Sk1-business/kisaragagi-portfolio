import { useEffect, useState, type FormEvent, type ReactNode } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import { postAdminLogout } from "@/features/auth/api/adminLoginApi"
import { clearSignupVerification } from "@/features/auth/lib/signupVerification"

type InitialSetupDraft = {
  email: string
  address: string
  phone: string
  salonName: string
  publicSlug: string
  salonMessage: string
  salonDescription: string
  cancelPolicy: string
  instagramUrl: string
  lineOfficialUrl: string
  websiteUrl: string
  brandColor: string
}

const STORAGE_KEY = "backoffice_initial_setup_draft_v1"

function validateOptionalUrl(value: string, label: string): string | null {
  const v = value.trim()
  if (!v) return null
  if (v.length > 500) return `${label}は500文字以内で入力してください。`
  try {
    const parsed = new URL(v)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return `${label}は http:// または https:// で始まるURLを入力してください。`
    }
  } catch {
    return `${label}は有効なURL形式で入力してください。`
  }
  return null
}

function toInitialSetupDraft(form: FormData, email: string): InitialSetupDraft {
  return {
    email,
    address: String(form.get("address") ?? "").trim(),
    phone: String(form.get("phone") ?? "").trim(),
    salonName: String(form.get("salonName") ?? "").trim(),
    publicSlug: String(form.get("publicSlug") ?? "")
      .trim()
      .toLowerCase(),
    salonMessage: String(form.get("salonMessage") ?? "").trim(),
    salonDescription: String(form.get("salonDescription") ?? "").trim(),
    cancelPolicy: String(form.get("cancelPolicy") ?? "").trim(),
    instagramUrl: String(form.get("instagramUrl") ?? "").trim(),
    lineOfficialUrl: String(form.get("lineOfficialUrl") ?? "").trim(),
    websiteUrl: String(form.get("websiteUrl") ?? "").trim(),
    brandColor: String(form.get("brandColor") ?? "#111827").trim() || "#111827",
  }
}

export function BackofficeInitialSetupPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const navState = location.state as
    | { fromSignup?: boolean; email?: string }
    | null
  const fromSignup = Boolean(navState?.fromSignup)
  const email = typeof navState?.email === "string" ? navState.email : ""

  // 直接アクセス（state 無し）の場合は新規登録画面に戻す
  useEffect(() => {
    if (!fromSignup && !email) {
      navigate(ROUTES.backofficeSignup, { replace: true })
    }
  }, [fromSignup, email, navigate])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const draft = toInitialSetupDraft(form, email)

    if (!draft.address) {
      setError("住所は必須です。")
      return
    }
    if (draft.address.length > 500) {
      setError("住所は500文字以内で入力してください。")
      return
    }
    if (!draft.phone) {
      setError("電話番号は必須です。")
      return
    }
    if (!/^\d{1,20}$/.test(draft.phone)) {
      setError("電話番号は20桁以下の数字のみで入力してください。")
      return
    }
    if (!draft.salonName) {
      setError("サロン名は必須です。")
      return
    }
    if (draft.salonName.length > 200) {
      setError("サロン名は200文字以内で入力してください。")
      return
    }
    if (!draft.publicSlug) {
      setError("公開URL用スラッグは必須です。")
      return
    }
    if (draft.publicSlug.length > 100) {
      setError("公開URL用スラッグは100文字以内で入力してください。")
      return
    }
    if (!/^[a-z0-9-]+$/.test(draft.publicSlug)) {
      setError("公開URL用スラッグは小文字英数字とハイフンのみ使用できます。")
      return
    }
    const igErr = validateOptionalUrl(draft.instagramUrl, "Instagram URL")
    if (igErr) {
      setError(igErr)
      return
    }
    const lineErr = validateOptionalUrl(draft.lineOfficialUrl, "LINE公式アカウントURL")
    if (lineErr) {
      setError(lineErr)
      return
    }
    const webErr = validateOptionalUrl(draft.websiteUrl, "WebサイトURL")
    if (webErr) {
      setError(webErr)
      return
    }

    setError("")
    setSaving(true)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
      navigate(ROUTES.adminHome, { replace: true })
    } finally {
      setSaving(false)
    }
  }

  async function handleConfirmCancel() {
    setShowCancelConfirm(false)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    clearSignupVerification()
    await postAdminLogout()
    navigate(ROUTES.backofficeLogin, { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">初期設定</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          サロン情報を入力してください。住所・電話番号・サロン名・公開URL用スラッグは必須です。
        </p>
        {fromSignup ? (
          <div
            role="status"
            className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            メール認証が完了しました。引き続き初期設定を行ってください。
            {email ? (
              <div className="mt-1 text-xs text-emerald-700">
                認証済みメールアドレス: <span className="font-mono">{email}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="住所※1" htmlFor="initial-address">
          <textarea
            id="initial-address"
            name="address"
            required
            maxLength={500}
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>

        <Field label="電話番号※1" htmlFor="initial-phone">
          <Input
            id="initial-phone"
            name="phone"
            required
            inputMode="numeric"
            pattern="[0-9]{1,20}"
            maxLength={20}
            placeholder="0312345678"
          />
        </Field>

        <Field label="サロン名※2" htmlFor="initial-salon-name">
          <Input id="initial-salon-name" name="salonName" required maxLength={200} />
        </Field>

        <Field label="公開URL用スラッグ" htmlFor="initial-public-slug">
          <div className="space-y-1">
            <Input
              id="initial-public-slug"
              name="publicSlug"
              required
              maxLength={100}
              pattern="[a-z0-9-]+"
              placeholder="sample-salon-2026"
            />
            <p className="text-xs text-muted-foreground">
              公開URL: <code>/s/{"{slug}"}</code> / 使用可能文字: 小文字英数字・ハイフン
            </p>
          </div>
        </Field>

        <Field
          label="サロンメッセージ（予約ページ上部に表示する）"
          htmlFor="initial-message"
        >
          <textarea
            id="initial-message"
            name="salonMessage"
            className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>

        <Field label="サロン紹介文" htmlFor="initial-description">
          <textarea
            id="initial-description"
            name="salonDescription"
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>

        <Field label="キャンセルポリシー文" htmlFor="initial-cancel-policy">
          <textarea
            id="initial-cancel-policy"
            name="cancelPolicy"
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Field>

        <Field label="Instagram URL" htmlFor="initial-instagram-url">
          <Input id="initial-instagram-url" name="instagramUrl" maxLength={500} />
        </Field>

        <Field label="LINE公式アカウントURL" htmlFor="initial-line-url">
          <Input id="initial-line-url" name="lineOfficialUrl" maxLength={500} />
        </Field>

        <Field label="WebサイトURL" htmlFor="initial-website-url">
          <Input id="initial-website-url" name="websiteUrl" maxLength={500} />
        </Field>

        <Field label="ブランドカラー" htmlFor="initial-brand-color">
          <input
            id="initial-brand-color"
            name="brandColor"
            type="color"
            defaultValue="#111827"
            className="size-10 cursor-pointer rounded border border-input bg-background"
          />
        </Field>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => setShowCancelConfirm(true)}
          >
            戻る
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "保存中..." : "初期設定を保存"}
          </Button>
        </div>
      </form>

      {showCancelConfirm ? (
        <InitialSetupCancelConfirmModal
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={() => void handleConfirmCancel()}
        />
      ) : null}
    </main>
  )
}

function InitialSetupCancelConfirmModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void
  onConfirm: () => void
}) {
  useEffect(() => {
    function handleKeyDown(e: Event) {
      if (e instanceof KeyboardEvent && e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="initial-setup-cancel-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-6 shadow-2xl">
        <h3
          id="initial-setup-cancel-title"
          className="text-base font-bold text-neutral-900"
        >
          確認
        </h3>
        <p className="mt-2 text-sm text-neutral-700">
          新規登録と初期設定を取り消し、ログイン画面に戻りますか？この画面で入力した内容は保存されません。
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="button" onClick={onConfirm}>
            はい、ログイン画面へ
          </Button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
