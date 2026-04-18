import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserDashboardSummary } from "@/features/user/types/userDashboard"

interface UserWelcomeCardProps {
  summary: UserDashboardSummary
}

export function UserWelcomeCard({ summary }: UserWelcomeCardProps) {
  return (
    <Card className="rounded-lg border-border shadow-xs">
      <CardHeader>
        <CardTitle className="text-lg">{summary.title}</CardTitle>
        <CardDescription>{summary.message}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        ここから予約一覧、空き枠検索、キャンセル機能などを追加できます。
      </CardContent>
    </Card>
  )
}
