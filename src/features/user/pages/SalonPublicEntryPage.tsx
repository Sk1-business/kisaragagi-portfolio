import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { ROUTES } from "@/constants/routes"
import { fetchSalonPage } from "@/features/user/api/userSalonApi"
import { buildPathWithShopId } from "@/features/user/hooks/useShopId"
import { persistShopSlug } from "@/lib/shopSlug"

export function SalonPublicEntryPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [requestError, setRequestError] = useState("")
  const error = slug ? requestError : "サロンが見つかりません。"

  useEffect(() => {
    if (!slug) return

    let mounted = true
    void fetchSalonPage(slug)
      .then(() => {
        if (!mounted) return
        persistShopSlug(slug)
        navigate(buildPathWithShopId(ROUTES.userHome, slug), { replace: true })
      })
      .catch(() => {
        if (mounted) setRequestError("サロンが見つかりません。")
      })

    return () => {
      mounted = false
    }
  }, [navigate, slug])

  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4">
      <p className={error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
        {error || "読み込み中..."}
      </p>
    </main>
  )
}
