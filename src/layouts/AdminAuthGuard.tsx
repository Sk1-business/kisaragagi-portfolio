import { useCallback, useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { fetchAdminSession } from "@/features/auth/api/adminSessionApi"

type GuardStatus = "checking" | "ok" | "error"

/**
 * 管理者ルート用。Cookie が無効ならログインへ replace し、
 * ブラウザの戻る（bfcache 含む）で画面だけ戻っても再検証する。
 */
export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState<GuardStatus>("checking")

  const runCheck = useCallback(
    async (signal?: AbortSignal) => {
      setStatus("checking")
      const result = await fetchAdminSession()
      if (signal?.aborted) return
      if (result === "ok") {
        setStatus("ok")
        return
      }
      if (result === "unauthorized") {
        navigate(ROUTES.backofficeLogin, { replace: true })
        return
      }
      setStatus("error")
    },
    [navigate],
  )

  useEffect(() => {
    const ac = new AbortController()
    void runCheck(ac.signal)
    return () => ac.abort()
  }, [location.pathname, runCheck])

  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return
      void runCheck()
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [runCheck])

  if (status === "checking") {
    return (
      <p className="text-sm text-muted-foreground">読み込み中...</p>
    )
  }

  if (status === "error") {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          セッションの確認に失敗しました。ネットワークまたはサーバーを確認してください。
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void runCheck()}>
          再試行
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
