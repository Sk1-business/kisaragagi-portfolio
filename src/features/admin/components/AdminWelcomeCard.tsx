import { Link } from "react-router-dom"
import { Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import type { AdminDashboardSummary } from "@/features/admin/types/adminDashboard"

interface AdminWelcomeCardProps {
  summary: AdminDashboardSummary
}

export function AdminWelcomeCard({ summary }: AdminWelcomeCardProps) {
  return (
    <Card className="rounded-lg border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg">{summary.title}</CardTitle>
        <CardDescription>{summary.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p>ここからカレンダー、予約一覧、メニュー管理などを追加できます。</p>
        <Button asChild variant="outline" size="sm" className="rounded-md">
          <Link to={ROUTES.adminCalendar} className="flex items-center gap-2">
            <Calendar className="size-4" />
            予約カレンダー
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
