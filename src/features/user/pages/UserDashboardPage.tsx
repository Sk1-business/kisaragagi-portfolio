import { useSearchParams } from "react-router-dom"

import { UserWelcomeCard } from "@/features/user/components/UserWelcomeCard"
import { useUserDashboardSummary } from "@/features/user/hooks/useUserDashboardSummary"

export function UserDashboardPage() {
  const [searchParams] = useSearchParams()
  const shopId = searchParams.get("shopId") ?? undefined
  const summary = useUserDashboardSummary(shopId)

  if (!summary) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  return <UserWelcomeCard summary={summary} shopId={shopId} />
}
