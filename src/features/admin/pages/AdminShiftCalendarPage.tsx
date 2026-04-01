import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStaff } from "@/features/admin/hooks/useStaff"
import { ShiftCalendarMonthView } from "@/features/admin/components/calendar/ShiftCalendarMonthView"
import { addMonths, startOfDay } from "@/features/admin/lib/calendarUtils"

export function AdminShiftCalendarPage() {
  const { staffList, loading: staffLoading } = useStaff()
  const [currentDate, setCurrentDate] = useState(() => startOfDay(new Date()))

  const goPrev = () => {
    setCurrentDate((d) => addMonths(d, -1))
  }

  const goNext = () => {
    setCurrentDate((d) => addMonths(d, 1))
  }

  const goToday = () => {
    setCurrentDate(startOfDay(new Date()))
  }

  const titleMonth = `${currentDate.getFullYear()}年 ${currentDate.getMonth() + 1}月`

  if (staffLoading) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-border shadow-xs">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">シフトカレンダー</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              各日に担当者ごとの担当可能時間（出社〜退勤の目安）を表示します。行をクリックすると編集できます（ブラウザに保存されます）。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={goPrev}
                aria-label="前の月へ"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-w-[120px]"
                onClick={goToday}
              >
                {titleMonth}
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8"
                onClick={goNext}
                aria-label="次の月へ"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {staffList.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              スタッフが登録されていません。スタッフ管理から担当者を追加してください。
            </p>
          ) : (
            <ShiftCalendarMonthView date={currentDate} staffList={staffList} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
