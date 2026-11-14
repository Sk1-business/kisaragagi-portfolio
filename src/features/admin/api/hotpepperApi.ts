import { apiRequest } from "@/lib/apiClient"

export type HotpepperCoupon = {
  id: string
  title: string
  description: string
  price_yen: number
}

export type HotpepperSettings = {
  hotpepper_url: string
  coupons: HotpepperCoupon[]
}

export async function fetchHotpepperSettings(): Promise<HotpepperSettings> {
  return apiRequest<HotpepperSettings>("/api/admin/hotpepper")
}

export async function saveHotpepperSettings(input: HotpepperSettings): Promise<HotpepperSettings> {
  return apiRequest<HotpepperSettings>("/api/admin/hotpepper", {
    method: "PUT",
    body: input,
  })
}

export async function importHotpepperCsv(csv: string): Promise<{ imported: number; errors: string[] }> {
  return apiRequest<{ imported: number; errors: string[] }>("/api/admin/hotpepper/import", {
    method: "POST",
    body: { csv },
  })
}
