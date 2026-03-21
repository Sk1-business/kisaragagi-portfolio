import { useEffect, useState, type FormEvent } from "react"
import { ArrowRight, CheckCircle2, Dumbbell, Eye, EyeOff } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import { getLineLoginUrl } from "@/features/auth/api/customerAuthApi"
import mockUsers from "@/features/auth/api/mockUsers.json"
import { AUTH_AUDIENCE_ALLOWED_ROLES, AUTH_AUDIENCE_TEXT, AUTH_TEXT } from "@/features/auth/constants"
import { useAuthNavigation, type RegisteredInfo } from "@/features/auth/hooks/useAuthNavigation"
import type { AuthFormCardProps, MockUser } from "@/features/auth/types/auth"
import { API_BASE } from "@/lib/apiBase"
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

export function AuthFormCard({ audience, mode }: AuthFormCardProps) {
  const [searchParams] = useSearchParams()
  const text = AUTH_TEXT[mode]
  const audienceText = AUTH_AUDIENCE_TEXT[audience]
  const { submit } = useAuthNavigation(audience, mode)
  const isCustomerPortal = audience === "CUSTOMER_PORTAL"
  const [shopSlugInput, setShopSlugInput] = useState(
    () => resolveShopSlug(searchParams.get("shopId") ?? undefined) ?? "",
  )
  const [loginError, setLoginError] = useState("")
  const [registeredInfo, setRegisteredInfo] = useState<RegisteredInfo | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [phoneSegments, setPhoneSegments] = useState<PhoneSegments>(["", "", ""])
  const isDev = import.meta.env.DEV
  const developmentUsers = (mockUsers as MockUser[]).filter((user) =>
    AUTH_AUDIENCE_ALLOWED_ROLES[audience].includes(user.role),
  )

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
    return path
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "").trim().toLowerCase()
    const password = String(formData.get("password") ?? "")
    const signupRole = isCustomerPortal
      ? "CUSTOMER"
      : (String(formData.get("role") ?? "ADMIN") as UserRole)

    const lastName = String(formData.get("lastName") ?? "")
    const firstName = String(formData.get("firstName") ?? "")
    const phone = joinPhoneSegments(phoneSegments)
    const name = lastName && firstName ? `${lastName} ${firstName}` : undefined
    const shopSlug = shopSlugInput.trim() || undefined

    if (mode === "signup" && isCustomerPortal && !isCompletePhoneSegments(phoneSegments)) {
      setLoginError("電話番号は数字のみで3-4-4桁を入力してください。")
      return
    }
    if (isCustomerPortal && !shopSlug) {
      setLoginError("店舗情報を入力してください。")
      return
    }
    if (shopSlug) {
      persistShopSlug(shopSlug)
    }

    const result = await submit({
      email,
      password,
      signupRole,
      name,
      phone: phone || undefined,
      shopSlug,
    })

    if (result.ok) {
      setLoginError("")
      if (result.registered) {
        setRegisteredInfo(result.registered)
      }
      return
    }

    if (result.error) {
      setLoginError(result.error)
    } else if (mode === "login") {
      setLoginError("ログインに失敗しました。メールアドレスまたはパスワードを確認してください。")
    }
  }

  if (registeredInfo) {
    return <RegistrationSuccess info={registeredInfo} />
  }

  return (
    <main
      className="flex min-h-dvh bg-white"
      style={{ fontFamily: "'SF Pro Text', 'SF Pro Display', 'Noto Sans JP', sans-serif" }}
    >
      {/* --- Left branding panel --- */}
      <div className="relative hidden w-[45%] overflow-hidden bg-black lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='4' height='4' viewBox='0 0 4 4' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 3h1v1H1V3zm2-2h1v1H3V1z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10 px-12 pt-12">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg border border-white/20">
              <Dumbbell className="size-5 text-white" />
            </div>
            <span className="text-sm font-medium tracking-widest text-white/60">予約ポータル</span>
          </div>
        </div>

        <div className="relative z-10 px-12 pb-20">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/40">
            {audienceText.title}
          </p>
          <h1
            className="mt-4 text-5xl font-bold leading-[1.1] tracking-tight text-white"
          >
            快適な予約体験を
            <br />
            <span className="text-white/50">あなたに</span>
          </h1>
          <div className="mt-8 h-px w-16 bg-white/20" />
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/40">
            {audienceText.description}
          </p>
        </div>

        <div className="absolute -bottom-32 -right-32 size-64 rounded-full border border-white/[0.04]" />
        <div className="absolute -bottom-20 -right-20 size-40 rounded-full border border-white/[0.06]" />
      </div>

      {/* --- Right form panel --- */}
      <div className="flex flex-1 flex-col">
        {/* Mobile header */}
        <div className="flex items-center gap-3 border-b border-neutral-100 px-6 py-4 lg:hidden">
          <div className="flex size-8 items-center justify-center rounded-lg bg-black">
            <Dumbbell className="size-4 text-white" />
          </div>
          <span className="text-xs font-medium tracking-widest text-neutral-400">予約ポータル</span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-[400px]">
            <div className="mb-8">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
                {audienceText.title}
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">
                {text.title}
              </h2>
              <p className="mt-1 text-sm text-neutral-500">{text.description}</p>
            </div>

            {customerSessionNotice ? (
              <div
                role="status"
                className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
              >
                {customerSessionNotice}
              </div>
            ) : null}

            {isCustomerPortal ? (
              <>
                <LineLoginButton shopSlug={shopSlugInput.trim() || undefined} onError={setLoginError} />
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
              {isCustomerPortal ? (
                <FieldGroup label="店舗情報">
                  <Input
                    id="shopSlug"
                    name="shopSlug"
                    autoComplete="off"
                    placeholder="店舗情報を入力"
                    value={shopSlugInput}
                    onChange={(event) => {
                      setShopSlugInput(event.target.value)
                      setLoginError("")
                    }}
                    required
                    className="h-11 rounded-lg border-neutral-200 bg-neutral-50 text-sm transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                  />
                </FieldGroup>
              ) : null}
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
                          setPhoneSegments((prev) => updatePhoneSegment(prev, 0, event.target.value))
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
                          setPhoneSegments((prev) => updatePhoneSegment(prev, 1, event.target.value))
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
                          setPhoneSegments((prev) => updatePhoneSegment(prev, 2, event.target.value))
                          setLoginError("")
                        }}
                        placeholder="5678"
                        required
                        className="h-11 min-w-0 flex-1 rounded-lg border-neutral-200 bg-neutral-50 text-center text-sm transition-colors focus:border-black focus:bg-white focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </FieldGroup>
                </>
              ) : null}

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

            <div className="mt-6 flex items-center justify-between border-t border-neutral-100 pt-5">
              <div className="text-sm text-neutral-500">
                <span>{text.switchLabel}</span>
                <Link
                  to={withShopId(SWITCH_PATH[audience][mode])}
                  className="ml-1 font-semibold text-black underline decoration-neutral-300 underline-offset-4 transition-colors hover:decoration-black"
                >
                  {text.switchLinkText}
                </Link>
              </div>
            </div>

            <Link
              to={withShopId(ROUTES.landing)}
              className="mt-3 inline-block text-xs text-neutral-400 underline decoration-neutral-200 underline-offset-4 transition-colors hover:text-neutral-600 hover:decoration-neutral-400"
            >
              トップへ戻る
            </Link>

            {isDev && mode === "signup" && isCustomerPortal ? <HealthCheck /> : null}

            {isDev ? (
              <details className="mt-8 rounded-lg border border-dashed border-neutral-200 text-xs">
                <summary className="cursor-pointer px-4 py-2.5 font-medium text-neutral-500 transition-colors hover:text-neutral-700">
                  開発用テストアカウント
                </summary>
                <div className="space-y-2 border-t border-dashed border-neutral-200 px-4 py-3">
                  {developmentUsers.map((user) => (
                    <div key={user.id} className="font-mono text-neutral-400">
                      <p>{`role: ${user.role}`}</p>
                      <p>{`email: ${user.email}`}</p>
                      <p>{`pass:  ${user.password_hash}`}</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
        {label}
      </Label>
      {children}
    </div>
  )
}

function RegistrationSuccess({ info }: { info: RegisteredInfo }) {
  const loginPath = ROUTES.customerLogin
  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-neutral-50 px-4 py-10"
      style={{ fontFamily: "'SF Pro Text', 'SF Pro Display', 'Noto Sans JP', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="size-8 text-emerald-600" />
            </div>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-neutral-900">
              会員登録が完了しました
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">以下の内容で登録されました。</p>
          </div>

          <div className="mt-7 space-y-3">
            <InfoField label="お名前" value={info.name} />
            <InfoField label="メールアドレス" value={info.email} />
            {info.phone ? <InfoField label="電話番号" value={info.phone} /> : null}
          </div>

          <div className="mt-6 rounded-lg border border-amber-200/60 bg-amber-50 px-4 py-3.5">
            <p className="text-sm leading-relaxed text-amber-800">
              店舗の予約ページには、別途共有されるリンクからアクセスしてください。
            </p>
          </div>

          <div className="mt-6">
            <Button
              asChild
              variant="outline"
              className="h-11 w-full rounded-lg border-neutral-200 text-sm font-semibold transition-colors hover:border-neutral-400"
            >
              <Link to={loginPath}>ログイン画面へ</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-neutral-900">{value}</p>
    </div>
  )
}

function HealthCheck() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading")
  const [response, setResponse] = useState("")

  useEffect(() => {
    const controller = new AbortController()
    fetch(`${API_BASE}/api/health`, { signal: controller.signal })
      .then(async (res) => {
        const text = await res.text()
        setResponse(`${res.status} — ${text}`)
        setStatus("ok")
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return
        setResponse(err instanceof Error ? err.message : "接続失敗")
        setStatus("error")
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="mt-6 rounded-lg border border-dashed border-neutral-200 px-4 py-3">
      <p className="text-xs font-semibold text-neutral-600">API 接続確認</p>
      <p className="mt-0.5 text-[10px] font-mono text-neutral-400">{`GET ${API_BASE}/api/health`}</p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`inline-block size-2 rounded-full ${
            status === "loading"
              ? "animate-pulse bg-amber-400"
              : status === "ok"
                ? "bg-emerald-500"
                : "bg-red-500"
          }`}
        />
        <span className="text-xs text-neutral-500">
          {status === "loading" ? "確認中…" : response}
        </span>
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
