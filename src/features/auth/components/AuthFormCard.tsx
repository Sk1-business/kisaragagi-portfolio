import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import mockUsers from "@/features/auth/api/mockUsers.json"
import { AUTH_AUDIENCE_TEXT, AUTH_TEXT } from "@/features/auth/constants"
import { useAuthNavigation } from "@/features/auth/hooks/useAuthNavigation"
import type { AuthFormCardProps, MockUser } from "@/features/auth/types/auth"
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

export function AuthFormCard({ audience, mode }: AuthFormCardProps) {
  const text = AUTH_TEXT[mode]
  const audienceText = AUTH_AUDIENCE_TEXT[audience]
  const { submit } = useAuthNavigation(audience, mode)
  const isCustomerPortal = audience === "CUSTOMER_PORTAL"
  const [loginError, setLoginError] = useState("")
  const developmentUsers = (mockUsers as MockUser[]).filter((user) =>
    VISIBLE_ROLES[audience].includes(user.role),
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get("email") ?? "")
    const password = String(formData.get("password") ?? "")
    const signupRole = isCustomerPortal
      ? "CUSTOMER"
      : (String(formData.get("role") ?? "ADMIN") as UserRole)

    const isSuccess = await submit({ email, password, signupRole })

    if (isSuccess) {
      setLoginError("")
      return
    }

    if (mode === "login") {
      setLoginError("ログインに失敗しました。メールアドレスまたはパスワードを確認してください。")
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-8">
      <Card className="w-full rounded-lg border-border shadow-xs">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">{`${audienceText.title} ${text.title}`}</CardTitle>
          <CardDescription>{`${audienceText.description} ${text.description}`}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
                className="rounded-md"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="********"
                required
                className="rounded-md"
              />
            </div>

            {mode === "signup" && !isCustomerPortal ? (
              <div className="space-y-2">
                <Label htmlFor="role">ロール</Label>
                <select
                  id="role"
                  name="role"
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-[3px]"
                  defaultValue="ADMIN"
                >
                  {ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <Button type="submit" className="w-full rounded-md">
              {text.submitLabel}
            </Button>

            {mode === "login" && loginError ? (
              <p className="text-sm text-destructive">{loginError}</p>
            ) : null}
          </form>

          <div className="mt-5 space-y-1 text-sm text-muted-foreground">
            <p>{text.switchLabel}</p>
            <Link to={SWITCH_PATH[audience][mode]} className="font-medium text-foreground underline">
              {text.switchLinkText}
            </Link>
          </div>

          <div className="mt-4">
            <Link to={ROUTES.landing} className="text-sm text-muted-foreground underline">
              トップへ戻る
            </Link>
          </div>

          <div className="mt-6 rounded-md bg-muted px-3 py-3">
            <p className="text-sm font-semibold">開発用テストアカウント</p>
            <div className="mt-2 space-y-2">
              {developmentUsers.map((user) => (
                <div key={user.id} className="text-xs text-muted-foreground">
                  <p>{`role: ${user.role}`}</p>
                  <p>{`email: ${user.email}`}</p>
                  <p>{`password: ${user.password_hash}`}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
