import { Link } from "react-router-dom"
import { CalendarRange, CalendarX2, ChartColumn, ClipboardList, CreditCard, Scissors, Store, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"

const hubItems = [
  {
    key: "salon",
    title: "サロン管理",
    description: "サロン情報・営業時間・予約ルールの設定",
    to: ROUTES.adminSalonSettings,
    icon: Store,
    disabled: false,
  },
  {
    key: "staff",
    title: "スタッフ管理",
    description: "所属スタッフの新規登録・編集",
    to: ROUTES.adminStaff,
    icon: Users,
    disabled: false,
  },
  {
    key: "menus",
    title: "メニュー管理",
    description: "メニューの新規登録・編集・削除",
    to: ROUTES.adminMenus,
    icon: Scissors,
    disabled: false,
  },
  {
    key: "shifts",
    title: "シフト管理",
    description: "全スタッフのシフト確認・編集",
    to: ROUTES.adminShiftCalendar,
    icon: CalendarRange,
    disabled: false,
  },
  {
    key: "ledger",
    title: "予約台帳",
    description: "予約を検索し、来店完了・無断・キャンセルにする",
    to: ROUTES.adminReservationLedger,
    icon: ClipboardList,
    disabled: false,
  },
  {
    key: "cancelled",
    title: "キャンセル一覧",
    description: "キャンセル済みの予約を確認し、空きがあれば復活できます",
    to: ROUTES.adminCancelled,
    icon: CalendarX2,
    disabled: false,
  },
  {
    key: "sales",
    title: "売上と利益",
    description: "来店完了の売上、原価、利益率",
    to: ROUTES.adminSales,
    icon: ChartColumn,
    disabled: false,
  },
  {
    key: "payments",
    title: "決済連携",
    description: "StripeとPayPayの受取アカウントを管理",
    to: ROUTES.adminPayments,
    icon: CreditCard,
    disabled: false,
  },
] as const

export function AdminOwnerFeatureHub() {
  return (
    <section aria-label="管理者向け機能" className="space-y-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">サブの店舗機能</h2>
        <p className="text-sm text-muted-foreground">
          予約、売上、設定はカルテの補助です。
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {hubItems.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.key}>
              <Card
                className={cn(
                  "h-full border-border shadow-xs transition-colors",
                  item.disabled && "bg-muted/30",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground",
                        item.disabled && "opacity-60",
                      )}
                    >
                      <Icon className="size-5 text-foreground" aria-hidden />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                      <CardDescription className="text-xs leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {item.disabled || !item.to ? (
                    <Button type="button" variant="secondary" size="sm" className="rounded-md" disabled>
                      開く（準備中）
                    </Button>
                  ) : (
                    <Button asChild variant="default" size="sm" className="rounded-md">
                      <Link to={item.to}>画面を開く</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
