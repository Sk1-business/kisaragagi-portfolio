import { useSearchParams } from "react-router-dom"

import { UserWelcomeCard } from "@/features/user/components/UserWelcomeCard"
import { useUserDashboardSummary } from "@/features/user/hooks/useUserDashboardSummary"

export function UserDashboardPage() {
  const [searchParams] = useSearchParams()
  const shopId = searchParams.get("shopId") ?? undefined
  const { summary, error } = useUserDashboardSummary(shopId)

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>
  }

  if (!summary) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  return <UserWelcomeCard summary={summary} shopId={shopId} />
}
