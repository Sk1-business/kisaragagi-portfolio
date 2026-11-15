import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { ROUTES } from "@/constants/routes"
import { apiRequest } from "@/lib/apiClient"

type SalesLine = {
  name: string
  count: number
  revenue_yen: number
  cost_yen: number
  profit_yen: number
  margin_rate: number
}

type SalesSummary = {
  month: string
  revenue_yen: number
  cost_yen: number
  profit_yen: number
  margin_rate: number
  prepaid_yen: number
  by_menu: SalesLine[]
  by_payment: { method: string; label: string; revenue_yen: number }[]
}

function yen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`
}

function percent(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`
}

export function AdminSalesPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    void apiRequest<SalesSummary>("/api/admin/sales")
      .then((data) => {
        if (active) setSummary(data)
      })
      .catch((cause: unknown) => {
        if (!active) return
        if (cause instanceof Error && cause.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setError("売上を集計できませんでした。")
      })
    return () => {
      active = false
    }
  }, [navigate])

  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!summary) return <p className="text-sm text-muted-foreground">集計しています。</p>

  const cards = [
    { label: "売上", value: yen(summary.revenue_yen), note: "来店完了の会計" },
    { label: "原価", value: yen(summary.cost_yen), note: "メニューごとの材料・施術原価" },
    { label: "利益", value: yen(summary.profit_yen), note: `利益率 ${percent(summary.margin_rate)}` },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">売上と利益</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {summary.month.slice(0, 4)}年{Number(summary.month.slice(5))}月の来店完了分です。前受けは来店前の入金で、売上には含めていません。
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <section key={card.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">{card.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{card.note}</p>
          </section>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">前受け（来店前の前払い） {yen(summary.prepaid_yen)}</p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">メニュー</th>
              <th className="px-3 py-2 font-medium">件数</th>
              <th className="px-3 py-2 font-medium">売上</th>
              <th className="px-3 py-2 font-medium">原価</th>
              <th className="px-3 py-2 font-medium">利益</th>
              <th className="px-3 py-2 font-medium">利益率</th>
            </tr>
          </thead>
          <tbody>
            {summary.by_menu.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-muted-foreground" colSpan={6}>
                  この月の来店完了はまだありません。
                </td>
              </tr>
            ) : (
              summary.by_menu.map((line) => (
                <tr key={line.name} className="border-t border-border">
                  <td className="px-3 py-2">{line.name}</td>
                  <td className="px-3 py-2">{line.count}</td>
                  <td className="px-3 py-2">{yen(line.revenue_yen)}</td>
                  <td className="px-3 py-2">{yen(line.cost_yen)}</td>
                  <td className="px-3 py-2">{yen(line.profit_yen)}</td>
                  <td className="px-3 py-2">{percent(line.margin_rate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ul className="space-y-1 text-sm">
        {summary.by_payment.map((item) => (
          <li key={item.method}>
            {item.label} {yen(item.revenue_yen)}
          </li>
        ))}
      </ul>
    </div>
  )
}
