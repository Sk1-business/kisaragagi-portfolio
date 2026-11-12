const STORAGE_KEY = "admin-totp-secrets-v1"
const PENDING_KEY = "admin-totp-pending"

type SecretMap = Record<string, string>

function readMap(): SecretMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    const next: SecretMap = {}
    for (const [email, secret] of Object.entries(parsed)) {
      if (typeof secret === "string" && secret.trim()) next[normalizeEmail(email)] = secret.trim()
    }
    return next
  } catch {
    return {}
  }
}

function writeMap(map: SecretMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

function base32Encode(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ""
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32[(value << (5 - bits)) & 31]
  return output
}

function base32Decode(input: string): Uint8Array {
  const cleaned = input.replace(/=+$/g, "").replace(/\s/g, "").toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of cleaned) {
    const index = BASE32.indexOf(char)
    if (index < 0) continue
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Uint8Array.from(out)
}

export function generateTotpSecret(): string {
  const bytes = new Uint8Array(20)
  crypto.getRandomValues(bytes)
  return base32Encode(bytes)
}

export function totpAuthUrl(email: string, secret: string): string {
  const label = encodeURIComponent(`予約管理:${normalizeEmail(email)}`)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encodeURIComponent("予約管理")}&algorithm=SHA1&digits=6&period=30`
}

async function hotp(secret: string, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    base32Decode(secret).buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  )
  const buffer = new ArrayBuffer(8)
  const view = new DataView(buffer)
  view.setUint32(0, Math.floor(counter / 0x100000000))
  view.setUint32(4, counter >>> 0)
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, buffer))
  const offset = signature[signature.length - 1] & 0xf
  const binary =
    ((signature[offset] & 0x7f) << 24) |
    ((signature[offset + 1] & 0xff) << 16) |
    ((signature[offset + 2] & 0xff) << 8) |
    (signature[offset + 3] & 0xff)
  return String(binary % 1_000_000).padStart(6, "0")
}

export async function verifyTotpCode(secret: string, code: string): Promise<boolean> {
  const normalized = code.replace(/\s/g, "")
  if (!/^\d{6}$/.test(normalized) || !secret.trim()) return false
  try {
    const counter = Math.floor(Date.now() / 30_000)
    for (const delta of [-1, 0, 1]) {
      const expected = await hotp(secret, counter + delta)
      if (expected === normalized) return true
    }
    return false
  } catch {
    return false
  }
}

export function isAdminTotpEnabled(email: string): boolean {
  const secret = readMap()[normalizeEmail(email)]
  return Boolean(secret)
}

export function readAdminTotpSecret(email: string): string | null {
  return readMap()[normalizeEmail(email)] ?? null
}

export function saveAdminTotpSecret(email: string, secret: string) {
  const map = readMap()
  map[normalizeEmail(email)] = secret.replace(/\s/g, "").toUpperCase()
  writeMap(map)
}

export function clearAdminTotpSecret(email: string) {
  const map = readMap()
  delete map[normalizeEmail(email)]
  writeMap(map)
}

export function markAdminTotpPending(email: string) {
  sessionStorage.setItem(PENDING_KEY, normalizeEmail(email))
}

export function readAdminTotpPending(): string | null {
  const value = sessionStorage.getItem(PENDING_KEY)
  return value && value.includes("@") ? value : null
}

export function clearAdminTotpPending() {
  sessionStorage.removeItem(PENDING_KEY)
}
