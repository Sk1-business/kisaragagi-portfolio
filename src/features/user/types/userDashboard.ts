export interface UserDashboardSummary {
  title: string
  message: string
  shopName: string
  shopOverview: string
  shopAddress: string
  businessHours: string
  shopImageUrl: string
  hotpepperUrl?: string
  coupons?: { title: string; description: string; priceYen: number }[]
}
