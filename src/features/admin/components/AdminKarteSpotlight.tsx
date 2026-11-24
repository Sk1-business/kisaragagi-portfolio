import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { fetchAllReservationsForAdmin } from "@/features/admin/api/reservationsApi"
import { useStaff } from "@/features/admin/hooks/useStaff"
import { buildCustomerDirectory, ensureShowcaseCharts, type CustomerRecord } from "@/features/admin/lib/customerDirectory"

function preview(record: CustomerRecord): string {
  const talk = [...record.chart.conversationLogs].reverse().find((entry) => entry.speaker === "customer")
  return talk?.text || record.chart.hairRequest || record.chart.texture || "カルテはまだ空です"
}

export function AdminKarteSpotlight() {
  const navigate = useNavigate()
  const { staffList, loading: staffLoading } = useStaff()
  const [records, setRecords] = useState<CustomerRecord[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (staffLoading) return
    let cancelled = false
    void (async () => {
      try {
        ensureShowcaseCharts()
        const reservations = await fetchAllReservationsForAdmin(staffList)
        if (cancelled) return
        const next = buildCustomerDirectory(reservations)
        setRecords(
          [...next].sort((a, b) => Number(Boolean(b.chart.updatedAt)) - Number(Boolean(a.chart.updatedAt))).slice(0, 3),
        )
      } catch (cause) {
        if (cause instanceof Error && cause.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate, staffList, staffLoading])

  return (
    <section className="space-y-4 rounded-[1.75rem] bg-primary px-5 py-5 text-primary-foreground">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-primary-foreground/70">KARTE</p>
          <h2 className="text-xl font-semibold">顧客カルテ</h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-primary-foreground/80">
            この店の本体です。髪質、希望、会話を残し、次のカットを決めます。
          </p>
        </div>
        <Button asChild variant="secondary" className="rounded-full">
          <Link to={ROUTES.adminCustomers}>カルテを開く</Link>
        </Button>
      </div>
      {ready ? (
        <ul className="grid gap-3 sm:grid-cols-3">
          {records.map((record) => (
            <li key={record.key}>
              <Link
                to={`${ROUTES.adminCustomers}?customer=${encodeURIComponent(record.key)}`}
                className="block h-full rounded-[1.25rem] bg-primary-foreground/10 px-4 py-3 hover:bg-primary-foreground/15"
              >
                <p className="font-medium">{record.name || "名前未登録"}</p>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-primary-foreground/80">{preview(record)}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-primary-foreground/80">カルテを準備しています。</p>
      )}
    </section>
  )
}
