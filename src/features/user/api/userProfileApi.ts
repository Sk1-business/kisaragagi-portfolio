export interface UserProfile {
  fullName: string
  kana: string
  email: string
  phone: string
}

const PROFILE_STORAGE_KEY = "user:profile:v1"

const DEFAULT_PROFILE: UserProfile = {
  fullName: "山田 太郎",
  kana: "ヤマダ タロウ",
  email: "yamada@example.com",
  phone: "090-1234-5678",
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
    // Ignore storage write failures in development fallback mode.
  }
}

export async function fetchUserProfile(): Promise<UserProfile> {
  const stored = safeReadStorage<UserProfile>(PROFILE_STORAGE_KEY)
  if (stored) {
    return Promise.resolve(stored)
  }
  safeWriteStorage(PROFILE_STORAGE_KEY, DEFAULT_PROFILE)
  return Promise.resolve(DEFAULT_PROFILE)
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  safeWriteStorage(PROFILE_STORAGE_KEY, profile)
  return Promise.resolve()
}
