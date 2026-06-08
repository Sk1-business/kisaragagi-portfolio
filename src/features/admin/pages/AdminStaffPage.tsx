import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  countFutureReservationsForTrainer,
  fetchAllReservationsForAdmin,
} from "@/features/admin/api/reservationsApi"
import { fetchAdminUsersList } from "@/features/admin/api/adminUsersApi"
import { fetchAdminMenus } from "@/features/admin/api/menusApi"
import { fetchAdminTrainerById } from "@/features/admin/api/trainersApi"
import {
  filterStaffListForManagementPage,
  isStaffNameTaken,
} from "@/features/admin/api/staffApi"
import { useAdminStaff } from "@/features/admin/context/AdminStaffContext"
import { ROUTES } from "@/constants/routes"
import type { Staff } from "@/features/admin/types/staff"
import { StaffProfileImageField } from "@/features/admin/components/StaffProfileImageField"
import { resolvePublicAssetUrl } from "@/lib/mediaUrl"

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

/**
 * 簡易メールアドレス形式チェック（@含む・空白なし・大文字不可）。
 * バックエンドの `admin_users.email` は登録時に必ず小文字化されるため、
 * ログイン時の大文字小文字不一致による 401 を未然に防ぐ目的で、
 * スタッフ登録フォームでは大文字メールを受け付けない。
 */
function looksLikeEmail(v: string): boolean {
  const s = v.trim()
  if (!s) return false
  if (/\s/.test(s)) return false
  if (/[A-Z]/.test(s)) return false
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)
}

const STAFF_PASSWORD_MIN = 6
const STAFF_PASSWORD_MAX = 200

