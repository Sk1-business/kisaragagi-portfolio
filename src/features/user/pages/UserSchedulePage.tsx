import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"

export function UserSchedulePage() {
  const shopId = useShopId()
  return (
    <section className="space-y-5">
      <UserSectionCard title="スケジュール選択" subtitle="日程の選択は準備中です。">
        <div className="px-6 py-8 text-sm text-muted-foreground">
          この画面は今後のリリースで利用できる予定です。
        </div>
      </UserSectionCard>
      <Button asChild variant="outline" className="w-full rounded-xl">
        <Link to={buildPathWithShopId(ROUTES.userReservationNomination, shopId)}>
          トレーナー選択へ戻る
        </Link>
      </Button>
    </section>
  )
}
