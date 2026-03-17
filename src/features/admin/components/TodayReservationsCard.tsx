import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import type { Reservation } from "@/features/admin/types/reservation"
import { getStaffById } from "@/features/admin/api/staffApi"
import type { Staff } from "@/features/admin/types/staff"
import { formatTime, formatDateJa } from "@/features/admin/lib/calendarUtils"
import { getAssigneeColor } from "@/features/admin/hooks/useStaff"

interface TodayReservationsCardProps {
  reservations: Reservation[]
  staffList: Staff[]
}

export function TodayReservationsCard({ reservations, staffList }: TodayReservationsCardProps) {
  const today = new Date()
  const todayLabel = formatDateJa(today)

  const sorted = [...reservations].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  )

  return (
    <Card className="rounded-lg border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg">本日の予約一覧</CardTitle>
        <CardDescription>{todayLabel}</CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            本日の確定予約はありません。
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map((r) => {
              const staff = getStaffById(r.assigneeId, staffList)
              const color = getAssigneeColor(r.assigneeId, staffList)
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 rounded-lg border border-border border-l-4 py-3 pl-3 pr-3 sm:flex-row sm:items-center sm:justify-between"
                  style={{
                    borderLeftColor: color,
                    backgroundColor: `${color}14`,
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{r.customerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(r.startAt)} ～ {formatTime(r.endAt)}
                      {staff && (
                        <span className="ml-2 inline-flex items-center gap-1">
                          <span
                            className="inline-block size-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          担当: {staff.name}
                        </span>
                      )}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm" className="shrink-0 rounded-md">
                    <Link to={ROUTES.adminReservationDetail.replace(":id", r.id)}>
                      詳細
                    </Link>
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
