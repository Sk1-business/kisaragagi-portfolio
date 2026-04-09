import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import { fetchAdminMenus } from "@/features/admin/api/menusApi"
import { fetchAdminReservations } from "@/features/admin/api/reservationsApi"
import {
  fetchTrainerShifts,
  groupTrainerShiftRowsByDate,
} from "@/features/admin/api/trainerShiftsApi"
import { useStaff } from "@/features/admin/hooks/useStaff"
import {
  computeNewReservationStaffEligibility,
  type NewReservationStaffBlockReason,
} from "@/features/admin/lib/adminNewReservationStaffEligibility"
import {
  ADMIN_CALENDAR_TIME_ZONE,
  addMinutesToIso,
  combineDateAndTimeToAdminTzIso,
  defaultNextReservationSlotAdminTz,
  ensureSlotNotBeforeAdminTz,
  formatTimeHmInAdminTz,
  formatTimeInAdminCalendarTz,
  getDateKeyInTimeZone,
  getIsoDateKeyInTimeZone,
} from "@/features/admin/lib/calendarUtils"
import type { AdminNewReservationDraft } from "@/features/admin/types/adminNewReservation"
import {
  getBookingNotBeforeIsoFromState,
  isAdminNewReservationDraft,
} from "@/features/admin/types/adminNewReservation"

