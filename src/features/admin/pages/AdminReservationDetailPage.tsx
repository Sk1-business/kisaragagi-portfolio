import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ReservationDetailCard } from "@/features/admin/components/ReservationDetailCard"
import { useAdminReservations } from "@/features/admin/context/AdminReservationsContext"
import { useStaff } from "@/features/admin/hooks/useStaff"

export function AdminReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    reservations,
    loading,
    updateReservationStatus,
    updateReservationMemo,
    updateReservationAssignee,
  } = useAdminReservations()
  const { staffList } = useStaff()

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
        reservations={reservations}
        onClose={() => navigate(-1)}
        onUpdateMemo={(memo) => updateReservationMemo(reservation.id, memo)}
        onUpdateStatus={(status) => updateReservationStatus(reservation.id, status)}
        onUpdateAssignee={(assigneeId) =>
          updateReservationAssignee(reservation.id, assigneeId)
        }
      />
    </div>
  )
}
