import {
  CalendarDays,
  Clock,
  CreditCard,
  MessageSquare,
  UserRound,
} from "lucide-react"

import type { ReservationInputData } from "@/features/user/pages/UserReservationInputPage"
import { formatDateLongWithWeekday } from "@/lib/dateFormat"
import { isCompletePhoneSegments, joinPhoneSegments, parsePhoneToSegments } from "@/lib/phone"

function splitFullName(fullName: string): { lastName: string; firstName: string } {
  const trimmed = fullName.trim()
  if (!trimmed) return { lastName: "", firstName: "" }
  const [lastName, ...rest] = trimmed.split(/\s+/)
  return { lastName: lastName ?? "", firstName: rest.join(" ") }
}

type Props = {
  data: ReservationInputData
  displayPriceText: string
  expectedTimeRange: string
}

export function ReservationInputReviewSummary({ data, displayPriceText, expectedTimeRange }: Props) {
  const { lastName, firstName } = splitFullName(data.fullName)
  const phoneSegments = parsePhoneToSegments(data.phone)
  const displayMenuName = data.menuName?.trim() || "未定"

  return (
    <>
      <div className="space-y-1 border-b border-slate-100 px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">予約情報</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">日付</p>
              <p className="text-sm font-semibold text-foreground">
                {data.date ? formatDateLongWithWeekday(data.date) : "未選択"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">想定時間</p>
              <p className="text-sm font-semibold text-foreground">{expectedTimeRange}</p>
            </div>
          </div>
        </div>
        {data.mode === "nomination" ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100">
              <UserRound className="size-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">指名トレーナー</p>
              <p className="text-sm font-semibold text-foreground">
                {data.trainerName?.trim() || "未入力"}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">予約モード</p>
              <p className="text-sm font-semibold text-foreground">おまかせ</p>
            </div>
          </div>
        )}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-[11px] text-muted-foreground">メニュー</p>
              <p className="truncate text-sm font-semibold text-foreground">{displayMenuName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <CreditCard className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">料金</p>
              <p className="text-sm font-semibold text-foreground">{displayPriceText}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5 border-b border-slate-100 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">予約者情報</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">姓</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-foreground">
              {lastName || "未入力"}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">名</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-foreground">
              {firstName || "未入力"}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">メールアドレス</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-foreground">
              {data.email || "未入力"}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-foreground">電話番号</p>
            {isCompletePhoneSegments(phoneSegments) ? (
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-foreground">
                  {phoneSegments[0]}
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-foreground">
                  {phoneSegments[1]}
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-foreground">
                  {phoneSegments[2]}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-foreground">
                {joinPhoneSegments(phoneSegments) || "未入力"}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 border-b border-slate-100 px-6 py-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">ご要望・備考</p>
        </div>
        <div className="min-h-[4.5rem] w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-foreground">
          {data.note?.trim() ? data.note : "（なし）"}
        </div>
      </div>
    </>
  )
}