function isValidEmail(s: string): boolean {
  const t = s.trim()
  if (!t) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

/** `ReservationDetailCard` の assignee オプションと同じ文言 */
function newReservationStaffOptionTitle(
  reason: NewReservationStaffBlockReason | undefined,
): string | undefined {
  if (reason === "overlap") return "この時間帯にはすでにほかの確定予約があります"
  if (reason === "shift") return "この日の予約時間帯にシフトが登録されていません"
  return undefined
}

function newReservationStaffOptionSuffix(
  reason: NewReservationStaffBlockReason | undefined,
): string {
  if (reason === "overlap") return "（選択不可・予約あり）"
  if (reason === "shift") return "（選択不可・シフトなし）"
  return "（選択不可）"
}

export function AdminNewReservationPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { staffList, loading: staffLoading } = useStaff()

  const bookingNotBeforeIso = useMemo(
    () => getBookingNotBeforeIsoFromState(location.state),
    [location.state],
  )

  const minDateYmd = useMemo(
    () => getDateKeyInTimeZone(new Date(bookingNotBeforeIso), ADMIN_CALENDAR_TIME_ZONE),
    [bookingNotBeforeIso],
  )
  const minTimeHmOnMinDate = useMemo(
    () => formatTimeHmInAdminTz(bookingNotBeforeIso),
    [bookingNotBeforeIso],
  )

  const [menus, setMenus] = useState<Awaited<ReturnType<typeof fetchAdminMenus>>>([])
  const [menusLoading, setMenusLoading] = useState(true)
  const [menusError, setMenusError] = useState(false)

  const initialSlot = useMemo(() => {
    const st = location.state
    const bookingIso = getBookingNotBeforeIsoFromState(st)
    const draft = isAdminNewReservationDraft(st) ? st : null
    if (draft) {
      return ensureSlotNotBeforeAdminTz(
        draft.dateYmd,
        draft.timeHm,
        draft.bookingNotBeforeIso,
      )
    }
    return defaultNextReservationSlotAdminTz(bookingIso)
  }, [location.state])

  const initialDraft = useMemo(
    () => (isAdminNewReservationDraft(location.state) ? location.state : null),
    [location.state],
  )

  const [menuId, setMenuId] = useState(() => initialDraft?.menuId ?? "")
  const [dateYmd, setDateYmd] = useState(() => initialSlot.dateYmd)
  const [timeHm, setTimeHm] = useState(() => initialSlot.timeHm)
  const [trainerId, setTrainerId] = useState(() => initialDraft?.trainerId ?? "")
  const [customerName, setCustomerName] = useState(() => initialDraft?.customerName ?? "")
  const [customerEmail, setCustomerEmail] = useState(() => initialDraft?.customerEmail ?? "")
  const [customerId, setCustomerId] = useState(() => initialDraft?.customerId ?? "")
  const [customerPhone, setCustomerPhone] = useState(() => initialDraft?.customerPhone ?? "")
  const [notes, setNotes] = useState(() => initialDraft?.notes ?? "")
  const [formError, setFormError] = useState("")

  const [eligibleByStaffId, setEligibleByStaffId] = useState<Record<string, boolean>>({})
  const [blockReasonByStaffId, setBlockReasonByStaffId] = useState<
    Record<string, NewReservationStaffBlockReason>
  >({})
  const [staffEligibilityLoading, setStaffEligibilityLoading] = useState(false)
  const [staffEligibilityError, setStaffEligibilityError] = useState(false)

  const selectedMenu = useMemo(
    () => menus.find((m) => m.menu_id === menuId),
    [menus, menuId],
  )
  const durationMinutes = selectedMenu?.duration_minutes

  const startAtIso = useMemo(() => {
    if (!menuId.trim() || !dateYmd || !timeHm) return null
    const s = combineDateAndTimeToAdminTzIso(dateYmd, timeHm)
    if (new Date(s).getTime() < new Date(bookingNotBeforeIso).getTime()) return null
    return s
  }, [menuId, dateYmd, timeHm, bookingNotBeforeIso])

  const endAtIso = useMemo(() => {
    if (!startAtIso || durationMinutes === undefined || durationMinutes <= 0) return null
    return addMinutesToIso(startAtIso, durationMinutes)
  }, [startAtIso, durationMinutes])

  const canComputeWindow = Boolean(startAtIso && endAtIso)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setMenusLoading(true)
      setMenusError(false)
      try {
        const list = await fetchAdminMenus()
        if (cancelled) return
        setMenus(list)
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setMenusError(true)
        setMenus([])
      } finally {
        if (!cancelled) setMenusLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [navigate])

  useEffect(() => {
    const st = location.state
    const bookingIso = getBookingNotBeforeIsoFromState(st)
    const draft = isAdminNewReservationDraft(st) ? st : null

    if (draft) {
      const s = ensureSlotNotBeforeAdminTz(
        draft.dateYmd,
        draft.timeHm,
        draft.bookingNotBeforeIso,
      )
      setMenuId(draft.menuId)
      setDateYmd(s.dateYmd)
      setTimeHm(s.timeHm)
      setTrainerId(draft.trainerId)
      setCustomerName(draft.customerName)
      setCustomerEmail(draft.customerEmail)
      setCustomerId(draft.customerId ?? "")
      setCustomerPhone(draft.customerPhone ?? "")
      setNotes(draft.notes ?? "")
      return
    }

    const slot = defaultNextReservationSlotAdminTz(bookingIso)
    setDateYmd(slot.dateYmd)
    setTimeHm(slot.timeHm)
    setMenuId("")
    setTrainerId("")
    setCustomerName("")
    setCustomerEmail("")
    setCustomerId("")
    setCustomerPhone("")
    setNotes("")
  }, [location.state])

  useEffect(() => {
    if (!staffList.length || staffLoading || !startAtIso || !endAtIso) {
      setEligibleByStaffId({})
      setBlockReasonByStaffId({})
      setStaffEligibilityLoading(false)
      setStaffEligibilityError(false)
      return
    }
    let cancelled = false
    void (async () => {
      setStaffEligibilityLoading(true)
      setStaffEligibilityError(false)
      try {
        const dateKey = getIsoDateKeyInTimeZone(startAtIso, ADMIN_CALENDAR_TIME_ZONE)
        const [resList, shiftResults] = await Promise.all([
          fetchAdminReservations(staffList, {
            viewMode: "day",
            anchorDate: new Date(`${dateKey}T12:00:00+09:00`),
            dateKeyOverride: dateKey,
          }),
          Promise.all(
            staffList.map((s) =>
              fetchTrainerShifts(s.id, { dateFrom: dateKey, dateTo: dateKey }),
            ),
          ),
        ])
        if (cancelled) return
        const next: Record<string, boolean> = {}
        const reasons: Record<string, NewReservationStaffBlockReason> = {}
        staffList.forEach((s, i) => {
          const byDate = groupTrainerShiftRowsByDate(shiftResults[i], s.id)
          const dayRows = byDate[dateKey] ?? []
          const { ok, reason } = computeNewReservationStaffEligibility(
            s.id,
            startAtIso,
            endAtIso,
            resList,
            dayRows,
          )
          next[s.id] = ok
          if (!ok && reason) reasons[s.id] = reason
        })
        setEligibleByStaffId(next)
        setBlockReasonByStaffId(reasons)
      } catch (e) {
        if (cancelled) return
        if (e instanceof Error && e.message === "UNAUTHORIZED") {
          navigate(ROUTES.backofficeLogin, { replace: true })
          return
        }
        setStaffEligibilityError(true)
        setEligibleByStaffId({})
        setBlockReasonByStaffId({})
      } finally {
        if (!cancelled) setStaffEligibilityLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [startAtIso, endAtIso, staffList, staffLoading, navigate])

  useEffect(() => {
    if (!trainerId) return
    if (staffEligibilityLoading) return
    if (eligibleByStaffId[trainerId] !== true) {
      setTrainerId("")
    }
  }, [eligibleByStaffId, trainerId, staffEligibilityLoading])

  function applyDateChange(nextDateYmd: string) {
    const s = ensureSlotNotBeforeAdminTz(nextDateYmd, timeHm, bookingNotBeforeIso)
    setDateYmd(s.dateYmd)
    setTimeHm(s.timeHm)
  }

  function applyTimeChange(nextTimeHm: string) {
    const s = ensureSlotNotBeforeAdminTz(dateYmd, nextTimeHm, bookingNotBeforeIso)
    setDateYmd(s.dateYmd)
    setTimeHm(s.timeHm)
  }

  function handleConfirmClick() {
    setFormError("")
    if (!menuId.trim()) {
      setFormError("メニューを選択してください。")
      return
    }
    if (durationMinutes === undefined || durationMinutes <= 0) {
      setFormError("メニューに所要時間（分）が含まれていません。API のメニュー定義を確認してください。")
      return
    }
    if (!dateYmd || !timeHm) {
      setFormError("日付と時刻を入力してください。")
      return
    }
    const slotIso = combineDateAndTimeToAdminTzIso(dateYmd, timeHm)
    if (new Date(slotIso).getTime() < new Date(bookingNotBeforeIso).getTime()) {
      setFormError(
        "開始日時は、新規予約画面に入った時刻（または直前に新規予約を開いた時刻）以降にしてください。",
      )
      return
    }
    if (!startAtIso || !endAtIso) {
      setFormError("終了時刻を算出できません。メニューと開始時刻を確認してください。")
      return
    }
    if (!staffLoading && staffList.length > 0) {
      if (staffEligibilityLoading) {
        setFormError("担当者の可否を確認しています。しばらく待ってから再度お試しください。")
        return
      }
      if (staffEligibilityError) {
        setFormError("予約一覧またはシフトの取得に失敗しました。通信を確認してください。")
        return
      }
      if (!trainerId.trim()) {
        setFormError("担当者（スタッフ）を選択してください。")
        return
      }
      if (eligibleByStaffId[trainerId] !== true) {
        setFormError("選択した担当者はこの時間帯に予約できません。別の担当者を選んでください。")
        return
      }
    }
    if (!customerName.trim()) {
      setFormError("顧客名を入力してください。")
      return
    }
    if (!isValidEmail(customerEmail)) {
      setFormError("有効なメールアドレスを入力してください。")
      return
    }
    const menuName = menus.find((m) => m.menu_id === menuId)?.name
    const trainerName = staffList.find((s) => s.id === trainerId)?.name
    const draft: AdminNewReservationDraft = {
      bookingNotBeforeIso,
      menuId: menuId.trim(),
      menuName,
      dateYmd,
      timeHm,
      durationMinutes,
      trainerId: trainerId.trim(),
      trainerName,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerId: customerId.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    }
    navigate(ROUTES.adminNewReservationConfirm, { state: draft })
  }

  const timeMin =
    dateYmd === minDateYmd ? minTimeHmOnMinDate : undefined

  const confirmDisabled =
    staffLoading ||
    (staffList.length > 0 &&
      (!canComputeWindow ||
        staffEligibilityLoading ||
        staffEligibilityError ||
        !trainerId.trim() ||
        eligibleByStaffId[trainerId] !== true))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">新規予約（代理登録）</h2>
        <p className="text-sm text-muted-foreground">
          メニューは GET /api/admin/menus、スタッフは GET /api/admin/trainers、シフトは GET
          /api/admin/trainers/&#123;trainer_id&#125;/shifts を参照します。開始日時はヘッダの「新規予約」を押した時刻以降のみ選べます。
        </p>
      </div>

      <Card className="border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-base">予約内容</CardTitle>
          <CardDescription>
            必須: メニュー、開始日時、顧客名、メール。
            {staffList.length > 0 ? " メニュー・開始時刻入力後に担当者を選択、" : null}
            任意: 既存顧客 ID、電話、メモ。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-new-menu">メニュー</Label>
            <select
              id="admin-new-menu"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={menuId}
              disabled={menusLoading || menusError}
              onChange={(e) => {
                setMenuId(e.target.value)
                setTrainerId("")
              }}
            >
              <option value="">選択してください</option>
              {menus.map((m) => (
                <option key={m.menu_id} value={m.menu_id}>
                  {m.name}
                </option>
              ))}
            </select>
            {menusLoading ? (
              <p className="text-xs text-muted-foreground">メニューを読み込み中…</p>
            ) : null}
            {menusError ? (
              <p className="text-xs text-destructive" role="alert">
                メニュー一覧の取得に失敗しました。GET /api/admin/menus を確認してください。
              </p>
            ) : null}
            {!menusLoading && !menusError && menus.length === 0 ? (
              <p className="text-xs text-destructive" role="alert">
                メニューが登録されていません。
              </p>
            ) : null}
            {menuId && durationMinutes === undefined ? (
              <p className="text-xs text-destructive" role="alert">
                このメニューに所要時間（分）が含まれていません。API のレスポンスに duration
                系フィールドがあるか確認してください。
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-new-date">開始日（{ADMIN_CALENDAR_TIME_ZONE}）</Label>
              <Input
                id="admin-new-date"
                type="date"
                min={minDateYmd}
                value={dateYmd}
                onChange={(e) => {
                  applyDateChange(e.target.value)
                  setTrainerId("")
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-new-time">開始時刻</Label>
              <Input
                id="admin-new-time"
                type="time"
                min={timeMin}
                value={timeHm}
                onChange={(e) => {
                  applyTimeChange(e.target.value)
                  setTrainerId("")
                }}
              />
              {dateYmd === minDateYmd ? (
                <p className="text-xs text-muted-foreground">
                  この日は {minTimeHmOnMinDate} 以降のみ選択できます。
                </p>
              ) : null}
            </div>
          </div>

          {canComputeWindow && endAtIso ? (
            <p className="text-xs text-muted-foreground">
              終了予定: {formatTimeInAdminCalendarTz(endAtIso)}（メニュー所要 {durationMinutes} 分）
            </p>
          ) : null}

          {!staffLoading && staffList.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="admin-new-trainer">担当者（スタッフ）</Label>
              <select
                id="admin-new-trainer"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
                value={trainerId}
                disabled={
                  !canComputeWindow ||
                  durationMinutes === undefined ||
                  staffEligibilityLoading ||
                  staffEligibilityError
                }
                onChange={(e) => setTrainerId(e.target.value)}
              >
                <option value="">
                  {!canComputeWindow || durationMinutes === undefined
                    ? "先にメニューと開始時刻を入力してください"
                    : staffEligibilityLoading
                      ? "担当者を確認しています…"
                      : staffEligibilityError
                        ? "取得に失敗しました"
                        : "選択してください"}
                </option>
                {staffList.map((s) => {
                  const ok = eligibleByStaffId[s.id] === true
                  const reason = blockReasonByStaffId[s.id]
                  return (
                    <option
                      key={s.id}
                      value={s.id}
                      disabled={!ok}
                      title={!ok ? newReservationStaffOptionTitle(reason) : undefined}
                    >
                      {s.name}
                      {!ok ? newReservationStaffOptionSuffix(reason) : ""}
                    </option>
                  )
                })}
              </select>
              {staffEligibilityLoading ? (
                <p className="text-xs text-muted-foreground">
                  予約一覧とシフトを照会しています…
                </p>
              ) : null}
              {staffEligibilityError ? (
                <p className="text-xs text-destructive" role="alert">
                  予約またはシフト情報の取得に失敗しました。
                </p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                ※メニューと開始時刻を入力すると、当該メニューの所要時間から終了時刻を算出し、その時間帯にシフトがあり、かつ確定予約と重複しないスタッフのみ選択できます。確定時はサーバー側でも再チェックされ、メニューと担当の対応（DB の{" "}
                <span className="font-mono">trainer_menus</span>）が無いと登録できません。
              </p>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="admin-new-cname">顧客名</Label>
            <Input
              id="admin-new-cname"
              autoComplete="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="山田 太郎"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-new-email">顧客メールアドレス</Label>
            <Input
              id="admin-new-email"
              type="email"
              autoComplete="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="example@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-new-cid">既存顧客 ID（任意）</Label>
            <Input
              id="admin-new-cid"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="指定するとその顧客に紐づけます"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-new-phone">顧客電話番号（任意）</Label>
            <Input
              id="admin-new-phone"
              type="tel"
              autoComplete="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="090-1234-5678"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-new-notes">メモ（任意）</Label>
            <textarea
              id="admin-new-notes"
              className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="スタッフ向けメモ"
            />
          </div>

          {formError ? (
            <p className="text-sm text-destructive" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              className="rounded-md"
              disabled={confirmDisabled}
              onClick={() => void handleConfirmClick()}
            >
              確認
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              onClick={() => navigate(ROUTES.adminHome)}
            >
              戻る
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
