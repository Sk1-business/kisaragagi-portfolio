import { ChevronLeft } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { AdminPayPaySettingsCard } from "@/features/admin/components/AdminPayPaySettingsCard"

export function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="rounded-md">
          <Link to={ROUTES.adminHome}>
            <ChevronLeft className="size-4" aria-hidden />
            ダッシュボードへ
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-lg font-semibold tracking-tight">決済・PayPay連携</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          店舗でPayPay決済を受け取るための認証情報を設定します。
        </p>
      </div>

      <AdminPayPaySettingsCard />
    </div>
  )
}
