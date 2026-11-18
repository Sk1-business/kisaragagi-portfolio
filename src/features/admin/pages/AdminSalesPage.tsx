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
  canceled_yen: number
  canceled_count: number
  noshow_count: number
  by_menu: SalesLine[]
  by_payment: { method: string; label: string; revenue_yen: number }[]
  by_day: { date: string; count: number; revenue_yen: number }[]
  by_trainer: { name: string; count: number; revenue_yen: number; profit_yen: number }[]
}

type MenuCostRow = {
  menu_id: string
  name: string
  price: number
  cost_yen: number
}

function yen(value: number): string {
  return `¥${value.toLocaleString("ja-JP")}`
}

function percent(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`
}

function SalesColumns({
  title,
  rows,
}: {
  title: string
  rows: { label: string; value: number }[]
}) {
  const max = Math.max(...rows.map((row) => row.value), 1)
  const width = Math.max(rows.length * 48, 160)
  const height = 120
  return (
    <section className="rounded-lg border border-border p-4">
      <h2 className="text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">この月の来店完了はまだありません。</p>
      ) : (
        <svg
          viewBox={`0 0 ${width} ${height + 36}`}
          className="mt-3 w-full text-foreground"
          role="img"
          aria-label={title}
        >
          {rows.map((row, index) => {
            const barHeight = Math.max(2, (row.value / max) * height)
            const x = index * 48 + 8
            return (
              <g key={row.label}>
                <rect
                  x={x}
                  y={height - barHeight}
                  width={28}
                  height={barHeight}
                  rx={3}
                  fill="currentColor"
                />
                <text x={x + 14} y={height + 14} textAnchor="middle" fontSize="10" fill="currentColor">
                  {row.label}
                </text>
                <text x={x + 14} y={height + 28} textAnchor="middle" fontSize="9" fill="currentColor" opacity={0.7}>
                  {row.value >= 10000 ? `${Math.round(row.value / 1000)}千` : yen(row.value).replace("¥", "")}
                </text>
              </g>
            )
          })}
        </svg>
      )}
    </section>
  )
}

export function AdminSalesPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [menus, setMenus] = useState<MenuCostRow[]>([])
  const [error, setError] = useState("")
  const [costMessage, setCostMessage] = useState("")

  function loadSales() {
    return Promise.all([
      apiRequest<SalesSummary>("/api/admin/sales"),
      apiRequest<MenuCostRow[]>("/api/admin/menus"),
    ]).then(([data, menuRows]) => {
      setSummary(data)
      setMenus(
        menuRows.map((menu) => ({
          menu_id: menu.menu_id,
          name: menu.name,
          price: Number(menu.price ?? 0),
          cost_yen: Number(menu.cost_yen ?? 0),
        })),
      )
    })
  }

  useEffect(() => {
    let active = true
    void loadSales().catch((cause: unknown) => {
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

  async function saveCost(menu: MenuCostRow) {
    setCostMessage("")
    try {
      await apiRequest(`/api/admin/menus/${encodeURIComponent(menu.menu_id)}`, {
        method: "PUT",
        body: { cost_yen: menu.cost_yen },
      })
      await loadSales()
      setCostMessage(`${menu.name}の原価を保存しました。`)
    } catch (cause) {
      if (cause instanceof Error && cause.message === "UNAUTHORIZED") {
        navigate(ROUTES.backofficeLogin, { replace: true })
        return
      }
      setCostMessage("原価を保存できませんでした。")
    }
  }

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
      <p className="text-sm text-muted-foreground">
        前受け（来店前の前払い） {yen(summary.prepaid_yen)}。キャンセル {summary.canceled_count}件 / {yen(summary.canceled_yen)} と無断キャンセル {summary.noshow_count}件は売上に含めていません。
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <SalesColumns
          title="日別の売上"
          rows={summary.by_day.map((day) => ({
            label: `${Number(day.date.slice(8))}日`,
            value: day.revenue_yen,
          }))}
        />
        <SalesColumns
          title="スタイリスト別の売上"
          rows={summary.by_trainer.map((trainer) => ({
            label: trainer.name.slice(0, 4),
            value: trainer.revenue_yen,
          }))}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">日</th>
                <th className="px-3 py-2 font-medium">来店</th>
                <th className="px-3 py-2 font-medium">売上</th>
              </tr>
            </thead>
            <tbody>
              {summary.by_day.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={3}>
                    この月の来店完了はまだありません。
                  </td>
                </tr>
              ) : (
                summary.by_day.map((day) => (
                  <tr key={day.date} className="border-t border-border">
                    <td className="px-3 py-2">{Number(day.date.slice(8))}日</td>
                    <td className="px-3 py-2">{day.count}</td>
                    <td className="px-3 py-2">{yen(day.revenue_yen)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">スタイリスト</th>
                <th className="px-3 py-2 font-medium">来店</th>
                <th className="px-3 py-2 font-medium">売上</th>
                <th className="px-3 py-2 font-medium">利益</th>
              </tr>
            </thead>
            <tbody>
              {summary.by_trainer.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-muted-foreground" colSpan={4}>
                    この月の来店完了はまだありません。
                  </td>
                </tr>
              ) : (
                summary.by_trainer.map((trainer) => (
                  <tr key={trainer.name} className="border-t border-border">
                    <td className="px-3 py-2">{trainer.name}</td>
                    <td className="px-3 py-2">{trainer.count}</td>
                    <td className="px-3 py-2">{yen(trainer.revenue_yen)}</td>
                    <td className="px-3 py-2">{yen(trainer.profit_yen)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
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
      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold">メニュー原価</h2>
        <p className="text-xs text-muted-foreground">原価を直すと、この月の利益率に反映されます。</p>
        <ul className="space-y-2">
          {menus.map((menu) => (
            <li key={menu.menu_id} className="flex flex-wrap items-center gap-2 text-sm">
              <span className="min-w-28">{menu.name}</span>
              <span className="text-muted-foreground">料金 {yen(menu.price)}</span>
              <label className="flex items-center gap-1">
                原価
                <input
                  type="number"
                  min={0}
                  className="h-8 w-28 rounded-md border border-input bg-background px-2"
                  value={menu.cost_yen}
                  onChange={(event) => {
                    const cost = Number(event.target.value)
                    setMenus((current) =>
                      current.map((item) =>
                        item.menu_id === menu.menu_id
                          ? { ...item, cost_yen: Number.isFinite(cost) ? cost : 0 }
                          : item,
                      ),
                    )
                  }}
                />
              </label>
              <button
                type="button"
                className="rounded-md border border-border px-2 py-1 text-xs"
                onClick={() => void saveCost(menu)}
              >
                保存
              </button>
            </li>
          ))}
        </ul>
        {costMessage ? <p className="text-xs text-muted-foreground">{costMessage}</p> : null}
      </section>
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
