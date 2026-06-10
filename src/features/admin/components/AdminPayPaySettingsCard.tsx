import { RefreshCw, Save, ShieldCheck, Trash2 } from "lucide-react"
import { useEffect, useState, type FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  deletePayPayCredentials,
  fetchPayPayStatus,
  savePayPayCredentials,
  type PayPayMode,
  type PayPayStatus,
} from "@/features/admin/api/payPaySettingsApi"

const EMPTY_STATUS: PayPayStatus = {
  configured: false,
  mode: null,
  merchant_id_masked: null,
}

export function AdminPayPaySettingsCard() {
  const [status, setStatus] = useState<PayPayStatus>(EMPTY_STATUS)
  const [mode, setMode] = useState<PayPayMode>("sandbox")
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [merchantId, setMerchantId] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  async function loadStatus() {
    setLoading(true)
    setError("")
    try {
      const nextStatus = await fetchPayPayStatus()
      setStatus(nextStatus)
      if (nextStatus.mode) setMode(nextStatus.mode)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PayPay連携状態の取得に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    setError("")

    if (!apiKey.trim() || !apiSecret.trim() || !merchantId.trim()) {
      setError("API Key、API Secret、Merchant IDをすべて入力してください。")
      return
    }

    setSaving(true)
    try {
      const nextStatus = await savePayPayCredentials({
        apiKey,
        apiSecret,
        merchantId,
        mode,
      })
      setStatus(nextStatus)
      setApiKey("")
      setApiSecret("")
      setMerchantId("")
      setMessage("PayPayの受取設定を保存しました。")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PayPayの受取設定に失敗しました。")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm("PayPay連携を解除しますか？解除後はPayPay決済を受け付けられません。")) {
      return
    }
    setDeleting(true)
    setMessage("")
    setError("")
    try {
      setStatus(await deletePayPayCredentials())
      setMessage("PayPay連携を解除しました。")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "PayPay連携の解除に失敗しました。")
    } finally {
      setDeleting(false)
    }
  }

  const busy = loading || saving || deleting

  return (
    <Card className="rounded-lg border-border shadow-xs">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5" />
              PayPay受取設定
            </CardTitle>
            <CardDescription>
              店舗のPayPay for Developers認証情報を登録し、売上を店舗アカウントで受け取ります。
            </CardDescription>
          </div>
          <span
            className={
              status.configured
                ? "w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                : "w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
            }
          >
            {loading ? "確認中" : status.configured ? "設定済み" : "未設定"}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          {status.configured ? (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p>
                利用環境:{" "}
                <span className="font-medium">
                  {status.mode === "production" ? "本番" : "Sandbox"}
                </span>
              </p>
              <p>
                Merchant ID:{" "}
                <span className="font-mono font-medium">{status.merchant_id_masked}</span>
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paypay-mode">利用環境</Label>
              <select
                id="paypay-mode"
                value={mode}
                onChange={(event) => setMode(event.target.value as PayPayMode)}
                disabled={busy}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="sandbox">Sandbox（テスト）</option>
                <option value="production">本番</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypay-merchant-id">Merchant ID</Label>
              <Input
                id="paypay-merchant-id"
                value={merchantId}
                onChange={(event) => setMerchantId(event.target.value)}
                autoComplete="off"
                placeholder={status.merchant_id_masked ?? "Merchant ID"}
                disabled={busy}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paypay-api-key">API Key</Label>
              <Input
                id="paypay-api-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                autoComplete="new-password"
                placeholder={status.configured ? "更新する場合のみ再入力" : "API Key"}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paypay-api-secret">API Secret</Label>
              <Input
                id="paypay-api-secret"
                type="password"
                value={apiSecret}
                onChange={(event) => setApiSecret(event.target.value)}
                autoComplete="new-password"
                placeholder={status.configured ? "更新する場合のみ再入力" : "API Secret"}
                disabled={busy}
              />
            </div>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            認証情報は暗号化してサーバーに保存され、この画面には再表示されません。設定更新時は3項目をすべて再入力してください。
          </p>

          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit" disabled={busy}>
              <Save className="size-4" />
              {saving ? "保存中..." : status.configured ? "認証情報を更新" : "PayPayを連携"}
            </Button>
            <Button type="button" variant="outline" onClick={() => void loadStatus()} disabled={busy}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              状態を更新
            </Button>
            {status.configured ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={busy}
              >
                <Trash2 className="size-4" />
                {deleting ? "解除中..." : "連携を解除"}
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
