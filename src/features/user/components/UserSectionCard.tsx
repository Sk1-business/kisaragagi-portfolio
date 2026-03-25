import type { ReactNode } from "react"

interface UserSectionCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  headerTone?: "gradient" | "plain"
  className?: string
  bodyClassName?: string
}

export function UserSectionCard({
  title,
  subtitle,
  children,
  headerTone = "gradient",
  className = "",
  bodyClassName = "",
}: UserSectionCardProps) {
  const headerClassName =
    headerTone === "gradient"
      ? "border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white"
      : "border-b border-slate-100 px-6 py-4"

  return (
    <div className={`rounded-2xl bg-white shadow-lg ${className}`.trim()}>
      <div className={headerClassName}>
        <h2 className={headerTone === "gradient" ? "font-bold" : "text-sm font-bold text-foreground"}>
          {title}
        </h2>
        {subtitle ? (
          <p className={headerTone === "gradient" ? "mt-0.5 text-xs text-slate-300" : "mt-0.5 text-xs text-muted-foreground"}>
            {subtitle}
          </p>
        ) : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
