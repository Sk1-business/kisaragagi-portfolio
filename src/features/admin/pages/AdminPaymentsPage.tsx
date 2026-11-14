import { AdminPayPaySettingsCard } from "@/features/admin/components/AdminPayPaySettingsCard"
import { AdminStripeConnectCard } from "@/features/admin/components/AdminStripeConnectCard"
import { isDemoMode } from "@/demo/demoMode"

export function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">決済連携</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          クレジットカードとPayPayの売上受取設定を管理します。
        </p>
      </div>
      {isDemoMode() ? (
        <p className="rounded-lg border border-border bg-muted px-4 py-3 text-sm">
          デモでは外部決済を使わず、予約は当日払い（店頭会計）で確定します。
        </p>
      ) : null}

      <AdminStripeConnectCard />
      <AdminPayPaySettingsCard />
    </div>
  )
}
