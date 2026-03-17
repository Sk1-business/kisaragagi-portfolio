import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ReservationDetailCard } from "@/features/admin/components/ReservationDetailCard"
import { useAdminReservations } from "@/features/admin/context/AdminReservationsContext"
import { useStaff } from "@/features/admin/hooks/useStaff"

export function AdminReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { reservations, loading, updateReservationStatus, updateReservationMemo } =
    useAdminReservations()
  const { staffList } = useStaff()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const reservation = id ? reservations.find((r) => r.id === id) : undefined

  if (!id) {
    return (
      <p className="text-sm text-muted-foreground">
        予約IDが指定されていません。
      </p>
    )
  }

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground">
        予約詳細を読み込み中です...
      </p>
    )
  }

  if (!reservation) {
    return (
      <Card className="border-border shadow-xs">
        <CardContent className="py-6 text-sm text-muted-foreground">
          指定された予約が見つかりませんでした。
        </CardContent>
      </Card>
    )
  }

  const statusValue =
    reservation.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED"

  const handleStatusChange = (v: "CONFIRMED" | "CANCELLED") => {
    if (v === "CONFIRMED") {
      updateReservationStatus(reservation.id, "CONFIRMED")
      return
    }
    if (reservation.status === "CONFIRMED") {
      setShowCancelConfirm(true)
    }
  }

  return (
    <div className="space-y-4">
      <Button
        variant="outline"
        size="sm"
        className="rounded-md"
        onClick={() => navigate(-1)}
      >
        戻る
      </Button>

      <ReservationDetailCard
        reservation={reservation}
        staffList={staffList}
        onClose={() => navigate(-1)}
        onUpdateMemo={(memo) => updateReservationMemo(reservation.id, memo)}
      />

      <Card className="border-border shadow-xs">
        <CardContent className="space-y-3 py-4">
          <div className="space-y-2">
            <Label htmlFor="reservation-status">ステータス（スタッフ変更）</Label>
            <select
              id="reservation-status"
              className="flex h-9 w-full max-w-xs rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={statusValue}
              onChange={(e) => {
                const v = e.target.value as "CONFIRMED" | "CANCELLED"
                handleStatusChange(v)
              }}
            >
              <option value="CONFIRMED">確定</option>
              <option value="CANCELLED">キャンセル</option>
            </select>
            <p className="text-xs text-muted-foreground">
              「キャンセル」を選ぶと確認の後、予約カレンダーから非表示になりキャンセル一覧に表示されます。
            </p>
          </div>
        </CardContent>
      </Card>

      {showCancelConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cancel-confirm-title"
          onClick={() => setShowCancelConfirm(false)}
        >
          <Card
            className="w-full max-w-md border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="cancel-confirm-title" className="text-base">
                キャンセルの確認
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                本当にこの予約をキャンセルしますか？
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  いいえ
                </Button>
                <Button
                  type="button"
                  variant="default"
                  className="rounded-md"
                  onClick={() => {
                    updateReservationStatus(reservation.id, "CANCELLED")
                    setShowCancelConfirm(false)
                  }}
                >
                  はい
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
