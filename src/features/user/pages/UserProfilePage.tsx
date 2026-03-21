import { type FormEvent, useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import { fetchUserProfile, saveUserProfile } from "@/features/user/api/userProfileApi"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import {
  isCompletePhoneSegments,
  joinPhoneSegments,
  parsePhoneToSegments,
  updatePhoneSegment,
  type PhoneSegments,
} from "@/lib/phone"

export function UserProfilePage() {
  const shopId = useShopId()
  const [isSaved, setIsSaved] = useState(false)
  const [lastName, setLastName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [email, setEmail] = useState("")
  const [phoneSegments, setPhoneSegments] = useState<PhoneSegments>(["", "", ""])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")

  function resolveErrorMessage(error: unknown) {
    if (error instanceof Error && typeof error.message === "string" && error.message) {
      return error.message
    }
    return "プロフィール保存に失敗しました。"
  }

  useEffect(() => {
    let isMounted = true
    fetchUserProfile()
      .then((profile) => {
        if (!isMounted) return
        setErrorMessage("")
        const [parsedLastName, ...restName] = profile.fullName.trim().split(/\s+/)
        setLastName(parsedLastName ?? "")
        setFirstName(restName.join(" "))
        setEmail(profile.email)
        setPhoneSegments(parsePhoneToSegments(profile.phone))
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
    const fullName = `${lastName} ${firstName}`.trim()
    if (!isCompletePhoneSegments(phoneSegments)) {
      setErrorMessage("電話番号は数字のみで3-4-4桁を入力してください。")
      return
    }
    const phone = joinPhoneSegments(phoneSegments)
    try {
      await saveUserProfile({ fullName, email, phone })
      setErrorMessage("")
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    } catch (error) {
      setErrorMessage(resolveErrorMessage(error))
    }
  }

  return (
    <section className="space-y-5">
      <UserSectionCard title="プロフィール編集" subtitle="登録情報を変更できます。">
        {errorMessage ? <p className="px-6 pt-4 text-sm text-destructive">{errorMessage}</p> : null}
        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profileLastName">姓</Label>
              <Input
                id="profileLastName"
                name="profileLastName"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                required
                className="rounded-lg"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profileFirstName">名</Label>
              <Input
                id="profileFirstName"
                name="profileFirstName"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
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
              <Label>電話番号</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="profilePhone1"
                  type="tel"
                  inputMode="numeric"
                  value={phoneSegments[0]}
                  onChange={(event) =>
                    setPhoneSegments((prev) => updatePhoneSegment(prev, 0, event.target.value))
                  }
                  required
                  placeholder="090"
                  className="min-w-0 flex-1 rounded-lg text-center"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  id="profilePhone2"
                  type="tel"
                  inputMode="numeric"
                  value={phoneSegments[1]}
                  onChange={(event) =>
                    setPhoneSegments((prev) => updatePhoneSegment(prev, 1, event.target.value))
                  }
                  required
                  placeholder="1234"
                  className="min-w-0 flex-1 rounded-lg text-center"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  id="profilePhone3"
                  type="tel"
                  inputMode="numeric"
                  value={phoneSegments[2]}
                  onChange={(event) =>
                    setPhoneSegments((prev) => updatePhoneSegment(prev, 2, event.target.value))
                  }
                  required
                  placeholder="5678"
                  className="min-w-0 flex-1 rounded-lg text-center"
                />
              </div>
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
      </UserSectionCard>

      <Button asChild variant="outline" size="lg" className="w-full rounded-xl">
        <Link to={buildPathWithShopId(ROUTES.userMypage, shopId)}>マイページへ戻る</Link>
      </Button>
    </section>
  )
}
