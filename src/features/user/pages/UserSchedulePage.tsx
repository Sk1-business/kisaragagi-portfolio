import { useEffect, useMemo, useState } from "react"
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock, Star, UserRound } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import mockTrainers from "@/features/user/api/mockTrainers.json"
import {
  fetchUserReservationById,
  fetchUserReservations,
} from "@/features/user/api/userReservationApi"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"

interface Trainer {
  id: string
  name: string
  specialty: string
  experienceYears: number
  rating: number
  nominationFee: number
  photoUrl: string
  availableDates: string[]
}

const trainers = mockTrainers as Trainer[]
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"]

function formatDateLabel(date: string) {
  const parsed = new Date(`${date}T00:00:00`)
  return `${parsed.getMonth() + 1}/${parsed.getDate()} (${WEEKDAY_LABELS[parsed.getDay()]})`
}

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

function buildReservationTimeSlots() {
  const slots: string[] = []
  for (let hour = 10; hour <= 22; hour += 1) {
    const hourLabel = String(hour).padStart(2, "0")
    slots.push(`${hourLabel}:00`)
    if (hour < 22) {
      slots.push(`${hourLabel}:30`)
    }
  }
  return slots
}

function createCalendarDays(monthBase: Date, earliestBookableDate: Date) {
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
      hasAvailability: dayStart.getTime() >= earliestBookableDate.getTime(),
    }
  })
}

export function UserSchedulePage() {
  const shopId = useShopId()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode") ?? "omakase"
  const trainerId = searchParams.get("trainerId") ?? ""
  const reservationId = searchParams.get("reservationId") ?? ""
  const selectedTrainer =
    mode === "nomination" ? trainers.find((trainer) => trainer.id === trainerId) : undefined

  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date())
  const [currentReservationDate, setCurrentReservationDate] = useState("")
  const [currentReservationTime, setCurrentReservationTime] = useState("")
  const [blockedTimeSet, setBlockedTimeSet] = useState<Set<string>>(new Set())
  const availableTimeSlots = useMemo(
    () => (selectedDate ? buildReservationTimeSlots() : []),
    [selectedDate],
  )

  const earliestBookableDate = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  }, [])
  const calendarDays = useMemo(
    () => createCalendarDays(displayMonth, earliestBookableDate),
    [displayMonth, earliestBookableDate],
  )
  const monthLabel = `${displayMonth.getFullYear()}年${displayMonth.getMonth() + 1}月`

  useEffect(() => {
    let mounted = true
    if (!reservationId) {
      setCurrentReservationDate("")
      setCurrentReservationTime("")
      return () => {
        mounted = false
      }
    }

    void fetchUserReservationById(reservationId).then((reservation) => {
      if (!mounted || !reservation) return
      setCurrentReservationDate(reservation.date)
      setCurrentReservationTime(reservation.time)
      setSelectedDate(reservation.date)
      setSelectedTime("")
      setDisplayMonth(new Date(`${reservation.date}T00:00:00`))
    })

    return () => {
      mounted = false
    }
  }, [reservationId])

  useEffect(() => {
    let mounted = true
    if (mode !== "nomination" || !trainerId || !selectedDate) {
      setBlockedTimeSet(new Set())
      return () => {
        mounted = false
      }
    }

    void fetchUserReservations()
      .then((reservations) => {
        if (!mounted) return
        const blockedTimes = reservations
          .filter((reservation) => {
            if (reservation.status !== "upcoming") return false
            if (reservation.date !== selectedDate) return false
            if (reservation.trainerId !== trainerId) return false
            if (reservationId && reservation.id === reservationId) return false
            return true
          })
          .map((reservation) => reservation.time)
        setBlockedTimeSet(new Set(blockedTimes))
      })
      .catch(() => {
        if (!mounted) return
        setBlockedTimeSet(new Set())
      })

    return () => {
      mounted = false
    }
  }, [mode, reservationId, selectedDate, trainerId])

  const confirmPath = (() => {
    if (!selectedDate || !selectedTime) {
      return ""
    }
    const params = new URLSearchParams()
    if (shopId) {
      params.set("shopId", shopId)
    }
    params.set("mode", mode)
    params.set("date", selectedDate)
    params.set("time", selectedTime)
    if (selectedTrainer) {
      params.set("trainerId", selectedTrainer.id)
    }
    if (reservationId) {
      params.set("reservationId", reservationId)
    }
    return `${ROUTES.userReservationInput}?${params.toString()}`
  })()

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
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              <Star className="size-3 fill-current" />
              {selectedTrainer.rating.toFixed(1)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 px-6 py-4 text-white">
          <CalendarDays className="size-5" />
          <h2 className="font-bold">日時選択</h2>
        </div>

        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="rounded-full"
              onClick={() => setDisplayMonth((prev) => shiftMonth(prev, -1))}
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
            翌日以降の日付を選択できます
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-lg">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <Clock className="size-4 text-muted-foreground" />
          <h3 className="font-bold text-foreground">
            {selectedDate
              ? `${formatDateLabel(selectedDate)} の予約可能な日時`
              : "日付を選択してください"}
          </h3>
        </div>
        <div className="p-5">
          {availableTimeSlots.length > 0 ? (
            <div className="grid grid-cols-5 gap-2">
              {availableTimeSlots.map((time) => {
                const isTimeSelected = selectedTime === time
                const isCurrentReservationTime = reservationId && currentReservationTime === time
                const isBlocked = blockedTimeSet.has(time) && !isCurrentReservationTime
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    disabled={isBlocked}
                    className={`rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
                      isTimeSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                        : isCurrentReservationTime
                          ? "bg-emerald-100 font-semibold text-emerald-700 ring-1 ring-emerald-300"
                        : isBlocked
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                        : "border-slate-200 bg-white text-foreground hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {time}
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

      {confirmPath ? (
        <Button asChild size="lg" className="w-full rounded-xl text-base">
          <Link to={confirmPath}>
            予約情報入力へ進む
            <ArrowRight className="ml-1 size-4" />
          </Link>
        </Button>
      ) : null}
      <Button type="button" variant="outline" size="lg" className="w-full rounded-xl" onClick={handleBack}>
        前の画面へ戻る
      </Button>
    </section>
  )
}
