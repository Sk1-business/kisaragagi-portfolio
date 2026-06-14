import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Reservation } from "@/features/admin/types/reservation"
import type { Staff } from "@/features/admin/types/staff"
import {
  formatTime,
  formatDateJa,
  formatReservationDurationJa,
} from "@/features/admin/lib/calendarUtils"
import {
  getReservationAssigneeDisplayName,
  getStaffById,
  isSameReservationTrainer,
  reservationStaffMatchesReservation,
  resolveReservationStaffIdForUi,
} from "@/features/admin/api/staffApi"
import { getReservationTrainerColor } from "@/features/admin/hooks/useStaff"
import { hasConfirmedOverlapForAssignee } from "@/features/admin/lib/reservationOverlap"
import {
  type AdminReservationApiStatus,
  adminReservationApiStatusLabel,
  mapReservationStatusToApiStatus,
} from "@/features/admin/api/reservationsApi"
interface ReservationDetailCardProps {
  reservation: Reservation
  staffList?: Staff[]
  /** 担当者の空き判定用（この予約以外の重複を見る） */
  reservations?: Reservation[]
  /** 指定時はメモを管理者が編集可能（非同期可・失敗時は編集を閉じない） */
  onUpdateMemo?: (memo: string | undefined) => void | Promise<void>
  /**
   * 指定時はステータスを編集可能（変更時は確認後に呼ぶ）。
   * `PATCH /api/admin/reservations/{id}/status` 用の値（BOOKED / DONE / NOSHOW / CANCELED）
   */
  onUpdateStatus?: (status: AdminReservationApiStatus) => void | Promise<void>
  /** 指定時は担当者を編集可能（非同期可・失敗時は確認を閉じない） */
  onUpdateAssignee?: (assigneeId: string) => void | Promise<void>
  /** メモ保存 API 実行中 */
  memoSaving?: boolean
  /** ステータス変更 API 実行中 */
  statusSaving?: boolean
  /** 担当者変更 API 実行中 */
  assigneeSaving?: boolean
  /**
   * 各スタッフが予約日・予約時間帯にシフトを持つか（GET …/trainers/{id}/shifts）。
   * 未指定のときはシフトによる制限を行わない。
   */
  shiftCoverageByStaffId?: Record<string, boolean>
  /** シフト一覧取得中 */
  shiftCoverageLoading?: boolean
  /** シフト取得失敗 */
  shiftCoverageError?: boolean
}

