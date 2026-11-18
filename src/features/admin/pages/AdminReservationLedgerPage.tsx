import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ROUTES } from "@/constants/routes"
import {
  fetchAdminReservations,
  patchAdminReservationStatus,
  type AdminReservationApiStatus,
} from "@/features/admin/api/reservationsApi"
import { useStaff } from "@/features/admin/hooks/useStaff"
import { reservationChannelLabel } from "@/features/admin/lib/reservationChannel"
import type { Reservation, ReservationStatus } from "@/features/admin/types/reservation"

const STATUS_LABEL: Record<ReservationStatus, string> = {
  CONFIRMED: "来店予定",
  COMPLETED: "来店完了",
  CANCELLED: "キャンセル",
  NO_SHOW: "無断キャンセル",
}

function whenLabel(iso: string): string {
  return `${iso.slice(0, 10).replaceAll("-", "/")} ${iso.slice(11, 16)}`
}

export function AdminReservationLedgerPage() {
  const navigate = useNavigate()
  const { staffList, loading: staffLoading } = useStaff()
  const [rows, setRows] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<ReservationStatus | "all">("all")
  const [channel, setChannel] = useState("all")
  const [message, setMessage] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const list = await fetchAdminReservations(staffList, {
        viewMode: "month",
        anchorDate: new Date(),
      })
      setRows(list.sort((a, b) => b.startAt.localeCompare(a.startAt)))
    } catch (cause) {
      if (cause instanceof Error && cause.message === "UNAUTHORIZED") {
        navigate(ROUTES.backofficeLogin, { replace: true })
        return
      }
      setError("予約台帳を読み込めませんでした。")
    } finally {
      setLoading(false)
    }
  }, [navigate, staffList])

  useEffect(() => {
    if (staffLoading) return
    void load()
  }, [load, staffLoading])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (status !== "all" && row.status !== status) return false
      if (channel !== "all" && (row.source ?? "web") !== channel) return false
      if (!needle) return true
      return [row.customerName, row.customerPhone, row.customerEmail, row.menuName, row.trainerName]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [channel, query, rows, status])

  async function updateStatus(row: Reservation, next: AdminReservationApiStatus) {
    setMessage("")
    try {
      await patchAdminReservationStatus(row.id, next)
      setMessage(`${row.customerName}の予約を更新しました。`)
      await load()
    } catch (cause) {
      if (cause instanceof Error && cause.message === "UNAUTHORIZED") {
        navigate(ROUTES.backofficeLogin, { replace: true })
        return
      }
      setMessage("予約を更新できませんでした。")
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">予約台帳</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          来店予定を来店完了、無断キャンセル、キャンセルに更新できます。来店完了だけが売上になります。
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="名前、電話、メニュー、スタイリスト"
          className="max-w-xs"
        />
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={status}
          onChange={(event) => setStatus(event.target.value as ReservationStatus | "all")}
        >
          <option value="all">状態すべて</option>
          <option value="CONFIRMED">来店予定</option>
          <option value="COMPLETED">来店完了</option>
          <option value="CANCELLED">キャンセル</option>
          <option value="NO_SHOW">無断キャンセル</option>
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
          value={channel}
          onChange={(event) => setChannel(event.target.value)}
        >
          <option value="all">経路すべて</option>
          <option value="web">自社WEB</option>
          <option value="phone">電話</option>
          <option value="hotpepper">ホットペッパー</option>
        </select>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">読み込み中...</p> : null}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-muted text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">日時</th>
              <th className="px-3 py-2 font-medium">お客様</th>
              <th className="px-3 py-2 font-medium">メニュー</th>
              <th className="px-3 py-2 font-medium">担当</th>
              <th className="px-3 py-2 font-medium">経路</th>
              <th className="px-3 py-2 font-medium">状態</th>
              <th className="px-3 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && !loading ? (
              <tr>
                <td className="px-3 py-3 text-muted-foreground" colSpan={7}>
                  該当する予約はありません。
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.id} className="border-t border-border">
                  <td className="px-3 py-2 whitespace-nowrap">{whenLabel(row.startAt)}</td>
                  <td className="px-3 py-2">
                    <Link className="underline" to={ROUTES.adminReservationDetail.replace(":id", row.id)}>
                      {row.customerName}
                    </Link>
                    <span className="block text-xs text-muted-foreground">{row.customerPhone}</span>
                  </td>
                  <td className="px-3 py-2">{row.menuName}</td>
                  <td className="px-3 py-2">{row.trainerName || "指名なし"}</td>
                  <td className="px-3 py-2">{reservationChannelLabel(row.source) ?? "自社WEB"}</td>
                  <td className="px-3 py-2">{STATUS_LABEL[row.status]}</td>
                  <td className="px-3 py-2">
                    {row.status === "CONFIRMED" ? (
                      <div className="flex flex-wrap gap-1">
                        <Button type="button" size="sm" onClick={() => void updateStatus(row, "DONE")}>
                          来店完了
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => void updateStatus(row, "NOSHOW")}>
                          無断
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => void updateStatus(row, "CANCELED")}>
                          キャンセル
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">更新済み</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
