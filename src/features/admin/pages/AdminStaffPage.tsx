import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  countFutureReservationsForTrainer,
  fetchAllReservationsForAdmin,
} from "@/features/admin/api/reservationsApi"
import { isStaffNameTaken } from "@/features/admin/api/staffApi"
import { useAdminStaff } from "@/features/admin/context/AdminStaffContext"
import { ROUTES } from "@/constants/routes"
import type { Staff } from "@/features/admin/types/staff"

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

export function AdminStaffPage() {
  const navigate = useNavigate()
  const {
    staffList,
    loading,
    staffLoadError,
    refetchStaff,
    addStaff,
    updateStaff,
    deleteStaff,
  } = useAdminStaff()

  const [formOpen, setFormOpen] = useState<"add" | { edit: Staff } | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formColor, setFormColor] = useState("#6366f1")
  const [formError, setFormError] = useState("")
  const [formSaving, setFormSaving] = useState(false)
  /** 追加フロー: 入力後の登録確認ダイアログ */
  const [addConfirmOpen, setAddConfirmOpen] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)
  const [pageError, setPageError] = useState("")
  const [deleteWorking, setDeleteWorking] = useState(false)
  const [deletePrecheckLoading, setDeletePrecheckLoading] = useState(false)

  const openAdd = () => {
    setFormError("")
    setPageError("")
    setFormName("")
    setFormDescription("")
    setFormColor(COLOR_PRESETS[staffList.length % COLOR_PRESETS.length])
    setAddConfirmOpen(false)
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
    setAddConfirmOpen(false)
  }

  /** 追加: 入力検証のうえ確認ダイアログへ */
  const requestAddConfirm = () => {
    const name = formName.trim()
    if (!name) {
      setFormError("スタッフ名を入力してください")
      return
    }
    if (name.length > 100) {
      setFormError("スタッフ名は100文字以内で入力してください")
      return
    }
    const color = normalizeHex(formColor)
    if (!/^#[0-9a-f]{6}$/i.test(color)) {
      setFormError("表示色は #RRGGBB 形式で入力してください")
      return
    }
    if (isStaffNameTaken(staffList, formName)) {
      setFormError("すでに登録されている名前です")
      return
    }
    setFormError("")
    setAddConfirmOpen(true)
  }

  /** 追加: 確認後に POST /api/admin/trainers */
  const confirmRegisterStaff = () => {
    void (async () => {
      const color = normalizeHex(formColor)
      setFormSaving(true)
      setFormError("")
      try {
        if (isStaffNameTaken(staffList, formName)) {
          setFormError("すでに登録されている名前です")
          setAddConfirmOpen(false)
          return
        }
        const created = await addStaff({
          name: formName.trim(),
          color,
          description: formDescription.trim() || undefined,
        })
        if (!created) {
          setFormError("登録できませんでした。サーバーの設定を確認してください。")
          return
        }
        setAddConfirmOpen(false)
        closeForm()
      } catch (e) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setFormError("通信に失敗しました")
      } finally {
        setFormSaving(false)
      }
    })()
  }

  /** 編集のみ保存 */
  const submitEditForm = () => {
    void (async () => {
      if (!formOpen || typeof formOpen !== "object" || !("edit" in formOpen)) return
      const color = normalizeHex(formColor)
      if (!/^#[0-9a-f]{6}$/i.test(color)) {
        setFormError("色は #RRGGBB 形式で入力してください")
        return
      }
      const name = formName.trim()
      if (!name) {
        setFormError("名前を入力してください")
        return
      }
      if (name.length > 100) {
        setFormError("名前は100文字以内で入力してください")
        return
      }
      setFormSaving(true)
      setFormError("")
      try {
        if (isStaffNameTaken(staffList, name, formOpen.edit.id)) {
          setFormError("すでに登録されている名前です")
          return
        }
        const ok = await updateStaff(formOpen.edit.id, { name, color })
        if (!ok) {
          setFormError("保存できませんでした")
          return
        }
        closeForm()
      } catch (e) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setFormError("通信に失敗しました")
      } finally {
        setFormSaving(false)
      }
    })()
  }

  const openDelete = (s: Staff) => {
    setPageError("")
    const others = staffList.filter((x) => x.id !== s.id)
    if (others.length === 0) {
      setPageError("スタッフは少なくとも1名必要です")
      return
    }
    void (async () => {
      setDeletePrecheckLoading(true)
      try {
        const list = await fetchAllReservationsForAdmin(staffList)
        if (countFutureReservationsForTrainer(s.id, list) > 0) {
          setPageError(
            `担当者「${s.name}」は予約が入っているため、削除できません`,
          )
          return
        }
        setDeleteTarget(s)
      } catch (e) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setPageError(
          "予約一覧の取得に失敗しました。しばらくしてから再度お試しください。",
        )
      } finally {
        setDeletePrecheckLoading(false)
      }
    })()
  }

  const confirmDelete = () => {
    void (async () => {
      if (!deleteTarget) return
      setDeleteWorking(true)
      setPageError("")
      try {
        const list = await fetchAllReservationsForAdmin(staffList)
        if (countFutureReservationsForTrainer(deleteTarget.id, list) > 0) {
          setPageError(
            `担当者「${deleteTarget.name}」は予約が入っているため、削除できません`,
          )
          setDeleteTarget(null)
          return
        }
        await deleteStaff(deleteTarget)
        setDeleteTarget(null)
      } catch (e) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setPageError(
          "無効化に失敗しました。ネットワークまたはサーバーを確認してください。",
        )
      } finally {
        setDeleteWorking(false)
      }
    })()
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  if (staffLoadError) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          スタッフ一覧の取得に失敗しました。ネットワークまたはサーバーを確認してください。
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetchStaff()}>
          再試行
        </Button>
      </div>
    )
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
      {deletePrecheckLoading && (
        <p className="text-sm text-muted-foreground">予約状況を確認しています...</p>
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
                        disabled={deletePrecheckLoading}
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

      {formOpen && !(formOpen === "add" && addConfirmOpen) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-form-title"
          onClick={closeForm}
        >
          <Card
            className="w-full max-w-md max-h-[90vh] overflow-y-auto border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="staff-form-title" className="text-base">
                {formOpen === "add" ? "スタッフを追加" : "スタッフを編集"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-name">スタッフ名</Label>
                <Input
                  id="staff-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例: 山田"
                  maxLength={100}
                  className="rounded-md"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">100文字以内（必須）</p>
              </div>
              {formOpen === "add" && (
                <div className="space-y-2">
                  <Label htmlFor="staff-description">自己紹介</Label>
                  <textarea
                    id="staff-description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="任意で入力できます"
                    rows={4}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground">未入力の場合は登録されません（NULL）</p>
                </div>
              )}
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
                {formOpen === "add" ? (
                  <Button
                    type="button"
                    className="rounded-md"
                    disabled={formSaving}
                    onClick={requestAddConfirm}
                  >
                    追加
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="rounded-md"
                    disabled={formSaving}
                    onClick={submitEditForm}
                  >
                    {formSaving ? "保存中..." : "保存"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {formOpen === "add" && addConfirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-add-confirm-title"
          onClick={() => setAddConfirmOpen(false)}
        >
          <Card
            className="w-full max-w-md border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="staff-add-confirm-title" className="text-base">
                登録の確認
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                この内容でスタッフを登録しますか？
              </p>
              <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
                <p>
                  <span className="text-muted-foreground">スタッフ名: </span>
                  <span className="font-medium">{formName.trim()}</span>
                </p>
                <p className="mt-2 flex items-center gap-2">
                  <span className="text-muted-foreground">表示色: </span>
                  <span
                    className="inline-block size-4 rounded-full border border-border"
                    style={{ backgroundColor: normalizeHex(formColor) }}
                  />
                  <span className="font-mono text-xs">{normalizeHex(formColor)}</span>
                </p>
                {formDescription.trim() ? (
                  <p className="mt-2 whitespace-pre-wrap">
                    <span className="text-muted-foreground">自己紹介: </span>
                    {formDescription.trim()}
                  </p>
                ) : (
                  <p className="mt-2 text-muted-foreground">自己紹介: （未入力）</p>
                )}
              </div>
              {formError && (
                <p className="text-sm text-destructive" role="alert">
                  {formError}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  disabled={formSaving}
                  onClick={() => setAddConfirmOpen(false)}
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  className="rounded-md"
                  disabled={formSaving}
                  onClick={confirmRegisterStaff}
                >
                  {formSaving ? "登録中..." : "登録"}
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
                削除の確認
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                本当に<strong className="font-semibold">「{deleteTarget.name}」</strong>
                を削除しますか？
              </p>
              <p className="text-xs text-muted-foreground">
                実行すると無効化（is_active=false）となり、過去の予約データは保持されます。
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-md"
                  disabled={deleteWorking}
                  onClick={() => setDeleteTarget(null)}
                >
                  キャンセル
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-md"
                  disabled={deleteWorking}
                  onClick={confirmDelete}
                >
                  {deleteWorking ? "削除中..." : "削除"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
