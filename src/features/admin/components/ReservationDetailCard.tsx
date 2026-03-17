import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import type { Reservation } from "@/features/admin/types/reservation"
import type { Staff } from "@/features/admin/types/staff"
import { formatTime, formatDateJa } from "@/features/admin/lib/calendarUtils"
import { getStaffById } from "@/features/admin/api/staffApi"
import { X } from "lucide-react"

interface ReservationDetailCardProps {
  reservation: Reservation
  staffList?: Staff[]
  onClose: () => void
  /** 指定時はメモを管理者が編集可能 */
  onUpdateMemo?: (memo: string | undefined) => void
}

export function ReservationDetailCard({
  reservation,
  staffList = [],
  onClose,
  onUpdateMemo,
}: ReservationDetailCardProps) {
  const startDate = new Date(reservation.startAt)
  const assignee = staffList.length > 0 ? getStaffById(reservation.assigneeId, staffList) : undefined
  const [editingMemo, setEditingMemo] = useState(false)
  const [memoDraft, setMemoDraft] = useState(reservation.memo ?? "")

  useEffect(() => {
    if (!editingMemo) {
      setMemoDraft(reservation.memo ?? "")
    }
  }, [reservation.memo, reservation.id, editingMemo])

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
          <p className="text-xs font-medium text-muted-foreground">メールアドレス</p>
          <p>{reservation.customerEmail}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">日時</p>
          <p>
            {formatDateJa(startDate)} {formatTime(reservation.startAt)} ～ {formatTime(reservation.endAt)}
          </p>
        </div>
        {assignee && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">担当者</p>
            <p className="flex items-center gap-2">
              <span
                className="inline-block size-3 shrink-0 rounded-full"
                style={{ backgroundColor: assignee.color }}
              />
              {assignee.name}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs font-medium text-muted-foreground">ステータス</p>
          <p>
            {reservation.status === "CANCELLED"
              ? "キャンセル"
              : "確定"}
          </p>
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
    </Card>
  )
}
