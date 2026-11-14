/** 公開ビルドはデモが既定。実APIを使うときだけ `VITE_DEMO_MODE=false`。 */
export function isDemoMode(): boolean {
  const flag = import.meta.env.VITE_DEMO_MODE as string | undefined
  return flag !== "false"
}

export function routerBasename(): string | undefined {
  const base = import.meta.env.BASE_URL
  if (!base || base === "/") return undefined
  return base.endsWith("/") ? base.slice(0, -1) : base
}