export function AdminStaffPage() {
  const navigate = useNavigate()
  const {
    staffList,
    loading,
    staffLoadError,
    refetchStaff,
    addStaff,
    updateStaff,
    swapStaffDisplayOrder,
    deleteStaff,
  } = useAdminStaff()

  const [formOpen, setFormOpen] = useState<"add" | { edit: Staff } | null>(null)
  const [formName, setFormName] = useState("")
  const [formDescription, setFormDescription] = useState("")
  const [formImageUrl, setFormImageUrl] = useState("")
  const [formColor, setFormColor] = useState("#6366f1")
  /** スタッフ追加フォーム専用: 管理者ログイン用のメール・パスワード */
  const [formLoginEmail, setFormLoginEmail] = useState("")
  const [formLoginPassword, setFormLoginPassword] = useState("")
  const [formLoginPasswordConfirm, setFormLoginPasswordConfirm] = useState("")
  /** 並べ替え中に多重クリックを抑止 */
  const [reorderingId, setReorderingId] = useState<string | null>(null)
  /** 追加フォームのみ。`GET /api/admin/menus` の並びで POST 順を決める */
  const [salonMenus, setSalonMenus] = useState<Awaited<
    ReturnType<typeof fetchAdminMenus>
  >>([])
  const [menusLoading, setMenusLoading] = useState(false)
  const [menusLoadError, setMenusLoadError] = useState(false)
  const [selectedMenuIds, setSelectedMenuIds] = useState<string[]>([])
  const [formError, setFormError] = useState("")
  const [formSaving, setFormSaving] = useState(false)
  const [trainerDetailLoading, setTrainerDetailLoading] = useState(false)
  const [trainerDetailError, setTrainerDetailError] = useState("")
  /** 追加フロー: 入力後の登録確認ダイアログ */
  const [addConfirmOpen, setAddConfirmOpen] = useState(false)
  /** 編集フロー: 入力後の保存確認ダイアログ */
  const [editConfirmOpen, setEditConfirmOpen] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Staff | null>(null)
  const [pageError, setPageError] = useState("")
  const [deleteWorking, setDeleteWorking] = useState(false)
  const [deletePrecheckLoading, setDeletePrecheckLoading] = useState(false)
  const [adminUsers, setAdminUsers] = useState<
    Awaited<ReturnType<typeof fetchAdminUsersList>>
  >([])
  const [adminUsersLoading, setAdminUsersLoading] = useState(true)

  const staffListForPage = useMemo(
    () => filterStaffListForManagementPage(staffList, adminUsers),
    [staffList, adminUsers],
  )

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setAdminUsersLoading(true)
      try {
        const users = await fetchAdminUsersList()
        if (!cancelled) setAdminUsers(users)
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setAdminUsers([])
      } finally {
        if (!cancelled) setAdminUsersLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  const openAdd = () => {
    setFormError("")
    setPageError("")
    setFormName("")
    setFormDescription("")
    setFormImageUrl("")
    setFormColor(COLOR_PRESETS[staffListForPage.length % COLOR_PRESETS.length])
    setFormLoginEmail("")
    setFormLoginPassword("")
    setFormLoginPasswordConfirm("")
    setSelectedMenuIds([])
    setSalonMenus([])
    setMenusLoadError(false)
    setAddConfirmOpen(false)
    setEditConfirmOpen(false)
    setTrainerDetailLoading(false)
    setTrainerDetailError("")
    setFormOpen("add")
  }

  const menuFormActive =
    formOpen === "add" ||
    (formOpen !== null &&
      typeof formOpen === "object" &&
      "edit" in formOpen)

  useEffect(() => {
    if (!menuFormActive) return
    let cancelled = false
    setMenusLoading(true)
    setMenusLoadError(false)
    void fetchAdminMenus()
      .then((list) => {
        if (!cancelled) setSalonMenus(list)
      })
      .catch(() => {
        if (!cancelled) setMenusLoadError(true)
      })
      .finally(() => {
        if (!cancelled) setMenusLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [menuFormActive])

  /** スタッフフォームではアーカイブ済みメニューを選択肢に出さない */
  const menusForStaffForm = useMemo(
    () => salonMenus.filter((m) => !m.is_archived),
    [salonMenus],
  )

  useEffect(() => {
    if (!menuFormActive || salonMenus.length === 0) return
    setSelectedMenuIds((prev) =>
      prev.filter((id) => {
        const m = salonMenus.find((x) => x.menu_id === id)
        return Boolean(m && !m.is_archived)
      }),
    )
  }, [salonMenus, menuFormActive])

  useEffect(() => {
    if (!formOpen || formOpen === "add" || !("edit" in formOpen)) return
    const id = formOpen.edit.id
    const listRow = formOpen.edit
    let cancelled = false
    void (async () => {
      setTrainerDetailLoading(true)
      setTrainerDetailError("")
      try {
        const detail = await fetchAdminTrainerById(id, listRow)
        if (cancelled) return
        if (!detail) {
          setTrainerDetailError("スタッフ詳細を取得できませんでした。")
          return
        }
        setFormDescription(detail.description ?? "")
        setFormImageUrl(detail.image_url ?? "")
        setSelectedMenuIds(detail.menuIds ? [...detail.menuIds] : [])
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        /** 一覧行は既にフォームへ入っているため、詳細 GET が失敗しても編集可能にする */
        if (String(listRow.id) === String(id)) {
          setFormDescription(listRow.description ?? "")
          setFormImageUrl(listRow.image_url ?? "")
          setSelectedMenuIds(listRow.menuIds ? [...listRow.menuIds] : [])
          setTrainerDetailError("")
          return
        }
        setTrainerDetailError(
          "スタッフ詳細の取得に失敗しました。再取得してから保存してください。",
        )
      } finally {
        if (!cancelled) setTrainerDetailLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [formOpen, navigate])

  const toggleMenuSelection = (menuId: string) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId) ? prev.filter((id) => id !== menuId) : [...prev, menuId],
    )
  }

  const orderedSelectedMenuIds = useMemo(
    () =>
      menusForStaffForm
        .map((m) => m.menu_id)
        .filter((id) => selectedMenuIds.includes(id)),
    [menusForStaffForm, selectedMenuIds],
  )

  const openEdit = (s: Staff) => {
    setFormError("")
    setPageError("")
    setFormName(s.name)
    setFormColor(s.color)
    setFormDescription(s.description ?? "")
    setFormImageUrl(s.image_url ?? "")
    setSelectedMenuIds(s.menuIds ? [...s.menuIds] : [])
    setEditConfirmOpen(false)
    setTrainerDetailLoading(false)
    setTrainerDetailError("")
    setFormOpen({ edit: s })
  }

  const closeForm = () => {
    setFormOpen(null)
    setFormError("")
    setAddConfirmOpen(false)
    setEditConfirmOpen(false)
    setTrainerDetailLoading(false)
    setTrainerDetailError("")
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
    if (isStaffNameTaken(staffListForPage, formName)) {
      setFormError("すでに登録されている名前です")
      return
    }
    const email = formLoginEmail.trim()
    if (!email) {
      setFormError(
        "ログイン用メールアドレスを入力してください（スタッフが管理者画面にログインするために必要）",
      )
      return
    }
    if (/[A-Z]/.test(email)) {
      setFormError(
        "ログイン用メールアドレスは小文字のみで入力してください（大文字は使用できません）",
      )
      return
    }
    if (!looksLikeEmail(email)) {
      setFormError("ログイン用メールアドレスの形式が正しくありません")
      return
    }
    if (email.length > 200) {
      setFormError("ログイン用メールアドレスは200文字以内で入力してください")
      return
    }
    if (!formLoginPassword) {
      setFormError("ログイン用パスワードを入力してください")
      return
    }
    if (formLoginPassword.length < STAFF_PASSWORD_MIN) {
      setFormError(`パスワードは${STAFF_PASSWORD_MIN}文字以上で入力してください`)
      return
    }
    if (formLoginPassword.length > STAFF_PASSWORD_MAX) {
      setFormError(`パスワードは${STAFF_PASSWORD_MAX}文字以内で入力してください`)
      return
    }
    if (formLoginPassword !== formLoginPasswordConfirm) {
      setFormError("パスワードと確認用パスワードが一致しません")
      return
    }
    setFormError("")
    setAddConfirmOpen(true)
  }

  /**
   * 追加: 確認後に
   * 1. `POST /api/admin/admin-users` で staff としてログインアカウントを作成
   * 2. 続けて `POST /api/admin/trainers` でトレーナー（=スタッフ表示行）を作成
   */
  const confirmRegisterStaff = () => {
    void (async () => {
      const color = normalizeHex(formColor)
      setFormSaving(true)
      setFormError("")
      try {
        if (isStaffNameTaken(staffListForPage, formName)) {
          setFormError("すでに登録されている名前です")
          setAddConfirmOpen(false)
          return
        }
        const result = await addStaff({
          name: formName.trim(),
          color,
          description: formDescription.trim() || undefined,
          image_url: formImageUrl.trim() || undefined,
          menuIds: orderedSelectedMenuIds,
          loginEmail: formLoginEmail.trim(),
          loginPassword: formLoginPassword,
        })
        if (result.kind === "admin_user_failed") {
          setAddConfirmOpen(false)
          setFormError(
            `ログイン用アカウントの作成に失敗しました: ${result.message}`,
          )
          return
        }
        if (result.kind === "trainer_failed") {
          setAddConfirmOpen(false)
          setFormError(
            `スタッフ情報の登録に失敗しました: ${result.message}（ログインアカウントは作成済みの可能性があります）`,
          )
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

  /** 一覧の表示順入れ替え。`Δ = -1`(上に) / `+1`(下に) */
  const handleReorder = (target: Staff, delta: -1 | 1) => {
    const idx = staffListForPage.findIndex((s) => s.id === target.id)
    if (idx < 0) return
    const partnerIdx = idx + delta
    if (partnerIdx < 0 || partnerIdx >= staffListForPage.length) return
    const partner = staffListForPage[partnerIdx]
    if (!partner) return
    void (async () => {
      setReorderingId(target.id)
      setPageError("")
      try {
        const ok = await swapStaffDisplayOrder(target, partner)
        if (!ok) {
          setPageError("表示順の変更に失敗しました。時間をおいて再度お試しください。")
        }
      } catch (e) {
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setPageError("表示順の変更に失敗しました。時間をおいて再度お試しください。")
      } finally {
        setReorderingId(null)
      }
    })()
  }

  /** 編集: 入力検証のうえ確認ダイアログへ */
  const requestEditConfirm = () => {
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
    if (isStaffNameTaken(staffListForPage, name, formOpen.edit.id)) {
      setFormError("すでに登録されている名前です")
      return
    }
    if (trainerDetailError) {
      setFormError("スタッフ詳細の取得に失敗しているため、保存できません。")
      return
    }
    setFormError("")
    setEditConfirmOpen(true)
  }

  /** 編集: 確認後に PUT */
  const confirmUpdateStaff = () => {
    void (async () => {
      if (!formOpen || typeof formOpen !== "object" || !("edit" in formOpen)) return
      const color = normalizeHex(formColor)
      const name = formName.trim()
      setFormSaving(true)
      setFormError("")
      try {
        if (isStaffNameTaken(staffListForPage, name, formOpen.edit.id)) {
          setFormError("すでに登録されている名前です")
          setEditConfirmOpen(false)
          return
        }
        const ok = await updateStaff(formOpen.edit.id, {
          name,
          color,
          description: formDescription,
          image_url: formImageUrl,
          menuIds: orderedSelectedMenuIds,
        })
        if (!ok) {
          setFormError("保存できませんでした")
          return
        }
        setEditConfirmOpen(false)
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
    const others = staffListForPage.filter((x) => x.id !== s.id)
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

  if (loading || adminUsersLoading) {
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
          カレンダー・予約の担当表示に使うスタッフを管理します。メニュー一覧は GET
          /api/admin/menus、登録・更新はトレーナー API と連携します。
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
          <p className="text-xs text-muted-foreground">
            ↑↓ ボタンで表示順を入れ替えできます。表示順は予約画面のスタッフ一覧などに反映されます。
          </p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[360px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 pr-2 font-medium" aria-label="並び替え" />
                <th className="pb-2 pr-4 font-medium">色</th>
                <th className="pb-2 pr-4 font-medium">名前</th>
                <th className="pb-2 pr-4 font-medium">対応メニュー</th>
                <th className="pb-2 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {staffListForPage.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    表示できるスタッフがいません。スタッフを追加してください。
                  </td>
                </tr>
              ) : null}
              {staffListForPage.map((s, idx) => {
                const isFirst = idx === 0
                const isLast = idx === staffListForPage.length - 1
                const reorderingThis = reorderingId !== null
                return (
                  <tr key={s.id} className="border-b border-border/60">
                    <td className="py-3 pr-2 align-middle">
                      <div className="flex flex-col gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7 rounded-md"
                          disabled={isFirst || reorderingThis}
                          aria-label={`${s.name} を上に移動`}
                          title={isFirst ? "これ以上、上に移動できません" : "上に移動"}
                          onClick={() => handleReorder(s, -1)}
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="size-7 rounded-md"
                          disabled={isLast || reorderingThis}
                          aria-label={`${s.name} を下に移動`}
                          title={isLast ? "これ以上、下に移動できません" : "下に移動"}
                          onClick={() => handleReorder(s, 1)}
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className="inline-block size-6 rounded-full border border-border"
                        style={{ backgroundColor: s.color }}
                        title={s.color}
                      />
                    </td>
                    <td className="py-3 pr-4 font-medium">{s.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {s.menuIds?.length ? `${s.menuIds.length} 件` : "—"}
                    </td>
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
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {formOpen &&
        !(formOpen === "add" && addConfirmOpen) &&
        !(
          typeof formOpen === "object" &&
          formOpen !== null &&
          "edit" in formOpen &&
          editConfirmOpen
        ) && (
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
            <CardContent className="space-y-6">
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
                <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-login-email">ログイン用メールアドレス</Label>
                    <Input
                      id="staff-login-email"
                      type="email"
                      value={formLoginEmail}
                      onChange={(e) =>
                        setFormLoginEmail(
                          /**
                           * バックエンドの admin_users.email は小文字で保存されるため、
                           * 大文字を入力された段階で自動的に除外（=入力できない）にする。
                           */
                          e.target.value.replace(/[A-Z]/g, "").replace(/\s+/g, ""),
                        )
                      }
                      placeholder="example@your-salon.jp"
                      maxLength={200}
                      inputMode="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      className="rounded-md"
                      autoComplete="off"
                    />
                    <p className="text-xs text-muted-foreground">
                      小文字のみ・空白不可（大文字を入力するとブロックされます）
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-login-password">初期パスワード</Label>
                    <Input
                      id="staff-login-password"
                      type="password"
                      value={formLoginPassword}
                      onChange={(e) => setFormLoginPassword(e.target.value)}
                      placeholder={`${STAFF_PASSWORD_MIN}文字以上`}
                      maxLength={STAFF_PASSWORD_MAX}
                      className="rounded-md"
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-login-password-confirm">
                      初期パスワード（確認用）
                    </Label>
                    <Input
                      id="staff-login-password-confirm"
                      type="password"
                      value={formLoginPasswordConfirm}
                      onChange={(e) => setFormLoginPasswordConfirm(e.target.value)}
                      placeholder="もう一度入力してください"
                      maxLength={STAFF_PASSWORD_MAX}
                      className="rounded-md"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}
              {menuFormActive && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="staff-description">メモ（description）</Label>
                    <textarea
                      id="staff-description"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="任意で入力できます"
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground">
                      未入力の場合は送りません（NULL）
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>イメージ画像（プロフィール画像）</Label>
                    <StaffProfileImageField
                      value={formImageUrl}
                      onChange={setFormImageUrl}
                      disabled={formSaving}
                      onUploadError={(msg) => setFormError(msg)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>対応可能なメニュー</Label>
                    {menusLoading ? (
                      <p className="text-sm text-muted-foreground">メニュー一覧を読み込み中...</p>
                    ) : menusLoadError ? (
                      <p className="text-sm text-destructive" role="alert">
                        メニュー一覧の取得に失敗しました。画面を閉じて再度お試しください。
                      </p>
                    ) : menusForStaffForm.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        登録メニューがありません。メニュー未選択のまま登録すると、対応メニューなしで保存されます。
                      </p>
                    ) : (
                      <ul className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-border p-3">
                        {menusForStaffForm.map((m) => (
                          <li key={m.menu_id} className="flex items-start gap-2 text-sm">
                            <input
                              id={`staff-menu-${m.menu_id}`}
                              type="checkbox"
                              checked={selectedMenuIds.includes(m.menu_id)}
                              onChange={() => toggleMenuSelection(m.menu_id)}
                              className="mt-1 size-4 shrink-0 rounded border border-input"
                            />
                            <label
                              htmlFor={`staff-menu-${m.menu_id}`}
                              className="cursor-pointer leading-snug"
                            >
                              <span className="font-medium">{m.name}</span>
                              {!m.is_public ? (
                                <span className="ml-1.5 text-xs text-amber-700 dark:text-amber-400">
                                  非公開
                                </span>
                              ) : null}
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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
              {trainerDetailLoading ? (
                <p className="text-sm text-muted-foreground">スタッフ詳細を読み込み中...</p>
              ) : null}
              {trainerDetailError ? (
                <div className="space-y-2">
                  <p className="text-sm text-destructive" role="alert">
                    {trainerDetailError}
                  </p>
                  {typeof formOpen === "object" && formOpen !== null && "edit" in formOpen ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-md"
                      onClick={() => setFormOpen({ edit: formOpen.edit })}
                    >
                      再取得
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-md" onClick={closeForm}>
                  キャンセル
                </Button>
                {formOpen === "add" ? (
                  <Button
                    type="button"
                    className="rounded-md"
                    disabled={formSaving || menusLoading}
                    onClick={requestAddConfirm}
                  >
                    追加
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="rounded-md"
                    disabled={
                      formSaving ||
                      menusLoading ||
                      trainerDetailLoading ||
                      Boolean(trainerDetailError)
                    }
                    onClick={requestEditConfirm}
                  >
                    保存
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {typeof formOpen === "object" &&
        formOpen !== null &&
        "edit" in formOpen &&
        editConfirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-edit-confirm-title"
          onClick={() => setEditConfirmOpen(false)}
        >
          <Card
            className="w-full max-w-md border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle id="staff-edit-confirm-title" className="text-base">
                保存の確認
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-foreground">
                この内容でスタッフ情報を更新しますか？
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
                    <span className="text-muted-foreground">メモ: </span>
                    {formDescription.trim()}
                  </p>
                ) : (
                  <p className="mt-2 text-muted-foreground">メモ: （未入力）</p>
                )}
                {formImageUrl.trim() ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-muted-foreground">プロフィール画像</p>
                    <img
                      src={resolvePublicAssetUrl(formImageUrl)}
                      alt=""
                      className="h-16 w-16 rounded-md border border-border object-cover"
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-muted-foreground">プロフィール画像: （未設定）</p>
                )}
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">対応メニュー: </span>
                  {orderedSelectedMenuIds.length === 0 ? <span>なし</span> : null}
                </p>
                {orderedSelectedMenuIds.length > 0 && (
                  <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                    {orderedSelectedMenuIds.map((id) => {
                      const label =
                        salonMenus.find((m) => m.menu_id === id)?.name ?? "（名称不明）"
                      return (
                        <li key={id}>
                          {label}
                        </li>
                      )
                    })}
                  </ul>
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
                  onClick={() => setEditConfirmOpen(false)}
                >
                  いいえ
                </Button>
                <Button
                  type="button"
                  className="rounded-md"
                  disabled={formSaving}
                  onClick={confirmUpdateStaff}
                >
                  {formSaving ? "保存中..." : "はい"}
                </Button>
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
                <p className="mt-2 break-all">
                  <span className="text-muted-foreground">メールアドレス: </span>
                  <span className="font-medium">{formLoginEmail.trim()}</span>
                </p>
                <p className="mt-2 flex items-center gap-2">
                  <span className="text-muted-foreground">表示色: </span>
                  <span
                    className="inline-block size-4 rounded-full border border-border"
                    style={{ backgroundColor: normalizeHex(formColor) }}
                  />
                </p>
                {formDescription.trim() ? (
                  <p className="mt-2 whitespace-pre-wrap">
                    <span className="text-muted-foreground">メモ: </span>
                    {formDescription.trim()}
                  </p>
                ) : (
                  <p className="mt-2 text-muted-foreground">メモ: （未入力）</p>
                )}
                {formImageUrl.trim() ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-muted-foreground">プロフィール画像</p>
                    <img
                      src={resolvePublicAssetUrl(formImageUrl)}
                      alt=""
                      className="h-16 w-16 rounded-md border border-border object-cover"
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-muted-foreground">プロフィール画像: （未設定）</p>
                )}
                <p className="mt-2 text-sm">
                  <span className="text-muted-foreground">対応メニュー: </span>
                  {orderedSelectedMenuIds.length === 0 ? <span>なし</span> : null}
                </p>
                {orderedSelectedMenuIds.length > 0 && (
                  <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                    {orderedSelectedMenuIds.map((id) => {
                      const label =
                        salonMenus.find((m) => m.menu_id === id)?.name ?? "（名称不明）"
                      return (
                        <li key={id}>
                          {label}
                        </li>
                      )
                    })}
                  </ul>
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
