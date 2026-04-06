import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import {
  fetchTrainerShifts,
  groupTrainerShiftRowsByDate,
} from "@/features/admin/api/trainerShiftsApi"
import {
  fetchAdminReservationById,
  putAdminReservationNotes,
  putAdminReservationTrainerId,
} from "@/features/admin/api/reservationsApi"
import { ReservationDetailCard } from "@/features/admin/components/ReservationDetailCard"
import {
  ADMIN_CALENDAR_TIME_ZONE,
  getIsoDateKeyInTimeZone,
} from "@/features/admin/lib/calendarUtils"
import { reservationFullyWithinTrainerShifts } from "@/features/admin/lib/reservationShiftCoverage"
import { useAdminReservations } from "@/features/admin/context/AdminReservationsContext"
import { useStaff } from "@/features/admin/hooks/useStaff"
import type { Reservation } from "@/features/admin/types/reservation"

export function AdminReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    reservations,
    replaceReservations,
    updateReservationStatus,
  } = useAdminReservations()
  const reservationsRef = useRef(reservations)
  reservationsRef.current = reservations
  const { staffList, loading: staffLoading } = useStaff()

  const [detail, setDetail] = useState<Reservation | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [memoSaving, setMemoSaving] = useState(false)
  const [assigneeSaving, setAssigneeSaving] = useState(false)
  const [shiftCoverageByStaffId, setShiftCoverageByStaffId] = useState<
    Record<string, boolean>
  >({})
  const [shiftCoverageLoading, setShiftCoverageLoading] = useState(true)
  const [shiftCoverageError, setShiftCoverageError] = useState(false)

  const mergeReservationIntoList = (fresh: Reservation) => {
    const prev = reservationsRef.current
    replaceReservations(
      prev.some((r) => r.id === fresh.id)
        ? prev.map((r) => (r.id === fresh.id ? fresh : r))
        : [...prev, fresh],
    )
  }

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

  useEffect(() => {
    if (!detail || staffLoading) {
      if (!detail) {
        setShiftCoverageByStaffId({})
        setShiftCoverageLoading(false)
        setShiftCoverageError(false)
      }
      return
    }
    if (staffList.length === 0) {
      setShiftCoverageLoading(false)
      setShiftCoverageByStaffId({})
      return
    }
    let cancelled = false
    const dateKey = getIsoDateKeyInTimeZone(detail.startAt, ADMIN_CALENDAR_TIME_ZONE)

    void (async () => {
      setShiftCoverageLoading(true)
      setShiftCoverageError(false)
      try {
        const results = await Promise.all(
          staffList.map((s) =>
            fetchTrainerShifts(s.id, { dateFrom: dateKey, dateTo: dateKey }),
          ),
        )
        if (cancelled) return
        const next: Record<string, boolean> = {}
        staffList.forEach((s, i) => {
          const byDate = groupTrainerShiftRowsByDate(results[i], s.id)
          const dayRows = byDate[dateKey] ?? []
          next[s.id] = reservationFullyWithinTrainerShifts(
            detail.startAt,
            detail.endAt,
            dayRows,
          )
        })
        setShiftCoverageByStaffId(next)
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setShiftCoverageError(true)
        setShiftCoverageByStaffId({})
      } finally {
        if (!cancelled) setShiftCoverageLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [detail, staffList, staffLoading, navigate])

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

  const handleUpdateMemo = async (memo: string | undefined) => {
    setSaveError(null)
    setMemoSaving(true)
    try {
      await putAdminReservationNotes(
        detail.id,
        memo?.trim() ? memo.trim() : null,
      )
      const fresh = await fetchAdminReservationById(id, staffList)
      if (!fresh) {
        throw new Error("FETCH_FAILED")
      }
      setDetail(fresh)
      mergeReservationIntoList(fresh)
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        navigate(ROUTES.backofficeLogin, { replace: true })
        return
      }
      setSaveError("メモの保存に失敗しました。通信またはサーバーを確認してください。")
      throw e
    } finally {
      setMemoSaving(false)
    }
  }

  const handleUpdateAssignee = async (assigneeId: string) => {
    setSaveError(null)
    setAssigneeSaving(true)
    try {
      await putAdminReservationTrainerId(detail.id, assigneeId)
      const fresh = await fetchAdminReservationById(id, staffList)
      if (!fresh) {
        throw new Error("FETCH_FAILED")
      }
      setDetail(fresh)
      mergeReservationIntoList(fresh)
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        navigate(ROUTES.backofficeLogin, { replace: true })
        return
      }
      setSaveError(
        "担当者の変更に失敗しました。通信またはサーバーを確認してください。",
      )
      throw e
    } finally {
      setAssigneeSaving(false)
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

      {saveError ? (
        <p className="text-sm text-destructive" role="alert">
          {saveError}
        </p>
      ) : null}

      <ReservationDetailCard
        reservation={detail}
        staffList={staffList}
        reservations={reservationsForOverlap}
        onClose={() => navigate(-1)}
        onUpdateMemo={handleUpdateMemo}
        onUpdateStatus={(status) => updateReservationStatus(detail.id, status)}
        onUpdateAssignee={handleUpdateAssignee}
        memoSaving={memoSaving}
        assigneeSaving={assigneeSaving}
        shiftCoverageByStaffId={shiftCoverageByStaffId}
        shiftCoverageLoading={shiftCoverageLoading}
        shiftCoverageError={shiftCoverageError}
      />
    </div>
  )
}
