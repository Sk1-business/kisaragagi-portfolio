import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react"
import { ArrowRight, CheckCircle2, ChevronDown, Eye, EyeOff, X } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import mockUsers from "@/features/auth/api/mockUsers.json"
import { getLineLoginUrl } from "@/features/auth/api/customerAuthApi"
import { AuthBrandingPanel, AuthMobileBrandingHeader } from "@/features/auth/components/AuthBrandingPanel"
import { AUTH_AUDIENCE_TEXT, AUTH_TEXT } from "@/features/auth/constants"
import { useAuthNavigation } from "@/features/auth/hooks/useAuthNavigation"
import type { AuthFormCardProps, Gender, MockUser } from "@/features/auth/types/auth"
import { fetchSalonPage } from "@/features/user/api/userSalonApi"
import { persistShopSlug, resolveShopSlug } from "@/lib/shopSlug"
import {
  isCompletePhoneSegments,
  joinPhoneSegments,
  updatePhoneSegment,
  type PhoneSegments,
} from "@/lib/phone"
import type { AuthAudience, UserRole } from "@/types"

const SWITCH_PATH: Record<AuthAudience, { login: string; signup: string }> = {
  CUSTOMER_PORTAL: {
    login: ROUTES.customerSignup,
    signup: ROUTES.customerLogin,
  },
  BACKOFFICE_PORTAL: {
    login: ROUTES.backofficeSignup,
    signup: ROUTES.backofficeLogin,
  },
} as const

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "ADMIN", label: "管理者 (ADMIN)" },
  { value: "STAFF", label: "スタッフ (STAFF)" },
]

const VISIBLE_ROLES: Record<AuthAudience, UserRole[]> = {
  CUSTOMER_PORTAL: ["CUSTOMER"],
  BACKOFFICE_PORTAL: ["ADMIN", "STAFF"],
}
const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "not_specified", label: "回答しない" },
]

