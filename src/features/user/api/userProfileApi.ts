import { ApiClientError, apiRequest } from "@/lib/apiClient"

export interface UserProfile {
  fullName: string
  email: string
  phone: string
}

interface CustomerProfileResponse {
  name: string
  email: string | null
  phone: string | null
}

const PROFILE_STORAGE_KEY = "user:profile:v2"

const DEFAULT_PROFILE: UserProfile = {
  fullName: "",
  email: "",
  phone: "",
}

function safeReadStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeWriteStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage write failures in fallback mode.
  }
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const stored = safeReadStorage<UserProfile>(PROFILE_STORAGE_KEY) ?? DEFAULT_PROFILE
  try {
    const data = await apiRequest<CustomerProfileResponse>("/api/auth/me")
    const merged: UserProfile = {
      fullName: data.name ?? stored.fullName,
      email: data.email ?? stored.email,
      phone: data.phone ?? stored.phone,
    }
    safeWriteStorage(PROFILE_STORAGE_KEY, merged)
    return merged
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return stored
    }
    throw error
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await apiRequest<CustomerProfileResponse>("/api/auth/me", {
    method: "PUT",
    body: {
      name: profile.fullName,
      email: profile.email,
      phone: profile.phone,
    },
  })
  safeWriteStorage(PROFILE_STORAGE_KEY, profile)
}
