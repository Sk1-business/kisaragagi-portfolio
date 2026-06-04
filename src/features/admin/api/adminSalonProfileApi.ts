import { ApiClientError, apiRequest } from "@/lib/apiClient"

export interface AdminSalonProfile {
  salon_id: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_image_url: string | null
  phone: string | null
  address: string | null
  instagram_url: string | null
  line_url: string | null
  website_url: string | null
  theme_color: string
  booking_page_message: string | null
  cancellation_policy_text: string | null
  timezone: string
}

export interface AdminSalonProfileUpdate {
  slug?: string
  timezone?: string
}

export async function fetchAdminSalonProfile(): Promise<AdminSalonProfile | null> {
  try {
    return await apiRequest<AdminSalonProfile>("/api/admin/profile")
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) return null
    throw error
  }
}

export async function updateAdminSalonProfile(
  body: AdminSalonProfileUpdate,
): Promise<AdminSalonProfile> {
  return apiRequest<AdminSalonProfile>("/api/admin/profile", {
    method: "PUT",
    body,
  })
}