export function AuthFormCard({ audience, mode }: AuthFormCardProps) {
  const [searchParams] = useSearchParams()
  const text = AUTH_TEXT[mode]
  const audienceText = AUTH_AUDIENCE_TEXT[audience]
  const { submit } = useAuthNavigation(audience, mode)
  const isCustomerPortal = audience === "CUSTOMER_PORTAL"
  const [loginError, setLoginError] = useState("")
  const [shopSlug] = useState(
    () => resolveShopSlug(searchParams.get("shopId") ?? undefined) ?? "",
  )
  const [salonName, setSalonName] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [phoneSegments, setPhoneSegments] = useState<PhoneSegments>(["", "", ""])
  const [gender, setGender] = useState<Gender | "">("")
  const [birthDateInput, setBirthDateInput] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const isDev = import.meta.env.DEV
  const developmentUsers = (mockUsers as MockUser[]).filter((user) =>
    VISIBLE_ROLES[audience].includes(user.role),
  )

  useEffect(() => {
    if (!isCustomerPortal || !shopSlug) return
    fetchSalonPage(shopSlug)
      .then((salon: { salon_name: string }) => setSalonName(salon.salon_name))
      .catch(() => {})
  }, [isCustomerPortal, shopSlug])

  const sessionReason = searchParams.get("reason")
  const customerSessionNotice =
    isCustomerPortal && mode === "login" && sessionReason === "idle_timeout"
      ? "一定時間操作がなかったためログアウトしました。再度ログインしてください。"
      : isCustomerPortal && mode === "login" && sessionReason === "session_expired"
        ? "セッションの有効期限が切れたか、再ログインが必要です。"
        : isCustomerPortal && mode === "login" && sessionReason === "require_login"
          ? "ログインしてください。"
          : null

  function withShopId(path: string) {
    if (shopSlug) return `${path}?shopId=${encodeURIComponent(shopSlug)}`
    return path
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const passwordConfirm = String(formData.get("passwordConfirm") ?? "")
    const signupRole = isCustomerPortal
      ? "CUSTOMER"
      : (String(formData.get("role") ?? "ADMIN") as UserRole)

    const lastName = String(formData.get("lastName") ?? "")
    const firstName = String(formData.get("firstName") ?? "")
    const phone = joinPhoneSegments(phoneSegments)
    const name = lastName && firstName ? `${lastName} ${firstName}` : undefined
    const resolvedShopSlug = shopSlug.trim() || undefined

    const birthDate = birthDateInput.trim()

    if (mode === "signup" && password !== passwordConfirm) {
      setLoginError("パスワードが一致しません。")
      return
    }
    if (mode === "signup" && isCustomerPortal && !isCompletePhoneSegments(phoneSegments)) {
      setLoginError("電話番号は数字のみで3-4-4桁を入力してください。")
      return
    }
    if (mode === "signup" && isCustomerPortal && !gender) {
      setLoginError("性別を選択してください。")
      return
    }
    if (mode === "signup" && isCustomerPortal) {
      const bdError = validateBirthDate(birthDate)
      if (bdError) {
        setLoginError(bdError)
        return
      }
    }
    if (mode === "signup" && isCustomerPortal && !agreedToTerms) {
      setLoginError("利用規約に同意してください。")
      return
    }
    if (resolvedShopSlug) {
      persistShopSlug(resolvedShopSlug)
    }

    const result = await submit({
      email,
      password,
      signupRole,
      name,
      phone: phone || undefined,
      shopSlug: resolvedShopSlug,
      gender: gender || undefined,
      birthDate: birthDate ? birthDate.replace(/\//g, "-") : undefined,
    })

    if (result.ok) {
      setLoginError("")
      return
    }

    if (mode === "login") {
      if (
        audience === "BACKOFFICE_PORTAL" &&
        result.reason === "unauthorized"
      ) {
        setLoginError("メールまたはパスワードが間違っています。")
      } else {
        setLoginError(
          "ログインに失敗しました。メールアドレスまたはパスワードを確認してください。",
        )
      }
    }
  }

  return (
    <main
      className="flex min-h-dvh bg-white"
      style={{ fontFamily: "'SF Pro Text', 'SF Pro Display', 'Noto Sans JP', sans-serif" }}
    >
      <AuthBrandingPanel
        audienceTitle={audienceText.title}
        audienceDescription={audienceText.description}
      />

      {/* --- Right form panel --- */}
      <div className="flex flex-1 flex-col">
        <AuthMobileBrandingHeader />

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                {audienceText.title}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
                {text.title}
              </h2>
              {salonName ? (
                <p className="mt-1.5 text-sm font-medium text-neutral-700">{salonName}</p>
              ) : null}
              <p className="mt-1 text-sm text-neutral-500">{text.description}</p>
              {customerSessionNotice ? (
                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {customerSessionNotice}
                </p>
              ) : null}
            </div>

            {isCustomerPortal ? (
              <>
                <LineLoginButton shopSlug={shopSlug.trim() || undefined} onError={setLoginError} />
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-neutral-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-[11px] font-medium uppercase tracking-widest text-neutral-400">
                      または
                    </span>
                  </div>
                </div>
              </>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FieldGroup label="メールアドレス">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className="h-11 rounded-lg border-neutral-200 bg-neutral-50 text-sm transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                />
              </FieldGroup>

              <FieldGroup label="パスワード">
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="••••••••"
                    required
                    className="h-11 rounded-lg border-neutral-200 bg-neutral-50 pr-10 text-sm transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FieldGroup>

              {mode === "signup" ? (
                <FieldGroup label="パスワード（確認）">
                  <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    required
                    className="h-11 rounded-lg border-neutral-200 bg-neutral-50 text-sm transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                  />
                </FieldGroup>
              ) : null}

              {mode === "signup" && isCustomerPortal ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FieldGroup label="姓">
                      <Input
                        id="lastName"
                        name="lastName"
                        placeholder="山田"
                        required
                        className="h-11 rounded-lg border-neutral-200 bg-neutral-50 text-sm transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      />
                    </FieldGroup>
                    <FieldGroup label="名">
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="太郎"
                        required
                        className="h-11 rounded-lg border-neutral-200 bg-neutral-50 text-sm transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="電話番号">
                    <div className="flex items-center gap-2">
                      <Input
                        id="phone1"
                        type="tel"
                        inputMode="numeric"
                        value={phoneSegments[0]}
                        onChange={(event) => {
                          setPhoneSegments((prev: PhoneSegments) =>
                            updatePhoneSegment(prev, 0, event.target.value),
                          )
                          setLoginError("")
                        }}
                        placeholder="090"
                        required
                        className="h-11 min-w-0 flex-1 rounded-lg border-neutral-200 bg-neutral-50 text-center text-sm transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      />
                      <span className="text-neutral-400">-</span>
                      <Input
                        id="phone2"
                        type="tel"
                        inputMode="numeric"
                        value={phoneSegments[1]}
                        onChange={(event) => {
                          setPhoneSegments((prev: PhoneSegments) =>
                            updatePhoneSegment(prev, 1, event.target.value),
                          )
                          setLoginError("")
                        }}
                        placeholder="1234"
                        required
                        className="h-11 min-w-0 flex-1 rounded-lg border-neutral-200 bg-neutral-50 text-center text-sm transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      />
                      <span className="text-neutral-400">-</span>
                      <Input
                        id="phone3"
                        type="tel"
                        inputMode="numeric"
                        value={phoneSegments[2]}
                        onChange={(event) => {
                          setPhoneSegments((prev: PhoneSegments) =>
                            updatePhoneSegment(prev, 2, event.target.value),
                          )
                          setLoginError("")
                        }}
                        placeholder="5678"
                        required
                        className="h-11 min-w-0 flex-1 rounded-lg border-neutral-200 bg-neutral-50 text-center text-sm transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </FieldGroup>

                  <FieldGroup label="性別">
                    <div className="relative">
                      <select
                        id="gender"
                        name="gender"
                        value={gender}
                        onChange={(e) => {
                          setGender(e.target.value as Gender)
                          setLoginError("")
                        }}
                        required
                        className="h-11 w-full appearance-none rounded-lg border border-neutral-200 bg-neutral-50 px-3 pr-9 text-sm outline-none transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      >
                        <option value="" disabled>
                          選択してください
                        </option>
                        {GENDER_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
                    </div>
                  </FieldGroup>

                  <FieldGroup label="生年月日">
                    <BirthDateInput value={birthDateInput} onChange={(v) => { setBirthDateInput(v); setLoginError("") }} />
                  </FieldGroup>

                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      id="agreeTerms"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => {
                        setAgreedToTerms(e.target.checked)
                        setLoginError("")
                      }}
                      className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-neutral-300 accent-black"
                    />
                    <label htmlFor="agreeTerms" className="text-sm leading-snug text-neutral-600">
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="font-semibold text-black underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-black"
                      >
                        利用規約
                      </button>
                      に同意する
                    </label>
                  </div>
                </>
              ) : null}

              {mode === "signup" && !isCustomerPortal ? (
                <FieldGroup label="ロール">
                  <select
                    id="role"
                    name="role"
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm outline-none transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                    defaultValue="ADMIN"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </FieldGroup>
              ) : null}

              <Button
                type="submit"
                className="group h-11 w-full rounded-lg bg-black text-sm font-semibold text-white transition-all hover:bg-neutral-800"
              >
                {text.submitLabel}
                <ArrowRight className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5" />
              </Button>

              {loginError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                  <p className="whitespace-pre-line text-sm text-red-700">{loginError}</p>
                </div>
              ) : null}
            </form>

            {showTermsModal ? (
              <TermsOfServiceModal onClose={() => setShowTermsModal(false)} />
            ) : null}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-5">
              <div className="text-sm text-neutral-500">
                <span>{text.switchLabel}</span>
                <Link
                  to={
                    isCustomerPortal
                      ? withShopId(SWITCH_PATH[audience][mode])
                      : mode === "login"
                        ? ROUTES.backofficeSignup
                        : ROUTES.backofficeLogin
                  }
                  className="ml-1 font-semibold text-black underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-black"
                >
                  {text.switchLinkText}
                </Link>
              </div>
            </div>

            <div className="mt-4">
              <Link
                to={ROUTES.landing}
                className="text-sm text-neutral-500 underline decoration-neutral-300 underline-offset-4 transition-colors hover:text-neutral-800"
              >
                トップへ戻る
              </Link>
            </div>

            {isDev ? (
              <div className="mt-6 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-3 py-3">
                <p className="text-sm font-semibold text-neutral-800">開発用テストアカウント</p>
                <div className="mt-2 space-y-2">
                  {developmentUsers.map((user) => (
                    <div key={user.id} className="text-xs text-neutral-600">
                      <p>{`role: ${user.role}`}</p>
                      <p>{`email: ${user.email}`}</p>
                      <p>{`password: ${user.password_hash}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-neutral-700">{label}</Label>
      {children}
    </div>
  )
}

function TermsOfServiceModal({ onClose }: { onClose: () => void }) {
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
    >
      <div className="relative max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <h3 className="text-base font-bold text-neutral-900">利用規約</h3>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            aria-label="閉じる"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(80vh - 120px)" }}>
          <div className="space-y-4 text-sm leading-relaxed text-neutral-700">
            <p className="text-xs font-medium text-neutral-400">最終更新日: 2025年1月1日</p>

            <section>
              <h4 className="mb-1.5 font-bold text-neutral-900">第1条（適用）</h4>
              <p>
                本規約は、当サービス（以下「本サービス」）の利用に関する条件を定めるものです。
                登録ユーザーの皆さま（以下「ユーザー」）には、本規約に従って本サービスをご利用いただきます。
              </p>
            </section>

            <section>
              <h4 className="mb-1.5 font-bold text-neutral-900">第2条（利用登録）</h4>
              <p>
                登録希望者が本規約に同意の上、所定の方法によって利用登録を申請し、
                当社がこれを承認することによって利用登録が完了するものとします。
              </p>
            </section>

            <section>
              <h4 className="mb-1.5 font-bold text-neutral-900">第3条（ユーザーIDおよびパスワードの管理）</h4>
              <p>
                ユーザーは、自己の責任において本サービスのユーザーIDおよびパスワードを適切に管理するものとします。
                ユーザーIDおよびパスワードの管理不十分、使用上の過誤、第三者の使用等によって生じた損害に関する責任はユーザーが負うものとします。
              </p>
            </section>

            <section>
              <h4 className="mb-1.5 font-bold text-neutral-900">第4条（禁止事項）</h4>
              <p>ユーザーは、本サービスの利用にあたり以下の行為をしてはなりません。</p>
              <ul className="mt-1.5 list-inside list-disc space-y-1 pl-2 text-neutral-600">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当社のサーバーまたはネットワークの機能を破壊したり妨害したりする行為</li>
                <li>当社のサービスの運営を妨害するおそれのある行為</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
              </ul>
            </section>

            <section>
              <h4 className="mb-1.5 font-bold text-neutral-900">第5条（個人情報の取り扱い）</h4>
              <p>
                当社は、本サービスの利用によって取得する個人情報については、
                当社のプライバシーポリシーに従い適切に取り扱うものとします。
              </p>
            </section>

            <section>
              <h4 className="mb-1.5 font-bold text-neutral-900">第6条（免責事項）</h4>
              <p>
                当社は、本サービスに事実上または法律上の瑕疵がないことを明示的にも黙示的にも保証しておりません。
                当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。
              </p>
            </section>

            <p className="pt-2 text-xs text-neutral-400">※ 本利用規約はサンプルです。正式な規約は別途定めます。</p>
          </div>
        </div>
        <div className="border-t border-neutral-100 px-6 py-4">
          <Button
            type="button"
            onClick={onClose}
            className="h-10 w-full rounded-lg bg-black text-sm font-semibold text-white transition-all hover:bg-neutral-800"
          >
            閉じる
          </Button>
        </div>
      </div>
    </div>
  )
}

function LineLoginButton({ shopSlug, onError }: { shopSlug?: string; onError: (msg: string) => void }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await getLineLoginUrl(shopSlug)
    if (result.ok) {
      window.location.href = result.url
    } else {
      onError(result.error)
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleClick}
      className="group flex h-11 w-full items-center justify-center gap-2.5 rounded-lg bg-[#06C755] text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#05b34e] hover:shadow-md active:scale-[0.98] disabled:opacity-60"
    >
      <img src="/LINE_Brand_icon.png" alt="" className="size-5" />
      {loading ? "リダイレクト中…" : "LINEでログイン / 新規登録"}
    </button>
  )
}

function BirthDateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^\d]/g, "").slice(0, 8)

    let formatted = ""
    for (let i = 0; i < raw.length; i++) {
      formatted += raw[i]
      if ((i === 3 || i === 5) && i < raw.length - 1) formatted += "/"
    }
    if (raw.length === 4 || raw.length === 6) formatted += "/"
    onChange(formatted)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && value.endsWith("/")) {
      e.preventDefault()
      onChange(value.slice(0, -2))
    }
  }

  const filled = /^\d{4}\/\d{2}\/\d{2}$/.test(value)

  return (
    <div className="relative">
      <Input
        id="birthDate"
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        placeholder="1990/01/15"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        maxLength={10}
        required
        className={`h-11 rounded-lg border-neutral-200 bg-neutral-50 font-mono text-sm tracking-wider transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black ${
          filled ? "pr-9" : ""
        }`}
      />
      {filled ? (
        <CheckCircle2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-500" />
      ) : (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-neutral-400">
          YYYY/MM/DD
        </span>
      )}
    </div>
  )
}

function validateBirthDate(value: string): string | null {
  if (!value) return "生年月日を入力してください。"
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(value)) return "生年月日を YYYY/MM/DD の形式で入力してください。"

  const [y, m, d] = value.split("/").map(Number)
  const date = new Date(y, m - 1, d)

  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return "存在しない日付です。正しい生年月日を入力してください。"
  }
  if (date > new Date()) {
    return "未来の日付は指定できません。"
  }
  if (y < 1900) {
    return "1900年以降の日付を入力してください。"
  }
  return null
}
