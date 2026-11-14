import { handleDemoRequest } from "@/demo/demoRouter"
import { isDemoMode } from "@/demo/demoMode"

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.href
  return input.url
}

function apiPath(url: string): string | null {
  if (url.startsWith("/api/") || url === "/api") return url
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.origin !== window.location.origin) return null
    if (parsed.pathname.startsWith("/api/") || parsed.pathname === "/api") {
      return `${parsed.pathname}${parsed.search}`
    }
  } catch {
    return null
  }
  return null
}

let installed = false

export function installDemoFetch(): void {
  if (!isDemoMode() || installed || typeof window === "undefined") return
  installed = true
  const original = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = apiPath(requestUrl(input))
    if (!path) return original(input, init)
    try {
      return await handleDemoRequest(path, init)
    } catch (error) {
      const detail = error instanceof Error ? error.message : "demo error"
      return new Response(JSON.stringify({ detail }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }
  }
}
