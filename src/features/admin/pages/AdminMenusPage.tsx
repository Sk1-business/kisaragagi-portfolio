import { useCallback, useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import {
  deleteAdminMenu,
  fetchAdminMenus,
  postAdminMenu,
  putAdminMenu,
  type AdminMenu,
} from "@/features/admin/api/menusApi"

export function AdminMenusPage() {
  const navigate = useNavigate()
  const [menus, setMenus] = useState<AdminMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [formOpen, setFormOpen] = useState<"add" | { edit: AdminMenu } | null>(null)
  const [formName, setFormName] = useState("")
  const [formDuration, setFormDuration] = useState("")
  const [formPrice, setFormPrice] = useState("")
  const [formIsPublic, setFormIsPublic] = useState(true)
  const [formIsArchived, setFormIsArchived] = useState(false)
  const [formError, setFormError] = useState("")
  const [formSaving, setFormSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<AdminMenu | null>(null)
  const [deleteWorking, setDeleteWorking] = useState(false)
  const [pageError, setPageError] = useState("")

  const reload = useCallback(async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const list = await fetchAdminMenus()
      setMenus(list)
    } catch (e) {
      if (e instanceof Error && e.message === "UNAUTHORIZED") {
        navigate(ROUTES.backofficeLogin, { replace: true })
        return
      }
      setLoadError(true)
      setMenus([])
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void reload()
  }, [reload])

  const openAdd = () => {
    setFormError("")
    setPageError("")
    setFormName("")
    setFormDuration("")
    setFormPrice("")
    setFormIsPublic(true)
    setFormIsArchived(false)
    setFormOpen("add")
  }

  const openEdit = (m: AdminMenu) => {
    setFormError("")
    setPageError("")
    setFormName(m.name)
    setFormDuration(
      m.duration_minutes !== undefined ? String(m.duration_minutes) : "",
    )
    setFormPrice(m.price !== undefined ? String(m.price) : "")
    setFormIsPublic(m.is_public)
    setFormIsArchived(m.is_archived)
    setFormOpen({ edit: m })
  }

  const closeForm = () => {
    setFormOpen(null)
    setFormError("")
  }

  const submitForm = () => {
    void (async () => {
      const name = formName.trim()
      if (!name) {
        setFormError("メニュー名を入力してください")
        return
      }
      if (name.length > 200) {
        setFormError("メニュー名は200文字以内で入力してください")
        return
      }
      const durRaw = formDuration.trim()
      let duration_minutes: number | undefined
      if (durRaw) {
        const n = Number(durRaw)
        if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
          setFormError("所要時間（分）は空欄か、正の整数で入力してください")
          return
        }
        duration_minutes = n
      }
      if (formOpen === "add" && duration_minutes === undefined) {
        setFormError("新規追加時は所要時間（分）を入力してください")
        return
      }
      const priceRaw = formPrice.trim()
      let price: number | undefined
      if (priceRaw) {
        const n = Number(priceRaw)
        if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) {
          setFormError("料金は0以上の整数で入力してください")
          return
        }
        price = n
      }
      if (formOpen === "add" && price === undefined) {
        setFormError("新規追加時は料金を入力してください")
        return
      }
      setFormSaving(true)
      setFormError("")
      try {
        if (formOpen === "add") {
          const created = await postAdminMenu({
            name,
            duration_minutes: duration_minutes as number,
            price: price as number,
          })
          setMenus((prev) =>
            [...prev.filter((x) => x.menu_id !== created.menu_id), created].sort(
              (a, b) => a.name.localeCompare(b.name, "ja"),
            ),
          )
        } else if (formOpen && "edit" in formOpen) {
          const id = formOpen.edit.menu_id
          await putAdminMenu(id, {
            name,
            duration_minutes,
            price,
            is_public: formIsPublic,
            is_archived: formIsArchived,
          })
          setMenus((prev) => {
            const next = prev.map((x) =>
              x.menu_id === id
                ? {
                    ...x,
                    name,
                    duration_minutes,
                    price,
                    is_public: formIsPublic,
                    is_archived: formIsArchived,
                  }
                : x,
            )
            return [...next].sort((a, b) => a.name.localeCompare(b.name, "ja"))
          })
        }
        closeForm()
      } catch (e) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        if (e instanceof Error && e.message.startsWith("FETCH_FAILED_")) {
          const [, rawDetail] = e.message.split(":", 2)
          const detail = rawDetail?.trim()
          if (detail) {
            setFormError(`保存に失敗しました: ${detail}`)
          } else {
            setFormError("入力形式がAPI仕様と一致していません。項目を確認してください。")
          }
          return
        }
        setFormError("保存に失敗しました。入力内容とサーバーを確認してください。")
      } finally {
        setFormSaving(false)
      }
    })()
  }

  const confirmDelete = () => {
    void (async () => {
      if (!deleteTarget) return
      setDeleteWorking(true)
      setPageError("")
      try {
        await deleteAdminMenu(deleteTarget.menu_id)
        setMenus((prev) => prev.filter((x) => x.menu_id !== deleteTarget.menu_id))
        setDeleteTarget(null)
      } catch (e) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setPageError("削除に失敗しました。ネットワークまたはサーバーを確認してください。")
      } finally {
        setDeleteWorking(false)
      }
    })()
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">読み込み中...</p>
  }

  if (loadError) {
    return (
      <div className="space-y-3 rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">
          メニュー一覧の取得に失敗しました。GET /api/admin/menus を確認してください。
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void reload()}>
          再試行
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" size="sm" className="rounded-md" onClick={openAdd}>
          <Plus className="mr-1 size-4" />
          メニューを追加
        </Button>
      </div>

      {pageError && (
        <p className="text-sm text-destructive" role="alert">
          {pageError}
        </p>
      )}

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg">メニュー一覧</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">名前</th>
                <th className="pb-2 pr-3 font-medium">所要（分）</th>
                <th className="pb-2 pr-3 font-medium">価格</th>
                <th className="pb-2 pr-3 font-medium">公開</th>
                <th className="pb-2 pr-3 font-medium">アーカイブ</th>
                <th className="pb-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((m) => (
                <tr key={m.menu_id} className="border-b border-border/60">
                  <td className="py-3 pr-3 font-medium">{m.name}</td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {m.duration_minutes ?? "—"}
                  </td>
                  <td className="py-3 pr-3 text-muted-foreground">
                    {typeof m.price === "number"
                      ? `¥${m.price.toLocaleString("ja-JP")}`
                      : "—"}
                  </td>
                  <td className="py-3 pr-3">{m.is_public ? "はい" : "いいえ"}</td>
                  <td className="py-3 pr-3">{m.is_archived ? "はい" : "いいえ"}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-md"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="mr-1 size-3.5" />
                        編集
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-md text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(m)}
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
          {menus.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">メニューがまだありません。</p>
          ) : null}
        </CardContent>
      </Card>

      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="menu-form-title"
          onClick={closeForm}
        >
          <Card
            className="w-full max-w-md max-h-[90vh] overflow-y-auto border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="menu-form-title" className="text-base">
                {formOpen === "add" ? "メニューを追加" : "メニューを編集"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="menu-name">メニュー名</Label>
                <Input
                  id="menu-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  maxLength={200}
                  className="rounded-md"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu-duration">所要時間（分）</Label>
                <Input
                  id="menu-duration"
                  type="number"
                  min={1}
                  step={1}
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                  placeholder={formOpen === "add" ? "必須（例: 60）" : "任意（空欄可）"}
                  className="rounded-md max-w-[200px] font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="menu-price">料金</Label>
                <Input
                  id="menu-price"
                  type="number"
                  min={0}
                  step={1}
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder={formOpen === "add" ? "必須（例: 5000）" : "任意（空欄可）"}
                  className="rounded-md max-w-[200px] font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formIsPublic}
                    onChange={(e) => setFormIsPublic(e.target.checked)}
                    className="size-4 rounded border border-input"
                  />
                  公開する（is_public）
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formIsArchived}
                    onChange={(e) => setFormIsArchived(e.target.checked)}
                    className="size-4 rounded border border-input"
                  />
                  アーカイブ済み（is_archived）
                </label>
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
                <Button
                  type="button"
                  className="rounded-md"
                  disabled={formSaving}
                  onClick={submitForm}
                >
                  {formSaving ? "保存中..." : "保存"}
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
          aria-labelledby="menu-delete-title"
          onClick={() => setDeleteTarget(null)}
        >
          <Card
            className="w-full max-w-md border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="menu-delete-title" className="text-base">
                削除の確認
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                メニュー「<strong className="font-semibold">{deleteTarget.name}</strong>
                」を削除しますか？
              </p>
              <p className="text-xs text-muted-foreground">
                対象メニューを削除する API を呼び出します。
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
