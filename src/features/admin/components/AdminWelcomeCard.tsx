import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
      <CardContent className="text-sm text-muted-foreground">
        ここからカレンダー、予約一覧、メニュー管理などを追加できます。
      </CardContent>
    </Card>
  )
}
