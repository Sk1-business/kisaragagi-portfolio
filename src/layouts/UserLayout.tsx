import { Link, Outlet } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"

export function UserLayout() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">User</p>
          <h1 className="text-lg font-semibold">予約者画面</h1>
        </div>
        <Button asChild variant="outline" size="sm" className="rounded-md">
          <Link to={ROUTES.landing}>トップへ</Link>
        </Button>
      </header>
      <Outlet />
    </main>
  )
}
