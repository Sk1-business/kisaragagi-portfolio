import { UserWelcomeCard } from "@/features/user/components/UserWelcomeCard"
import { useUserDashboardSummary } from "@/features/user/hooks/useUserDashboardSummary"

export function UserDashboardPage() {
  const summary = useUserDashboardSummary()

  if (!summary) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  return <UserWelcomeCard summary={summary} />
}
