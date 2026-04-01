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
import { getStaffById } from "@/features/admin/api/staffApi"
import { hasConfirmedOverlapForAssignee } from "@/features/admin/lib/reservationOverlap"
import { X } from "lucide-react"

interface ReservationDetailCardProps {
  reservation: Reservation
  staffList?: Staff[]
  /** 担当者の空き判定用（この予約以外の重複を見る） */
  reservations?: Reservation[]
  onClose: () => void
  /** 指定時はメモを管理者が編集可能 */
  onUpdateMemo?: (memo: string | undefined) => void
  /** 指定時はステータスを編集可能（変更時は確認後に呼ぶ） */
  onUpdateStatus?: (status: "CONFIRMED" | "CANCELLED") => void
  /** 指定時は担当者を編集可能（変更時は確認後に呼ぶ） */
  onUpdateAssignee?: (assigneeId: string) => void
}

export function ReservationDetailCard({
  reservation,
  staffList = [],
  reservations = [],
  onClose,
  onUpdateMemo,
  onUpdateStatus,
  onUpdateAssignee,
}: ReservationDetailCardProps) {
  const startDate = new Date(reservation.startAt)
  const assignee = staffList.length > 0 ? getStaffById(reservation.assigneeId, staffList) : undefined
  const effectiveStatus: "CONFIRMED" | "CANCELLED" =
    reservation.status === "CANCELLED" ? "CANCELLED" : "CONFIRMED"

  /** この時間帯にほかの確定予約がなければ選択可。現在の担当は常に可。 */
  const canSelectStaffForSlot = (staffId: string) =>
    staffId === reservation.assigneeId ||
    !hasConfirmedOverlapForAssignee(
      reservations,
      staffId,
      reservation.startAt,
      reservation.endAt,
      reservation.id,
    )

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
  const [statusDraft, setStatusDraft] = useState<"CONFIRMED" | "CANCELLED">(effectiveStatus)
  const [statusConfirm, setStatusConfirm] = useState<"CONFIRMED" | "CANCELLED" | null>(null)
  const [editingAssignee, setEditingAssignee] = useState(false)
  const [assigneeDraft, setAssigneeDraft] = useState(reservation.assigneeId)
  const [assigneeConfirm, setAssigneeConfirm] = useState<string | null>(null)
  const [assigneeSlotError, setAssigneeSlotError] = useState("")

  useEffect(() => {
    if (!editingMemo) {
      setMemoDraft(reservation.memo ?? "")
    }
  }, [reservation.memo, reservation.id, editingMemo])

  useEffect(() => {
    if (!editingStatus) {
      setStatusDraft(effectiveStatus)
    }
  }, [reservation.status, reservation.id, editingStatus, effectiveStatus])

  useEffect(() => {
    if (!editingAssignee) {
      setAssigneeDraft(reservation.assigneeId)
    }
  }, [reservation.assigneeId, reservation.id, editingAssignee])

  const openAssigneeEdit = () => {
    setAssigneeSlotError("")
    const inList = staffList.some((s) => s.id === reservation.assigneeId)
    if (inList) {
      setAssigneeDraft(reservation.assigneeId)
    } else {
      const firstOk = staffList.find((s) => canSelectStaffForSlot(s.id))
      setAssigneeDraft(firstOk?.id ?? staffList[0]?.id ?? "")
    }
    setEditingAssignee(true)
  }

  return (
    <Card className="w-full border-border shadow-md sm:max-w-md">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-base">予約詳細</CardTitle>
        <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={onClose} aria-label="閉じる">
          <X className="size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground">予約ID</p>
          <p className="font-mono">{reservation.id}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">お客様名</p>
          <p>{reservation.customerName}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">メニュー</p>
          <p>{reservation.menuName?.trim() ? reservation.menuName : "—"}</p>
        </div>
        {reservation.customerPhone?.trim() ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground">電話番号</p>
            <p className="tabular-nums">{reservation.customerPhone.trim()}</p>
          </div>
        ) : null}
        <div>
          <p className="text-xs font-medium text-muted-foreground">メールアドレス</p>
          <p>{reservation.customerEmail}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">日時</p>
          <p>
            {formatDateJa(startDate)} {formatTime(reservation.startAt)} ～ {formatTime(reservation.endAt)}
          </p>
          <p className="mt-0.5 text-muted-foreground">
            所要時間 {formatReservationDurationJa(reservation.startAt, reservation.endAt)}
          </p>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">担当者</p>
            {onUpdateAssignee && staffList.length > 0 && !editingAssignee && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-md px-2 text-xs"
                onClick={openAssigneeEdit}
              >
                編集
              </Button>
            )}
          </div>
          {onUpdateAssignee && staffList.length > 0 && editingAssignee ? (
            <div className="space-y-2">
              <Label htmlFor="reservation-assignee-edit" className="sr-only">
                担当者を変更
              </Label>
              <select
                id="reservation-assignee-edit"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={
                  staffList.some(
                    (s) => s.id === assigneeDraft && canSelectStaffForSlot(s.id),
                  )
                    ? assigneeDraft
                    : (staffList.find((s) => canSelectStaffForSlot(s.id))?.id ??
                        staffList[0]?.id ??
                        "")
                }
                onChange={(e) => {
                  setAssigneeSlotError("")
                  setAssigneeDraft(e.target.value)
                }}
              >
                {staffList.map((s) => {
                  const selectable = canSelectStaffForSlot(s.id)
                  return (
                    <option
                      key={s.id}
                      value={s.id}
                      disabled={!selectable}
                      title={
                        !selectable
                          ? "この時間帯にはすでにほかの確定予約があります"
                          : undefined
                      }
                    >
                      {s.name}
                      {!selectable ? "（選択不可・予約あり）" : ""}
                    </option>
                  )
                })}
              </select>
              <p className="text-xs text-muted-foreground">
                この予約の時間帯に、すでに確定予約が入っている担当者は選択できません。
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
                  onClick={() => {
                    setAssigneeSlotError("")
                    if (assigneeDraft === reservation.assigneeId) {
                      setEditingAssignee(false)
                      return
                    }
                    if (!canSelectStaffForSlot(assigneeDraft)) {
                      const nm =
                        getStaffById(assigneeDraft, staffList)?.name ?? assigneeDraft
                      setAssigneeSlotError(
                        `「${nm}」はすでに予約が入っているため、変更できません`,
                      )
                      return
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
          ) : assignee ? (
            <p className="flex items-center gap-2">
              <span
                className="inline-block size-3 shrink-0 rounded-full"
                style={{ backgroundColor: assignee.color }}
              />
              {assignee.name}
            </p>
          ) : (
            <p className="text-muted-foreground">
              （スタッフ一覧にない担当: {reservation.assigneeId}）
            </p>
          )}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">ステータス</p>
            {onUpdateStatus && !editingStatus && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-md px-2 text-xs"
                onClick={() => {
                  setStatusDraft(effectiveStatus)
                  setEditingStatus(true)
                }}
              >
                編集
              </Button>
            )}
          </div>
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
                  setStatusDraft(e.target.value as "CONFIRMED" | "CANCELLED")
                }
              >
                <option value="CONFIRMED">確定</option>
                <option value="CANCELLED">キャンセル</option>
              </select>
              <p className="text-xs text-muted-foreground">
                「キャンセル」にするとカレンダーから非表示になり、キャンセル一覧に表示されます。
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-md"
                  onClick={() => {
                    if (statusDraft === effectiveStatus) {
                      setEditingStatus(false)
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
                    setStatusDraft(effectiveStatus)
                    setEditingStatus(false)
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          ) : (
            <p>
              {effectiveStatus === "CANCELLED" ? "キャンセル" : "確定"}
            </p>
          )}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">メモ</p>
            {onUpdateMemo && !editingMemo && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 rounded-md px-2 text-xs"
                onClick={() => {
                  setMemoDraft(reservation.memo ?? "")
                  setEditingMemo(true)
                }}
              >
                編集
              </Button>
            )}
          </div>
          {onUpdateMemo && editingMemo ? (
            <div className="space-y-2">
              <Label htmlFor="reservation-memo-edit" className="sr-only">
                メモを編集
              </Label>
              <textarea
                id="reservation-memo-edit"
                className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={memoDraft}
                onChange={(e) => setMemoDraft(e.target.value)}
                placeholder="メモを入力（空にすると削除）"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-md"
                  onClick={() => {
                    const t = memoDraft.trim()
                    onUpdateMemo(t || undefined)
                    setEditingMemo(false)
                  }}
                >
                  保存
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
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">予約作成日時</p>
          <p>{new Date(reservation.createdAt).toLocaleString("ja-JP")}</p>
        </div>
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
                {statusConfirm === "CANCELLED"
                  ? "この予約を「キャンセル」に変更しますか？"
                  : "この予約を「確定」に変更しますか？"}
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
                  onClick={() => {
                    onUpdateStatus(statusConfirm)
                    setStatusConfirm(null)
                    setEditingStatus(false)
                  }}
                >
                  はい
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
                  onClick={() => {
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
                    onUpdateAssignee(assigneeConfirm)
                    setAssigneeConfirm(null)
                    setEditingAssignee(false)
                    setAssigneeSlotError("")
                  }}
                >
                  はい
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  )
}
