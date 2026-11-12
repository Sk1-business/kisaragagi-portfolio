import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  clearAdminTotpSecret,
  generateTotpSecret,
  isAdminTotpEnabled,
  readAdminTotpSecret,
  saveAdminTotpSecret,
  totpAuthUrl,
  verifyTotpCode,
} from "@/features/auth/lib/adminTotp"

export function AdminSecurityPage() {
  const [email, setEmail] = useState("")
  const [secret, setSecret] = useState("")
  const [code, setCode] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [enabled, setEnabled] = useState(false)

  function refreshEnabled(nextEmail: string) {
    setEnabled(isAdminTotpEnabled(nextEmail))
    setSecret(readAdminTotpSecret(nextEmail) ?? "")
  }

  async function handleEnable() {
    setError("")
    setMessage("")
    const normalized = email.trim()
    if (!normalized.includes("@")) {
      setError("ログインに使うメールアドレスを入力してください。")
      return
    }
    const ok = await verifyTotpCode(secret, code)
    if (!ok) {
      setError("認証アプリの6桁コードと一致しません。")
      return
    }
    saveAdminTotpSecret(normalized, secret)
    setEnabled(true)
    setCode("")
    setMessage("二要素認証を有効にしました。次回ログイン時にコードを求めます。")
  }

  async function handleDisable() {
    setError("")
    setMessage("")
    const ok = await verifyTotpCode(secret, code)
    if (!ok) {
      setError("解除するには、いまの認証コードを入力してください。")
      return
    }
    clearAdminTotpSecret(email)
    setEnabled(false)
    setSecret("")
    setCode("")
    setMessage("二要素認証を解除しました。")
  }

  const authUrl = email.trim() && secret ? totpAuthUrl(email, secret) : ""

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">二要素認証</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          パスワードに加えて、認証アプリの6桁コードでログインを確認します。秘密鍵はこのブラウザに保存されるため、使う端末ごとに有効化してください。
        </p>
      </div>
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="totp-email">ログインメールアドレス</Label>
          <Input
            id="totp-email"
            type="email"
            value={email}
            autoComplete="username"
            onChange={(event) => {
              setEmail(event.target.value)
              refreshEnabled(event.target.value)
              setMessage("")
              setError("")
            }}
          />
        </div>
        {enabled ? (
          <p className="text-sm font-medium">このメールアドレスでは二要素認証が有効です。</p>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSecret(generateTotpSecret())
              setMessage("認証アプリに秘密鍵を登録し、表示されたコードを入力してください。")
              setError("")
            }}
          >
            秘密鍵を発行する
          </Button>
        )}
        {secret ? (
          <div className="space-y-2 rounded-md bg-muted p-3 text-sm">
            <p className="font-medium">秘密鍵</p>
            <p className="break-all font-mono text-xs">{secret}</p>
            {authUrl ? <p className="break-all text-xs text-muted-foreground">{authUrl}</p> : null}
          </div>
        ) : null}
        <div className="space-y-1">
          <Label htmlFor="totp-code">認証コード</Label>
          <Input
            id="totp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <div className="flex gap-2">
          {enabled ? (
            <Button type="button" variant="destructive" onClick={() => void handleDisable()}>
              解除する
            </Button>
          ) : (
            <Button type="button" onClick={() => void handleEnable()} disabled={!secret}>
              有効にする
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
