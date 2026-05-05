import { CreditCard, ExternalLink, RefreshCw } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  fetchStripeConnectStatus,
  startStripeConnectOnboarding,
  type StripeConnectStatus,
} from "@/features/admin/api/stripeConnectApi"

function statusLabel(status: StripeConnectStatus | null): string {
  if (!status) return "確認中"
  if (status.connected) return "接続済み"
  if (status.status === "onboarding") return "オンボーディング中"
  return "未接続"
}

export function AdminStripeConnectCard() {
  const [status, setStatus] = useState<StripeConnectStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState("")

  async function loadStatus() {
    setLoading(true)
    setError("")
    try {
      setStatus(await fetchStripeConnectStatus())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stripe Connect の状態確認に失敗しました。")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadStatus()
  }, [])

  const toneClass = useMemo(() => {
    if (status?.connected) return "border-emerald-200 bg-emerald-50 text-emerald-700"
    if (status?.status === "onboarding") return "border-amber-200 bg-amber-50 text-amber-700"
    return "border-slate-200 bg-slate-50 text-slate-700"
  }, [status])

  async function handleConnect() {
    setStarting(true)
    setError("")
    try {
      const result = await startStripeConnectOnboarding()
      window.location.assign(result.onboarding_url)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stripe Connect の開始に失敗しました。")
      setStarting(false)
    }
  }

  return (
    <Card className="rounded-lg border-border shadow-xs">
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="size-5" />
              Stripe Connect
            </CardTitle>
            <CardDescription>
              店舗の売上を受け取る Stripe アカウントを接続します。
            </CardDescription>
          </div>
          <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${toneClass}`}>
            {loading ? "確認中" : statusLabel(status)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 text-sm">
          <p className="text-muted-foreground">
            クレジットカード決済は、Stripe Connect 接続済みの店舗でのみ利用できます。
          </p>
          {status?.account_id ? (
            <p className="break-all text-xs text-muted-foreground">
              Account ID: <span className="font-medium text-foreground">{status.account_id}</span>
            </p>
          ) : null}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={() => void handleConnect()} disabled={loading || starting}>
            <ExternalLink className="size-4" />
            {status?.connected ? "Stripe 接続を管理" : "Stripe に接続"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => void loadStatus()}
            disabled={loading || starting}
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            状態を更新
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
