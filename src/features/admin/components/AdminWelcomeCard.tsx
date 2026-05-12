import { Link, useNavigate } from "react-router-dom"
import { Calendar, CalendarPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import type { AdminDashboardSummary } from "@/features/admin/types/adminDashboard"

interface AdminWelcomeCardProps {
  summary: AdminDashboardSummary
  /** owner はヘッダーナビがないため、予約カレンダー・新規予約への導線をここに出す */
  showInlineBookingActions?: boolean
}

export function AdminWelcomeCard({
  summary,
  showInlineBookingActions = false,
}: AdminWelcomeCardProps) {
  const navigate = useNavigate()
  return (
    <Card className="rounded-lg border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg">{summary.title}</CardTitle>
        <CardDescription>{summary.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>ここからカレンダー、予約一覧、メニュー管理などを追加できます。</p>
        <div
          className={
            showInlineBookingActions
              ? "flex flex-wrap gap-2"
              : undefined
          }
        >
          <Button asChild variant="outline" size="sm" className="rounded-md">
            <Link to={ROUTES.adminCalendar} className="flex items-center gap-2">
              <Calendar className="size-4" />
              予約カレンダー
            </Link>
          </Button>
          {showInlineBookingActions ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-md"
              onClick={() =>
                navigate(ROUTES.adminNewReservation, {
                  state: { bookingNotBeforeIso: new Date().toISOString() },
                })
              }
            >
              <span className="flex items-center gap-2">
                <CalendarPlus className="size-4" />
                新規予約
              </span>
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
