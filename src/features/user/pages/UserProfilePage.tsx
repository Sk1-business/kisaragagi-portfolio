import { type FormEvent, useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import { fetchUserProfile, saveUserProfile } from "@/features/user/api/userProfileApi"
import { ApiClientError } from "@/lib/apiClient"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"

export function UserProfilePage() {
  const shopId = useShopId()
  const [isSaved, setIsSaved] = useState(false)
  const [fullName, setFullName] = useState("")
  const [kana, setKana] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    let isMounted = true
    fetchUserProfile()
      .then((profile) => {
        if (!isMounted) return
        setErrorMessage("")
        setFullName(profile.fullName)
        setKana(profile.kana)
        setEmail(profile.email)
        setPhone(profile.phone)
      })
      .catch(() => {
        if (!isMounted) return
        setErrorMessage("プロフィール取得に失敗しました。")
      })
      .finally(() => {
        if (!isMounted) return
        setIsLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await saveUserProfile({ fullName, kana, email, phone })
      setErrorMessage("")
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("プロフィール保存に失敗しました。")
      }
    }
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white">
          <h2 className="font-bold">プロフィール編集</h2>
          <p className="mt-0.5 text-xs text-slate-300">登録情報を変更できます。</p>
        </div>
        {errorMessage ? <p className="px-6 pt-4 text-sm text-destructive">{errorMessage}</p> : null}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profileName">お名前</Label>
              <Input
                id="profileName"
                name="profileName"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profileKana">フリガナ</Label>
              <Input
                id="profileKana"
                name="profileKana"
                value={kana}
                onChange={(event) => setKana(event.target.value)}
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profileEmail">メールアドレス</Label>
              <Input
                id="profileEmail"
                name="profileEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profilePhone">電話番号</Label>
              <Input
                id="profilePhone"
                name="profilePhone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                required
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" className="rounded-xl" disabled={isLoading}>
              {isLoading ? "読み込み中..." : "保存する"}
            </Button>
            {isSaved ? (
              <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                <CheckCircle2 className="size-4" />
                保存しました
              </span>
            ) : null}
          </div>
        </form>
      </div>

      <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
        <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>マイページへ戻る</Link>
      </Button>
    </section>
  )
}
