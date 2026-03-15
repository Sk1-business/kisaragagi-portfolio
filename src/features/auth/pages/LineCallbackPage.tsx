import { useEffect, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import { lineCallback } from "@/features/auth/api/customerAuthApi"

export function LineCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [error, setError] = useState("")
  const [processing, setProcessing] = useState(true)

  useEffect(() => {
    const code = searchParams.get("code")

    if (!code) {
      setError("LINE認証コードが見つかりませんでした。")
      setProcessing(false)
      return
    }

    lineCallback(code).then((result) => {
      if (result.ok) {
        navigate(ROUTES.userMypage, { replace: true })
      } else {
        setError(result.error)
        setProcessing(false)
      }
    })
  }, [searchParams, navigate])

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-8">
      <Card className="w-full rounded-lg border-border shadow-xs">
        <CardContent className="py-10 text-center">
          {processing ? (
            <>
              <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
              <p className="text-sm text-muted-foreground">LINE認証を処理しています…</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-destructive">{error}</p>
              <Button asChild variant="outline" size="sm" className="mt-4 rounded-md">
                <Link to={ROUTES.customerLogin}>ログイン画面へ戻る</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
