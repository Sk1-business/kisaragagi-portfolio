import { useMemo, useState } from "react"
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock, Star, UserRound } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import mockTrainers from "@/features/user/api/mockTrainers.json"
import { useShopId } from "@/features/user/hooks/useShopId"

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

function createCalendarDays(monthBase: Date, availableDateSet: Set<string>) {
  const firstDay = new Date(monthBase.getFullYear(), monthBase.getMonth(), 1)
  const monthStartWeekday = firstDay.getDay()
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - monthStartWeekday)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const dateKey = toDateKey(date)
    return {
      dateKey,
      day: date.getDate(),
      weekday: date.getDay(),
      isCurrentMonth: date.getMonth() === monthBase.getMonth(),
      hasAvailability: availableDateSet.has(dateKey),
    }
  })
}

export function UserSchedulePage() {
  const shopId = useShopId()
  const [searchParams] = useSearchParams()
  const mode = searchParams.get("mode") ?? "omakase"
  const trainerId = searchParams.get("trainerId") ?? ""
  const selectedTrainer =
    mode === "nomination" ? trainers.find((trainer) => trainer.id === trainerId) : undefined

  const availableDates = useMemo(() => {
    const source = selectedTrainer ? [selectedTrainer] : trainers
    return Array.from(new Set(source.flatMap((trainer) => trainer.availableDates))).sort((a, b) =>
      a.localeCompare(b),
    )
  }, [selectedTrainer])

  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [displayMonth, setDisplayMonth] = useState<Date>(new Date())

  const availableDateSet = useMemo(() => new Set(availableDates), [availableDates])
  const calendarDays = useMemo(
    () => createCalendarDays(displayMonth, availableDateSet),
    [displayMonth, availableDateSet],
  )
  const monthLabel = `${displayMonth.getFullYear()}年${displayMonth.getMonth() + 1}月`

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) {
      return []
    }

    const baseSlots = ["10:00", "11:30", "13:00", "14:30", "16:00", "18:30", "20:00"]
    const seedSource = `${selectedDate}-${selectedTrainer?.id ?? "omakase"}`
    const seed = seedSource.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)
    const count = 3 + (seed % 3)
    const startIndex = seed % (baseSlots.length - count)

    return baseSlots.slice(startIndex, startIndex + count)
  }, [selectedDate, selectedTrainer])

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
    return `${ROUTES.userReservationInput}?${params.toString()}`
  })()

  function handleDateSelect(dateKey: string) {
    setSelectedDate(dateKey)
    setSelectedTime("")
    setDisplayMonth(
      new Date(parseDateKey(dateKey).getFullYear(), parseDateKey(dateKey).getMonth(), 1),
    )
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
            緑のドットが予約可能な日付です
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
            <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
              {availableTimeSlots.map((time) => {
                const isTimeSelected = selectedTime === time
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`rounded-xl border px-4 py-3 text-center text-sm font-medium transition ${
                      isTimeSelected
                        ? "border-slate-900 bg-slate-900 text-white shadow-sm"
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
    </section>
  )
}
