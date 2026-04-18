import { API_BASE } from "@/lib/apiBase"
import { buildSalonApiPath } from "@/lib/shopSlug"

export interface SalonPageResponse {
  salon_name: string
}

export async function fetchSalonPage(shopSlug: string): Promise<SalonPageResponse> {
  const res = await fetch(`${API_BASE}${buildSalonApiPath(shopSlug, "")}`, {
    credentials: "include",
  })
  if (!res.ok) throw new Error("salon fetch failed")
  return (await res.json()) as SalonPageResponse
}
