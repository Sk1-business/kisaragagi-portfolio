import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ROUTES } from "@/constants/routes"
import {
  fetchTrainerShifts,
  groupTrainerShiftRowsByDate,
} from "@/features/admin/api/trainerShiftsApi"
import {
  type AdminReservationApiStatus,
  fetchAllReservationsForAdmin,
  fetchAdminReservationById,
  patchAdminReservationStatus,
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
import { useAdminProfile } from "@/features/auth/context/AdminProfileContext"
import { useStaff } from "@/features/admin/hooks/useStaff"
import type { Reservation } from "@/features/admin/types/reservation"

type ReservationEventLog = {
  timestamp: string
  actor: string
  action: "status_changed" | "memo_updated" | "assignee_changed"
  message: string
}

const RESERVATION_EVENT_LOGS_KEY = "saas_admin_reservation_event_logs_v1"

function loadReservationEventLogs(reservationId: string): ReservationEventLog[] {
  try {
    const raw = localStorage.getItem(RESERVATION_EVENT_LOGS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Record<string, ReservationEventLog[]>
    const list = parsed?.[reservationId]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

function appendReservationEventLog(reservationId: string, log: ReservationEventLog): void {
  try {
    const raw = localStorage.getItem(RESERVATION_EVENT_LOGS_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, ReservationEventLog[]>) : {}
    const prev = Array.isArray(parsed[reservationId]) ? parsed[reservationId] : []
    parsed[reservationId] = [log, ...prev].slice(0, 200)
    localStorage.setItem(RESERVATION_EVENT_LOGS_KEY, JSON.stringify(parsed))
    console.info("[admin-reservation-event]", {
      reservationId,
      ...log,
    })
  } catch {
    // ignore
  }
}

export function AdminReservationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { reservations, replaceReservations } = useAdminReservations()
  const profile = useAdminProfile()
  const reservationsRef = useRef(reservations)
  reservationsRef.current = reservations
  const { staffList, loading: staffLoading } = useStaff()

  const [detail, setDetail] = useState<Reservation | null>(null)
  const [detailLoading, setDetailLoading] = useState(true)
  const [detailError, setDetailError] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [memoSaving, setMemoSaving] = useState(false)
  const [statusSaving, setStatusSaving] = useState(false)
  const [assigneeSaving, setAssigneeSaving] = useState(false)
  const [assigneeValidationReservations, setAssigneeValidationReservations] = useState<
    Reservation[]
  >([])
  const [shiftCoverageByStaffId, setShiftCoverageByStaffId] = useState<
    Record<string, boolean>
  >({})
  const [shiftCoverageLoading, setShiftCoverageLoading] = useState(true)
  const [shiftCoverageError, setShiftCoverageError] = useState(false)
  const [eventLogs, setEventLogs] = useState<ReservationEventLog[]>([])

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
    if (!id) return
    setEventLogs(loadReservationEventLogs(id))
  }, [id])

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

  useEffect(() => {
    if (!detail || staffLoading) return
    let cancelled = false
    void (async () => {
      try {
        const all = await fetchAllReservationsForAdmin(staffList)
        if (cancelled) return
        setAssigneeValidationReservations(all)
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        // 判定用データが取得できない場合はサーバー側最終チェックに委譲
        setAssigneeValidationReservations([])
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
    if (detail.status === "COMPLETED") {
      setSaveError("完了済み予約のため、メモは変更できません。")
      return
    }
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
      const actor = profile.name.trim() || "管理者"
      const nextMemo = memo?.trim() ? memo.trim() : "（空）"
      const log: ReservationEventLog = {
        timestamp: new Date().toISOString(),
        actor,
        action: "memo_updated",
        message: `メモを更新: ${nextMemo}`,
      }
      appendReservationEventLog(detail.id, log)
      setEventLogs((prev) => [log, ...prev].slice(0, 200))
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

  const handleUpdateStatus = async (apiStatus: AdminReservationApiStatus) => {
    if (!detail || !id) return
    const nowMs = Date.now()
    const startMs = new Date(detail.startAt).getTime()
    const endMs = new Date(detail.endAt).getTime()
    const reservationNotStarted = Number.isFinite(startMs) && startMs > nowMs
    const reservationEnded = Number.isFinite(endMs) && endMs < nowMs
    if (reservationNotStarted && !(apiStatus === "BOOKED" || apiStatus === "CANCELED")) {
      setSaveError("予約開始前は「予約確定」または「キャンセル」のみ変更できます。")
      return
    }
    if (reservationEnded && apiStatus === "BOOKED") {
      setSaveError("予約終了後は「予約確定」に戻せません。")
      return
    }
    setSaveError(null)
    setStatusSaving(true)
    try {
      await patchAdminReservationStatus(detail.id, apiStatus)
      const fresh = await fetchAdminReservationById(id, staffList)
      if (!fresh) {
        throw new Error("FETCH_FAILED")
      }
      setDetail(fresh)
      mergeReservationIntoList(fresh)
      const actor = profile.name.trim() || "管理者"
      const log: ReservationEventLog = {
        timestamp: new Date().toISOString(),
        actor,
        action: "status_changed",
        message: `ステータスを ${apiStatus} に変更`,
      }
      appendReservationEventLog(detail.id, log)
      setEventLogs((prev) => [log, ...prev].slice(0, 200))
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        navigate(ROUTES.backofficeLogin, { replace: true })
        return
      }
      setSaveError(
        "ステータスの変更に失敗しました。通信またはサーバーを確認してください。",
      )
      throw e
    } finally {
      setStatusSaving(false)
    }
  }

  const handleUpdateAssignee = async (assigneeId: string) => {
    if (detail.status === "COMPLETED") {
      setSaveError("完了済み予約のため、担当者は変更できません。")
      return
    }
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
      const actor = profile.name.trim() || "管理者"
      const assigneeName =
        staffList.find((s) => s.id === assigneeId)?.name ?? assigneeId
      const log: ReservationEventLog = {
        timestamp: new Date().toISOString(),
        actor,
        action: "assignee_changed",
        message: `担当者を ${assigneeName} に変更`,
      }
      appendReservationEventLog(detail.id, log)
      setEventLogs((prev) => [log, ...prev].slice(0, 200))
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        navigate(ROUTES.backofficeLogin, { replace: true })
        return
      }
      setSaveError(
        e instanceof Error && e.message && e.message !== "FETCH_FAILED"
          ? `担当者の変更に失敗しました: ${e.message}`
          : "担当者の変更に失敗しました。通信またはサーバーを確認してください。",
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
        reservations={
          assigneeValidationReservations.length > 0
            ? assigneeValidationReservations
            : reservationsForOverlap
        }
        onClose={() => navigate(-1)}
        onUpdateMemo={handleUpdateMemo}
        onUpdateStatus={handleUpdateStatus}
        onUpdateAssignee={handleUpdateAssignee}
        memoSaving={memoSaving}
        statusSaving={statusSaving}
        assigneeSaving={assigneeSaving}
        shiftCoverageByStaffId={shiftCoverageByStaffId}
        shiftCoverageLoading={shiftCoverageLoading}
        shiftCoverageError={shiftCoverageError}
      />
      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base">操作ログ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {eventLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">この予約の操作ログはまだありません。</p>
          ) : (
            <ul className="space-y-2">
              {eventLogs.map((log, idx) => (
                <li key={`${log.timestamp}-${idx}`} className="rounded-md border border-border p-2 text-sm">
                  <p className="font-medium">{log.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString("ja-JP")} / {log.actor}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
