import { type FormEvent, useEffect, useState } from "react"
import { CalendarDays, ChevronRight, Search, SearchX } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import {
  fetchReservationsByContact,
  formatPaymentStatusLabel,
  formatReservationExpectedTimeRange,
  type UserReservation,
} from "@/features/user/api/userReservationApi"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import { formatSlashDateTimeWithWeekday } from "@/lib/dateFormat"

export function UserReservationLookupPage() {
  const shopId = useShopId()
  const [params, setSearchParams] = useSearchParams()
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [reservations, setReservations] = useState<UserReservation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const currentEmail = params.get("email")?.trim() ?? ""
  const currentPhone = params.get("phone")?.trim() ?? ""
  const currentSearch = params.toString()

  useEffect(() => {
    setEmail(currentEmail)
    setPhone(currentPhone)
  }, [currentEmail, currentPhone])

  useEffect(() => {
    if (!currentEmail && !currentPhone) {
      setReservations([])
      setIsLoading(false)
      return
    }
    let mounted = true
    queueMicrotask(() => {
      setIsLoading(true)
      setError("")
      void fetchReservationsByContact({ shopSlug: shopId, email: currentEmail, phone: currentPhone })
        .then((result) => {
          if (!mounted) return
          setReservations(result)
          setIsLoading(false)
        })
        .catch((nextError: unknown) => {
          if (!mounted) return
          setReservations([])
          setError(nextError instanceof Error ? nextError.message : "予約照会に失敗しました。")
          setIsLoading(false)
        })
    })
    return () => {
      mounted = false
    }
  }, [currentEmail, currentPhone, shopId])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizedEmail = email.trim()
    const normalizedPhone = phone.trim()
    if (!normalizedEmail && !normalizedPhone) {
      setError("メールアドレスまたは電話番号を入力してください。")
      return
    }
    setError("")
    const nextParams = new URLSearchParams()
    if (normalizedEmail) nextParams.set("email", normalizedEmail)
    if (normalizedPhone) nextParams.set("phone", normalizedPhone)
    setSearchParams(nextParams)
  }

  return (
    <section className="space-y-5">
      <UserSectionCard
        title="予約確認・変更"
        subtitle="予約時に入力したメールアドレス、または電話番号で該当予約を検索できます。"
      >
        <form className="space-y-5 p-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="lookup-email">メールアドレス</Label>
            <Input
              id="lookup-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lookup-phone">電話番号</Label>
            <Input
              id="lookup-phone"
              type="tel"
              placeholder="09012345678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">どちらか一方の入力で照会できます。</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" size="lg" className="w-full rounded-xl">
            <Search className="size-4" />
            予約を検索する
          </Button>
        </form>
      </UserSectionCard>

      {(currentEmail || currentPhone) && (
        <UserSectionCard title="照会結果">
          <div className="space-y-4 p-6">
            {isLoading ? <p className="text-sm text-muted-foreground">読み込み中...</p> : null}
            {!isLoading && error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!isLoading && !error && reservations.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
                <SearchX className="size-8 text-slate-300" />
                <p className="mt-3 text-sm font-medium text-foreground">一致する予約は見つかりませんでした。</p>
                <p className="mt-1 text-xs text-muted-foreground">入力内容をご確認のうえ、もう一度お試しください。</p>
              </div>
            ) : null}
            {!isLoading && !error && reservations.length > 0 ? (
              <div className="space-y-3">
                {reservations.map((reservation) => (
                  <Link
                    key={reservation.id}
                    to={`${buildPathWithShopId(
                      ROUTES.userReservationDetail.replace(":id", reservation.id),
                      shopId,
                    )}${currentSearch ? `?${currentSearch}` : ""}`}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-100">
                      <CalendarDays className="size-5 text-slate-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">
                        {formatSlashDateTimeWithWeekday(reservation.date, reservation.time)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {reservation.menuName || "メニュー未設定"} / {formatReservationExpectedTimeRange(reservation.time, reservation.serviceEndAt)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        ステータス: {reservation.status === "upcoming" ? "予約済み" : reservation.status === "cancelled" ? "キャンセル済み" : "来店済み"} / 決済:{" "}
                        {formatPaymentStatusLabel(reservation.paymentRecordStatus ?? reservation.paymentStatus)}
                      </p>
                    </div>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </UserSectionCard>
      )}
    </section>
  )
}