export function ReservationDetailCard({
  reservation,
  staffList = [],
  reservations = [],
  onUpdateMemo,
  onUpdateStatus,
  onUpdateAssignee,
  memoSaving = false,
  statusSaving = false,
  assigneeSaving = false,
  shiftCoverageByStaffId,
  shiftCoverageLoading = false,
  shiftCoverageError = false,
}: ReservationDetailCardProps) {
  const startDate = new Date(reservation.startAt)
  const currentApiStatus = mapReservationStatusToApiStatus(reservation.status)
  const isDoneReservation = currentApiStatus === "DONE"
  const nowMs = Date.now()
  const startMs = new Date(reservation.startAt).getTime()
  const endMs = new Date(reservation.endAt).getTime()
  const reservationNotStarted = Number.isFinite(startMs) && startMs > nowMs
  const reservationEnded = Number.isFinite(endMs) && endMs < nowMs

  const canSelectStatus = (status: AdminReservationApiStatus): boolean => {
    if (reservationNotStarted) {
      return status === "BOOKED" || status === "CANCELED"
    }
    if (reservationEnded && status === "BOOKED") return false
    return true
  }

  /** この時間帯にほかの確定予約がなければ選択可。現在の担当は常に可。 */
  const canSelectStaffForSlot = (staffId: string) =>
    isSameReservationTrainer(staffId, reservation) ||
    !hasConfirmedOverlapForAssignee(
      reservations,
      staffId,
      reservation.startAt,
      reservation.endAt,
      reservation.id,
    )

  /** シフトが予約時間を覆うか（未設定 API では制限しない）。現在の担当は常に可。 */
  const canSelectStaffByShift = (staffId: string) => {
    if (shiftCoverageByStaffId === undefined) return true
    if (isSameReservationTrainer(staffId, reservation)) return true
    if (shiftCoverageLoading) return false
    if (shiftCoverageError) return false
    return shiftCoverageByStaffId[staffId] === true
  }

  const canSelectStaffForAssignee = (staffId: string) =>
    canSelectStaffForSlot(staffId) && canSelectStaffByShift(staffId)

  const assigneeOptionTitle = (staffId: string): string | undefined => {
    if (isSameReservationTrainer(staffId, reservation)) return undefined
    if (!canSelectStaffForSlot(staffId)) {
      return "この時間帯にはすでにほかの確定予約があります"
    }
    if (shiftCoverageByStaffId === undefined) return undefined
    if (shiftCoverageLoading) return "シフトを確認しています…"
    if (shiftCoverageError) return "シフト情報を取得できませんでした"
    if (shiftCoverageByStaffId[staffId] !== true) {
      return "この日の予約時間帯にシフトが登録されていません"
    }
    return undefined
  }

  const assigneeHasOtherBookingInSlot = (staffId: string) =>
    hasConfirmedOverlapForAssignee(
      reservations,
      staffId,
      reservation.startAt,
      reservation.endAt,
      reservation.id,
    )

  const [editingMemo, setEditingMemo] = useState(false)
  const [memoDraft, setMemoDraft] = useState(reservation.memo ?? "")
  const [editingStatus, setEditingStatus] = useState(false)
  const [statusDraft, setStatusDraft] = useState<AdminReservationApiStatus>(() =>
    mapReservationStatusToApiStatus(reservation.status),
  )
  const [statusRuleError, setStatusRuleError] = useState("")
  const [statusConfirm, setStatusConfirm] = useState<AdminReservationApiStatus | null>(null)
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [assigneeDraft, setAssigneeDraft] = useState(() =>
    resolveReservationStaffIdForUi(reservation, staffList),
  )
  const [assigneeConfirm, setAssigneeConfirm] = useState<string | null>(null)
  const [assigneeSlotError, setAssigneeSlotError] = useState("")

  useEffect(() => {
    if (!editingMemo) {
      queueMicrotask(() => {
        setMemoDraft(reservation.memo ?? "")
      })
    }
  }, [reservation.memo, reservation.id, editingMemo])

  useEffect(() => {
    if (!editingStatus) {
      queueMicrotask(() => {
        setStatusDraft(mapReservationStatusToApiStatus(reservation.status))
        setStatusRuleError("")
      })
    }
  }, [reservation.status, reservation.id, editingStatus])

  useEffect(() => {
    if (!editingAssignee) {
      queueMicrotask(() => {
        setAssigneeDraft(resolveReservationStaffIdForUi(reservation, staffList))
      })
    }
  }, [reservation, editingAssignee, staffList])

  useEffect(() => {
    if (!isDoneReservation) return
    setEditingMemo(false)
    setEditingAssignee(false)
    setAssigneeConfirm(null)
    setAssigneeSlotError("")
  }, [isDoneReservation])

  /** シフト取得後などで選択が無効になったとき、表示と state を一致させる */
  useEffect(() => {
    if (!editingAssignee) return
    const effective = staffList.some(
      (s) => s.id === assigneeDraft && canSelectStaffForAssignee(s.id),
    )
      ? assigneeDraft
      : staffList.find((s) => canSelectStaffForAssignee(s.id))?.id ??
        resolveReservationStaffIdForUi(reservation, staffList)
    if (effective !== assigneeDraft) {
      queueMicrotask(() => {
        setAssigneeDraft(effective)
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- canSelectStaffForAssignee は reservation / staffList 由来の派生
  }, [
    editingAssignee,
    assigneeDraft,
    staffList,
    reservation.assigneeId,
    reservation.trainerId,
    reservation.id,
    reservation.startAt,
    reservation.endAt,
    shiftCoverageByStaffId,
    shiftCoverageLoading,
    shiftCoverageError,
    reservations,
  ])

  const openAssigneeEdit = () => {
    setAssigneeSlotError("")
    setAssigneeDraft(resolveReservationStaffIdForUi(reservation, staffList))
    setEditingAssignee(true)
  }

  return (
    <Card className="w-full border-border shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">予約詳細</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <dl className="divide-y divide-border">
          <div className="grid grid-cols-[8rem_1fr] gap-x-4 py-3 first:pt-0 sm:grid-cols-[10rem_1fr]">
            <dt className="text-xs font-medium text-muted-foreground pt-0.5">予約ID</dt>
            <dd className="font-mono text-xs break-all">{reservation.id}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-x-4 py-3 sm:grid-cols-[10rem_1fr]">
            <dt className="text-xs font-medium text-muted-foreground pt-0.5">お客様名</dt>
            <dd>{reservation.customerName}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-x-4 py-3 sm:grid-cols-[10rem_1fr]">
            <dt className="text-xs font-medium text-muted-foreground pt-0.5">メニュー</dt>
            <dd>{reservation.menuName?.trim() ? reservation.menuName : "—"}</dd>
          </div>
          {reservation.customerPhone?.trim() ? (
            <div className="grid grid-cols-[8rem_1fr] gap-x-4 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="text-xs font-medium text-muted-foreground pt-0.5">電話番号</dt>
              <dd className="tabular-nums">{reservation.customerPhone.trim()}</dd>
            </div>
          ) : null}
          <div className="grid grid-cols-[8rem_1fr] gap-x-4 py-3 sm:grid-cols-[10rem_1fr]">
            <dt className="text-xs font-medium text-muted-foreground pt-0.5">メールアドレス</dt>
            <dd className="break-all">{reservation.customerEmail}</dd>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-x-4 py-3 sm:grid-cols-[10rem_1fr]">
            <dt className="text-xs font-medium text-muted-foreground pt-0.5">日時</dt>
            <dd>
              <p>
                {formatDateJa(startDate)} {formatTime(reservation.startAt)} ～ {formatTime(reservation.endAt)}
              </p>
              <p className="mt-0.5 text-muted-foreground">
                所要時間 {formatReservationDurationJa(reservation.startAt, reservation.endAt)}
              </p>
            </dd>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-x-4">
            <div className="grid grid-cols-[8rem_1fr] gap-x-4 sm:contents">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-0.5">
                担当者
                {onUpdateAssignee &&
                  staffList.length > 0 &&
                  !editingAssignee &&
                  !isDoneReservation && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 rounded-md px-2 text-xs"
                    onClick={openAssigneeEdit}
                  >
                    編集
                  </Button>
                )}
              </dt>
              <dd>
          {onUpdateAssignee &&
          staffList.length > 0 &&
          editingAssignee &&
          !isDoneReservation ? (
            <div className="space-y-2">
              <Label htmlFor="reservation-assignee-edit" className="sr-only">
                担当者を変更
              </Label>
              <select
                id="reservation-assignee-edit"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={assigneeDraft}
                onChange={(e) => {
                  setAssigneeSlotError("")
                  setAssigneeDraft(e.target.value)
                }}
              >
                {staffList.map((s) => {
                  const selectable = canSelectStaffForAssignee(s.id)
                  const reason = assigneeOptionTitle(s.id)
                  return (
                    <option
                      key={s.id}
                      value={s.id}
                      disabled={!selectable}
                      title={reason}
                    >
                      {s.name}
                      {!selectable
                        ? !canSelectStaffForSlot(s.id)
                          ? "（選択不可・予約あり）"
                          : shiftCoverageLoading
                            ? "（選択不可・確認中）"
                            : shiftCoverageError
                              ? "（選択不可・シフト未取得）"
                              : "（選択不可・シフトなし）"
                        : ""}
                    </option>
                  )
                })}
              </select>
              {shiftCoverageError ? (
                <p className="text-xs text-destructive">
                  シフト情報を取得できませんでした。担当変更は現在の担当のままにしてください。
                </p>
              ) : null}
              {shiftCoverageLoading ? (
                <p className="text-xs text-muted-foreground">シフトを確認しています…</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                この予約の時間帯に、すでに確定予約が入っている担当者は選択できません。
                {shiftCoverageByStaffId !== undefined
                  ? " また、その日の予約時間にシフトが登録されていない担当者は選択できません。"
                  : null}
              </p>
              {assigneeSlotError && (
                <p className="text-sm text-destructive" role="alert">
                  {assigneeSlotError}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-md"
                  disabled={assigneeSaving}
                  onClick={() => {
                    setAssigneeSlotError("")
                    if (
                      reservationStaffMatchesReservation(
                        assigneeDraft,
                        reservation,
                        staffList,
                      )
                    ) {
                      setEditingAssignee(false)
                      return
                    }
                    const nm =
                      getStaffById(assigneeDraft, staffList)?.name ?? assigneeDraft
                    if (!canSelectStaffForSlot(assigneeDraft)) {
                      setAssigneeSlotError(
                        `「${nm}」はすでに予約が入っているため、変更できません`,
                      )
                      return
                    }
                    if (shiftCoverageByStaffId !== undefined) {
                      if (shiftCoverageLoading) {
                        setAssigneeSlotError(
                          "シフト情報を確認しています。しばらく待ってから再度お試しください。",
                        )
                        return
                      }
                      if (shiftCoverageError) {
                        setAssigneeSlotError(
                          "シフト情報を取得できませんでした。ネットワークを確認してください。",
                        )
                        return
                      }
                      if (!canSelectStaffByShift(assigneeDraft)) {
                        setAssigneeSlotError(
                          `「${nm}」はこの日の予約時間帯にシフトが登録されていないため、担当にできません`,
                        )
                        return
                      }
                    }
                    setAssigneeConfirm(assigneeDraft)
                  }}
                >
                  変更する
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-md"
                  onClick={() => {
                    setAssigneeSlotError("")
                    setAssigneeDraft(reservation.assigneeId)
                    setEditingAssignee(false)
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-2">
              <span
                className="inline-block size-3 shrink-0 rounded-full"
                style={{
                  backgroundColor: getReservationTrainerColor(reservation, staffList),
                }}
              />
              {getReservationAssigneeDisplayName(reservation, staffList)}
            </p>
          )}
              </dd>
            </div>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-x-4">
            <div className="grid grid-cols-[8rem_1fr] gap-x-4 sm:contents">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-0.5">
                ステータス
                {onUpdateStatus && !editingStatus && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 rounded-md px-2 text-xs"
                    onClick={() => {
                      setStatusRuleError("")
                      setStatusDraft(mapReservationStatusToApiStatus(reservation.status))
                      setEditingStatus(true)
                    }}
                  >
                    編集
                  </Button>
                )}
              </dt>
              <dd>
          {onUpdateStatus && editingStatus ? (
            <div className="space-y-2">
              <Label htmlFor="reservation-status-edit" className="sr-only">
                ステータスを変更
              </Label>
              <select
                id="reservation-status-edit"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={statusDraft}
                onChange={(e) =>
                  setStatusDraft(e.target.value as AdminReservationApiStatus)
                }
              >
                <option value="BOOKED" disabled={!canSelectStatus("BOOKED")}>予約確定</option>
                <option value="DONE" disabled={!canSelectStatus("DONE")}>完了</option>
                <option value="NOSHOW" disabled={!canSelectStatus("NOSHOW")}>
                  ノーショー（無断キャンセル）
                </option>
                <option value="CANCELED" disabled={!canSelectStatus("CANCELED")}>キャンセル</option>
              </select>
              <p className="text-xs text-muted-foreground">
                「キャンセル」にするとカレンダーから非表示になり、キャンセル一覧に表示されます。
              </p>
              {reservationNotStarted ? (
                <p className="text-xs text-muted-foreground">
                  予約開始前は「予約確定」または「キャンセル」のみ変更できます。
                </p>
              ) : null}
              {reservationEnded ? (
                <p className="text-xs text-muted-foreground">
                  予約終了後は「予約確定」へ戻すことはできません。
                </p>
              ) : null}
              {statusRuleError ? (
                <p className="text-sm text-destructive" role="alert">
                  {statusRuleError}
                </p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-md"
                  disabled={statusSaving}
                  onClick={() => {
                    if (statusDraft === currentApiStatus) {
                      setEditingStatus(false)
                      return
                    }
                    if (!canSelectStatus(statusDraft)) {
                      setStatusRuleError(
                        reservationNotStarted
                          ? "予約開始前は「予約確定」または「キャンセル」のみ選択できます。"
                          : "予約終了後は「予約確定」に戻せません。",
                      )
                      return
                    }
                    setStatusConfirm(statusDraft)
                  }}
                >
                  変更する
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-md"
                  onClick={() => {
                    setStatusDraft(mapReservationStatusToApiStatus(reservation.status))
                    setEditingStatus(false)
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <p>{adminReservationApiStatusLabel(currentApiStatus)}</p>
          )}
              </dd>
            </div>
          </div>
          <div className="py-3 sm:grid sm:grid-cols-[10rem_1fr] sm:gap-x-4">
            <div className="grid grid-cols-[8rem_1fr] gap-x-4 sm:contents">
              <dt className="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-0.5">
                メモ
                {onUpdateMemo && !editingMemo && !isDoneReservation && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 rounded-md px-2 text-xs"
                    onClick={() => {
                      setMemoDraft(reservation.memo ?? "")
                      setEditingMemo(true)
                    }}
                  >
                    編集
                  </Button>
                )}
              </dt>
              <dd>
          {onUpdateMemo && editingMemo && !isDoneReservation ? (
            <div className="space-y-2">
              <Label htmlFor="reservation-memo-edit" className="sr-only">
                メモを編集
              </Label>
              <textarea
                id="reservation-memo-edit"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={memoDraft}
                disabled={memoSaving}
                onChange={(e) => setMemoDraft(e.target.value)}
                placeholder="メモを入力（空にすると削除）"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-md"
                  disabled={memoSaving}
                  onClick={async () => {
                    const t = memoDraft.trim()
                    if (!onUpdateMemo) return
                    try {
                      await Promise.resolve(onUpdateMemo(t || undefined))
                      setEditingMemo(false)
                    } catch {
                      /* 親がエラー表示 */
                    }
                  }}
                >
                  {memoSaving ? "保存中…" : "保存"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-md"
                  onClick={() => {
                    setMemoDraft(reservation.memo ?? "")
                    setEditingMemo(false)
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-muted-foreground">
              {reservation.memo?.trim() ? reservation.memo : "（メモはありません）"}
            </p>
          )}
              </dd>
            </div>
          </div>
          <div className="grid grid-cols-[8rem_1fr] gap-x-4 py-3 last:pb-0 sm:grid-cols-[10rem_1fr]">
            <dt className="text-xs font-medium text-muted-foreground pt-0.5">予約作成日時</dt>
            <dd>{new Date(reservation.createdAt).toLocaleString("ja-JP")}</dd>
          </div>
        </dl>
      </CardContent>

      {statusConfirm && onUpdateStatus && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="status-confirm-title"
          onClick={() => setStatusConfirm(null)}
        >
          <Card
            className="w-full max-w-md border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="status-confirm-title" className="text-base">
                ステータス変更の確認
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                この予約のステータスを「
                <strong>
                  {statusConfirm ? adminReservationApiStatusLabel(statusConfirm) : ""}
                </strong>
                」に変更しますか？
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  onClick={() => setStatusConfirm(null)}
                >
                  いいえ
                </Button>
                <Button
                  type="button"
                  className="rounded-md"
                  disabled={statusSaving}
                  onClick={async () => {
                    if (!statusConfirm || !onUpdateStatus) return
                    try {
                      await Promise.resolve(onUpdateStatus(statusConfirm))
                      setStatusConfirm(null)
                      setEditingStatus(false)
                    } catch {
                      /* 親がエラー表示 */
                    }
                  }}
                >
                  {statusSaving ? "保存中…" : "はい"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {assigneeConfirm && onUpdateAssignee && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assignee-confirm-title"
          onClick={() => setAssigneeConfirm(null)}
        >
          <Card
            className="w-full max-w-md border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="assignee-confirm-title" className="text-base">
                担当者変更の確認
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                担当者を「
                <strong>
                  {getStaffById(assigneeConfirm, staffList)?.name ?? assigneeConfirm}
                </strong>
                」に変更しますか？
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  onClick={() => setAssigneeConfirm(null)}
                >
                  いいえ
                </Button>
                <Button
                  type="button"
                  className="rounded-md"
                  disabled={assigneeSaving}
                  onClick={async () => {
                    if (assigneeHasOtherBookingInSlot(assigneeConfirm)) {
                      const nm =
                        getStaffById(assigneeConfirm, staffList)?.name ??
                        assigneeConfirm
                      setAssigneeConfirm(null)
                      setAssigneeSlotError(
                        `「${nm}」はすでに予約が入っているため、変更できません`,
                      )
                      return
                    }
                    if (shiftCoverageByStaffId !== undefined && assigneeConfirm !== reservation.assigneeId) {
                      if (!canSelectStaffByShift(assigneeConfirm)) {
                        const nm =
                          getStaffById(assigneeConfirm, staffList)?.name ??
                          assigneeConfirm
                        setAssigneeConfirm(null)
                        setAssigneeSlotError(
                          `「${nm}」はこの日の予約時間帯にシフトが登録されていないため、担当にできません`,
                        )
                        return
                      }
                    }
                    if (!onUpdateAssignee) return
                    try {
                      await Promise.resolve(onUpdateAssignee(assigneeConfirm))
                      setAssigneeConfirm(null)
                      setEditingAssignee(false)
                      setAssigneeSlotError("")
                    } catch {
                      /* 親がエラー表示 */
                    }
                  }}
                >
                  {assigneeSaving ? "保存中…" : "はい"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}
