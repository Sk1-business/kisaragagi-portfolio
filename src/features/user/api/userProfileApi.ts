import { apiRequest } from "@/lib/apiClient"

export interface UserProfile {
  fullName: string
  email: string
  phone: string
}

export async function fetchUserProfile(): Promise<UserProfile> {
  return apiRequest<UserProfile>("/api/my/profile")
}
