import { useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isStaffNameTaken } from "@/features/admin/api/staffApi"
import { useAdminReservations } from "@/features/admin/context/AdminReservationsContext"
import { useAdminStaff } from "@/features/admin/context/AdminStaffContext"
import type { Staff } from "@/features/admin/types/staff"
import type { Reservation } from "@/features/admin/types/reservation"

const COLOR_PRESETS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#64748b",
]

function normalizeHex(c: string): string {
  const t = c.trim()
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toLowerCase()
  if (/^[0-9A-Fa-f]{6}$/.test(t)) return `#${t.toLowerCase()}`
  return t
}

/** 現在時刻より後に終了する確定予約が当該担当に付いている */
function staffHasReservationFromNow(
  staffId: string,
  reservations: Reservation[],
  now: Date = new Date(),
): boolean {
  const t = now.getTime()
  return reservations.some(
    (r) =>
      r.assigneeId === staffId &&
      r.status === "CONFIRMED" &&
      new Date(r.endAt).getTime() > t,
  )
}

export function AdminStaffPage() {
  const { staffList, loading, addStaff, updateStaff, deleteStaff } = useAdminStaff()
  const { reservations } = useAdminReservations()

  const [formOpen, setFormOpen] = useState<"add" | { edit: Staff } | null>(null)
  const [formName, setFormName] = useState("")
  const [formColor, setFormColor] = useState("#6366f1")
  const [formError, setFormError] = useState("")

  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)
  const [pageError, setPageError] = useState("")

  const openAdd = () => {
    setFormError("")
    setPageError("")
    setFormName("")
    setFormColor(COLOR_PRESETS[staffList.length % COLOR_PRESETS.length])
    setFormOpen("add")
  }

  const openEdit = (s: Staff) => {
    setFormError("")
    setPageError("")
    setFormName(s.name)
    setFormColor(s.color)
    setFormOpen({ edit: s })
  }

  const closeForm = () => {
    setFormOpen(null)
    setFormError("")
  }

  const submitForm = () => {
    const color = normalizeHex(formColor)
    if (!/^#[0-9a-f]{6}$/i.test(color)) {
      setFormError("色は #RRGGBB 形式で入力してください")
      return
    }
    if (formOpen === "add") {
      if (isStaffNameTaken(staffList, formName)) {
        setFormError("すでに登録されている名前です")
        return
      }
      const created = addStaff({ name: formName, color })
      if (!created) {
        setFormError("名前を入力してください")
        return
      }
      closeForm()
      return
    }
    if (formOpen && typeof formOpen === "object" && "edit" in formOpen) {
      if (isStaffNameTaken(staffList, formName, formOpen.edit.id)) {
        setFormError("すでに登録されている名前です")
        return
      }
      const ok = updateStaff(formOpen.edit.id, { name: formName, color })
      if (!ok) {
        setFormError("保存できませんでした")
        return
      }
      closeForm()
    }
  }

  const openDelete = (s: Staff) => {
    setPageError("")
    const others = staffList.filter((x) => x.id !== s.id)
    if (others.length === 0) {
      setPageError("スタッフは少なくとも1名必要です")
      return
    }
    if (staffHasReservationFromNow(s.id, reservations)) {
      setPageError(
        `担当者「${s.name}」は予約が入っているため、削除できません`,
      )
      return
    }
    setDeleteTarget(s)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (staffHasReservationFromNow(deleteTarget.id, reservations)) {
      setPageError(
        `担当者「${deleteTarget.name}」は予約が入っているため、削除できません`,
      )
      setDeleteTarget(null)
      return
    }
    deleteStaff(deleteTarget.id)
    setDeleteTarget(null)
    setPageError("")
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          カレンダー・予約の担当表示に使うスタッフを管理します。
        </p>
        <Button type="button" size="sm" className="rounded-md" onClick={openAdd}>
          <Plus className="mr-1 size-4" />
          スタッフを追加
        </Button>
      </div>

      {pageError && (
        <p className="text-sm text-destructive" role="alert">
          {pageError}
        </p>
      )}

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg">スタッフ一覧</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[320px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">色</th>
                <th className="pb-2 pr-4 font-medium">名前</th>
                <th className="pb-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((s) => (
                <tr key={s.id} className="border-b border-border/60">
                  <td className="py-3 pr-4">
                    <span
                      className="inline-block size-6 rounded-full border border-border"
                      style={{ backgroundColor: s.color }}
                      title={s.color}
                    />
                  </td>
                  <td className="py-3 pr-4 font-medium">{s.name}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-md"
                        onClick={() => openEdit(s)}
                      >
                        <Pencil className="mr-1 size-3.5" />
                        編集
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-md text-destructive hover:bg-destructive/10"
                        onClick={() => openDelete(s)}
                      >
                        <Trash2 className="mr-1 size-3.5" />
                        削除
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-form-title"
          onClick={closeForm}
        >
          <Card
            className="w-full max-w-md border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="staff-form-title" className="text-base">
                {formOpen === "add" ? "スタッフを追加" : "スタッフを編集"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">名前</Label>
                <Input
                  id="staff-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例: 山田"
                  className="rounded-md"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="staff-color">表示色</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="staff-color"
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/i.test(formColor) ? formColor : "#6366f1"}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="size-10 cursor-pointer rounded border border-border bg-background"
                  />
                  <Input
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="max-w-[140px] rounded-md font-mono text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PRESETS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="size-7 rounded-full border-2 border-transparent ring-offset-2 transition-shadow hover:ring-2 hover:ring-ring"
                      style={{ backgroundColor: c }}
                      title={c}
                      onClick={() => setFormColor(c)}
                    />
                  ))}
                </div>
              </div>
              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-md" onClick={closeForm}>
                  キャンセル
                </Button>
                <Button type="button" className="rounded-md" onClick={submitForm}>
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-delete-title"
          onClick={() => setDeleteTarget(null)}
        >
          <Card
            className="w-full max-w-md border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="staff-delete-title" className="text-base">
                スタッフを削除
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                「<strong className="text-foreground">{deleteTarget.name}</strong>
                」を削除します。
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  onClick={() => setDeleteTarget(null)}
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-md"
                  onClick={confirmDelete}
                >
                  削除する
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
