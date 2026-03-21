import { useEffect, useMemo, useState } from "react"
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock, UserRound } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { useAvailableTimeSlots } from "@/features/user/hooks/useAvailableTimeSlots"
import { useCustomerBookingRules } from "@/features/user/hooks/useCustomerBookingRules"
import { usePersistentReservationId } from "@/features/user/hooks/usePersistentReservationId"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import { useShiftAvailableDates } from "@/features/user/hooks/useShiftAvailableDates"
import { useUserReservation } from "@/features/user/hooks/useUserReservation"
import { useUserTrainers } from "@/features/user/hooks/useUserTrainers"
import { formatDateShortWithWeekday } from "@/lib/dateFormat"

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00`)
}

function toDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function shiftMonth(base: Date, diff: number) {
  return new Date(base.getFullYear(), base.getMonth() + diff, 1)
}

function createCalendarDays(
  monthBase: Date,
  earliestBookableDate: Date,
  latestBookableDate: Date,
  shiftDateSet: Set<string> | null,
) {
  const firstDay = new Date(monthBase.getFullYear(), monthBase.getMonth(), 1)
  const monthStartWeekday = firstDay.getDay()
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - monthStartWeekday)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const dateKey = toDateKey(dayStart)
    return {
      dateKey,
      day: date.getDate(),
      weekday: date.getDay(),
      isCurrentMonth: date.getMonth() === monthBase.getMonth(),
      hasAvailability:
        dayStart.getTime() >= earliestBookableDate.getTime() &&
        dayStart.getTime() <= latestBookableDate.getTime() &&
        (shiftDateSet === null || shiftDateSet.has(dateKey)),
    }
  })
}

export function UserSchedulePage() {
  const shopId = useShopId()
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as {
    mode?: string
    trainerId?: string
    trainerName?: string
    preferredMenuId?: string
    preferredMenuName?: string
    reservationId?: string
    isUpdatingExistingReservation?: boolean
  } | null) ?? null
  const mode = state?.mode ?? "omakase"
  const trainerId = state?.trainerId ?? ""
  const trainerName = state?.trainerName ?? ""
  const preferredMenuId = state?.preferredMenuId ?? ""
  const preferredMenuName = state?.preferredMenuName ?? ""
  const isUpdateFlow = state?.isUpdatingExistingReservation === true
  const stateReservationId = (state?.reservationId ?? "").trim()
  const persistentReservationId = usePersistentReservationId()
  const reservationId = isUpdateFlow
    ? (stateReservationId || persistentReservationId).trim()
    : ""
  const { trainers } = useUserTrainers(shopId)
  const { reservation: currentReservation } = useUserReservation(reservationId, shopId)
  const selectedTrainer =
    mode === "nomination" ? trainers.find((trainer) => trainer.id === trainerId) : undefined

  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date())
  const [currentReservationDate, setCurrentReservationDate] = useState("")
  const [currentReservationTime, setCurrentReservationTime] = useState("")
  const bookingRules = useCustomerBookingRules(shopId)
  const shiftAvailableDates = useShiftAvailableDates(
    displayMonth,
    shopId,
    mode === "nomination" ? trainerId : undefined,
  )
  const availableTimeSlots = useAvailableTimeSlots(
    selectedDate,
    shopId,
    mode === "nomination" ? trainerId : undefined,
    isUpdateFlow && reservationId ? reservationId : undefined,
  )

  const earliestBookableDate = useMemo(() => {
    const now = new Date()
    const offset = bookingRules.allowSameDay ? 0 : 1
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
  }, [bookingRules.allowSameDay])
  const latestBookableDate = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + bookingRules.maxAdvanceDays)
  }, [bookingRules.maxAdvanceDays])
  const shiftDateSet = useMemo(() => {
    if (!shiftAvailableDates) return null
    return new Set(shiftAvailableDates)
  }, [shiftAvailableDates])
  const calendarDays = useMemo(
    () => createCalendarDays(displayMonth, earliestBookableDate, latestBookableDate, shiftDateSet),
    [displayMonth, earliestBookableDate, latestBookableDate, shiftDateSet],
  )
  const monthLabel = `${displayMonth.getFullYear()}年${displayMonth.getMonth() + 1}月`

  useEffect(() => {
    if (!reservationId) {
      setCurrentReservationDate("")
      setCurrentReservationTime("")
      return
    }

    if (!currentReservation) return
    setCurrentReservationDate(currentReservation.date)
    setCurrentReservationTime(currentReservation.time)
    setSelectedDate(currentReservation.date)
    setSelectedTime("")
    setDisplayMonth(new Date(`${currentReservation.date}T00:00:00`))
  }, [reservationId, currentReservation])

  const canProceed = Boolean(selectedDate && selectedTime)

  function handleDateSelect(dateKey: string) {
    setSelectedDate(dateKey)
    setSelectedTime("")
    setDisplayMonth(
      new Date(parseDateKey(dateKey).getFullYear(), parseDateKey(dateKey).getMonth(), 1),
    )
  }

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(buildPathWithShopId(ROUTES.userHome, shopId))
  }

  return (
    <section className="space-y-5">
      {selectedTrainer ? (
        <div className="rounded-2xl bg-white p-5 shadow-lg">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            指名トレーナー
          </p>
          <div className="flex items-center gap-4">
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-slate-100 bg-slate-100 shadow-sm">
              <UserRound className="size-7 text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{selectedTrainer.name}</p>
              <p className="text-sm text-muted-foreground">{selectedTrainer.specialty}</p>
            </div>
          </div>
        </div>
      ) : null}

      <UserSectionCard title="日時選択" className="overflow-hidden">
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => setDisplayMonth((prev) => shiftMonth(prev, -1))}
              aria-label="前の月へ移動"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <p className="text-sm font-bold text-foreground">{monthLabel}</p>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => setDisplayMonth((prev) => shiftMonth(prev, 1))}
              aria-label="次の月へ移動"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <div className="mb-1 grid grid-cols-7">
            {WEEKDAY_LABELS.map((weekday, index) => (
              <p
                key={weekday}
                className={`py-2 text-center text-[11px] font-bold ${
                  index === 0
                    ? "text-red-400"
                    : index === 6
                      ? "text-blue-400"
                      : "text-muted-foreground"
                }`}
              >
                {weekday}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const isSelected = selectedDate === day.dateKey
              const isCurrentReservationDate = reservationId && currentReservationDate === day.dateKey
              const isSunday = day.weekday === 0
              const isSaturday = day.weekday === 6

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  disabled={!day.hasAvailability}
                  onClick={() => handleDateSelect(day.dateKey)}
                  className={`relative flex h-11 flex-col items-center justify-center rounded-xl text-sm transition ${
                    isSelected
                      ? "bg-slate-900 font-bold text-white shadow-sm"
                      : isCurrentReservationDate
                        ? "bg-emerald-100 font-semibold text-emerald-700 ring-1 ring-emerald-300"
                      : day.hasAvailability
                        ? `bg-white font-medium hover:bg-slate-100 ${
                            isSunday
                              ? "text-red-500"
                              : isSaturday
                                ? "text-blue-500"
                                : "text-foreground"
                          }`
                        : "text-slate-300"
                  } ${!day.isCurrentMonth ? "opacity-30" : ""}`}
                >
                  {day.day}
                  {day.hasAvailability && !isSelected ? (
                    <span className="absolute bottom-1.5 size-1 rounded-full bg-emerald-500" />
                  ) : null}
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            {bookingRules.allowSameDay
              ? `当日予約可（開始${bookingRules.bookingDeadlineMinutes}分前まで） / ${bookingRules.maxAdvanceDays}日先まで受付`
              : `翌日以降（${bookingRules.maxAdvanceDays}日先まで） / 締切: 開始${bookingRules.bookingDeadlineMinutes}分前`}
          </p>
        </div>
      </UserSectionCard>

      <div className="rounded-2xl bg-white shadow-lg">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <Clock className="size-4 text-muted-foreground" />
          <h3 className="font-bold text-foreground">
            {selectedDate
              ? `${formatDateShortWithWeekday(selectedDate)} の予約可能な日時`
              : "日付を選択してください"}
          </h3>
        </div>
        <div className="p-5">
          {availableTimeSlots.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {availableTimeSlots.map((slot) => {
                const isTimeSelected = selectedTime === slot.time
                const isCurrentReservationTime =
                  Boolean(reservationId) &&
                  selectedDate === currentReservationDate &&
                  currentReservationTime === slot.time
                const isDisabled = !slot.selectable && !isCurrentReservationTime
                return (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    disabled={isDisabled}
                    className={`rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
                      isTimeSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : isCurrentReservationTime
                          ? "bg-emerald-100 font-semibold text-emerald-700 ring-1 ring-emerald-300"
                        : isDisabled
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                          : "border-slate-200 bg-white text-foreground hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {slot.time}
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <CalendarDays className="mb-2 size-8 text-slate-300" />
              <p className="text-sm text-muted-foreground">
                {selectedDate
                  ? "この日の予約可能枠はありません。"
                  : "上のカレンダーから日付を選択してください。"}
              </p>
            </div>
          )}
        </div>
      </div>

      {canProceed ? (
        <Button
          type="button"
          size="lg"
          className="w-full rounded-xl text-base"
          onClick={() =>
            navigate(buildPathWithShopId(ROUTES.userReservationInput, shopId), {
              state: {
                mode,
                date: selectedDate,
                time: selectedTime,
                trainerId: trainerId || selectedTrainer?.id || "",
                trainerName: trainerName || selectedTrainer?.name || "",
                preferredMenuId: preferredMenuId || undefined,
                preferredMenuName: preferredMenuName || undefined,
                ...(isUpdateFlow && reservationId ? { reservationId } : {}),
                isUpdatingExistingReservation: isUpdateFlow,
              },
            })
          }
        >
          予約情報入力へ進む
          <ArrowRight className="ml-1 size-4" />
        </Button>
      ) : null}
      <Button type="button" variant="outline" size="lg" className="w-full rounded-xl" onClick={handleBack}>
        前の画面へ戻る
      </Button>
    </section>
  )
}
