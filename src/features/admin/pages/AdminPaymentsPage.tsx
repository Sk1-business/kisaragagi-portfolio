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
          デモではカード会社には接続しません。お客様は前払いと当日払いのどちらも選べ、選んだ方法が予約台帳に残ります。
        </p>
      ) : null}

      <AdminStripeConnectCard />
      <AdminPayPaySettingsCard />
    </div>
  )
}
