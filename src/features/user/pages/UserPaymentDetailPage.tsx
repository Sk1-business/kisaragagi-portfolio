import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"

export function UserPaymentDetailPage() {
  const shopId = useShopId()

  return (
    <section className="space-y-5">
      <UserSectionCard title="カード詳細" subtitle="カード更新は再登録方式に変更しました。">
        <div className="space-y-4 p-6">
          <p className="text-sm text-muted-foreground">
            セキュリティ対応のため、カード番号の編集は廃止しました。
            新しいカードを登録し、不要なカードを削除してください。
          </p>
          <Button asChild size="lg" className="w-full rounded-xl">
            <Link to={buildPathWithShopId(ROUTES.userMypagePayment, shopId)}>カード管理へ戻る</Link>
          </Button>
        </div>
      </UserSectionCard>
    </section>
  )
}
