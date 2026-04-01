import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import { fetchAdminReservationById } from "@/features/admin/api/reservationsApi"
import { ReservationDetailCard } from "@/features/admin/components/ReservationDetailCard"
import { useAdminReservations } from "@/features/admin/context/AdminReservationsContext"
import { useStaff } from "@/features/admin/hooks/useStaff"
import type { Reservation } from "@/features/admin/types/reservation"

export function AdminReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    reservations,
    updateReservationStatus,
    updateReservationMemo,
    updateReservationAssignee,
  } = useAdminReservations()
  const { staffList, loading: staffLoading } = useStaff()

  const [detail, setDetail] = useState<Reservation | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState(false)

  useEffect(() => {
    if (!id || staffLoading) return
    let cancelled = false
    void (async () => {
      setDetailLoading(true)
      setDetailError(false)
      try {
        const r = await fetchAdminReservationById(id, staffList)
        if (cancelled) return
        setDetail(r)
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setDetailError(true)
        setDetail(null)
      } finally {
        if (!cancelled) setDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, staffList, staffLoading, navigate])

  const reservationsForOverlap = useMemo(() => {
    if (!detail) return reservations
    if (reservations.some((r) => r.id === detail.id)) return reservations
    return [...reservations, detail]
  }, [reservations, detail])

  if (!id) {
    return (
      <p className="text-sm text-muted-foreground">
        予約IDが指定されていません。
      </p>
    )
  }

  if (staffLoading || detailLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        予約詳細を読み込み中です...
      </p>
    )
  }

  if (detailError) {
    return (
      <Card className="border-border shadow-xs">
        <CardContent className="py-6 text-sm text-muted-foreground">
          予約詳細の取得に失敗しました。ネットワークまたはサーバーを確認してください。
        </CardContent>
      </Card>
    )
  }

  if (!detail) {
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
        reservation={detail}
        staffList={staffList}
        reservations={reservationsForOverlap}
        onClose={() => navigate(-1)}
        onUpdateMemo={(memo) => updateReservationMemo(detail.id, memo)}
        onUpdateStatus={(status) => updateReservationStatus(detail.id, status)}
        onUpdateAssignee={(assigneeId) =>
          updateReservationAssignee(detail.id, assigneeId)
        }
      />
    </div>
  )
}
