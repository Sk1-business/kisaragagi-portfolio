import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import { fetchAdminMenus, filterBookableMenus } from "@/features/admin/api/menusApi"
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

/** 時・分の文字列から `HH:mm` を組み立てる（どちらか空なら null） */
function tryBuildTimeHm(hourStr: string, minuteStr: string): string | null {
  const hs = hourStr.trim()
  const ms = minuteStr.trim()
  if (hs === "" || ms === "") return null
  const hNum = Number(hs)
  const mNum = Number(ms)
  if (!Number.isFinite(hNum) || !Number.isFinite(mNum)) return null
  if (hNum < 0 || hNum > 23 || mNum < 0 || mNum > 59) return null
  return `${String(hNum).padStart(2, "0")}:${String(mNum).padStart(2, "0")}`
}

function splitTimeHm(timeHm: string): { hour: string; minute: string } {
  const m = /^(\d{2}):(\d{2})$/.exec(timeHm.trim())
  if (!m) return { hour: "", minute: "" }
  return { hour: String(Number(m[1])), minute: m[2] }
}

function filterDigitsMax2(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 2)
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
  const [hourStr, setHourStr] = useState(() => splitTimeHm(initialSlot.timeHm).hour)
  const [minuteStr, setMinuteStr] = useState(() => splitTimeHm(initialSlot.timeHm).minute)
  const [trainerId, setTrainerId] = useState(() => initialDraft?.trainerId ?? "")
  const [customerName, setCustomerName] = useState(() => initialDraft?.customerName ?? "")
  const [customerEmail, setCustomerEmail] = useState(() => initialDraft?.customerEmail ?? "")
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

  const timeHm = useMemo(() => tryBuildTimeHm(hourStr, minuteStr), [hourStr, minuteStr])

  /**
   * `bookingNotBeforeIso` 未満にならないよう日付・時刻を補正する。
   * 時・分の入力中は呼ばない（キー入力のたびに走ると「1」が「08」などに化けるため）。
   */
  function commitSlotToBookingMin(
    date: string,
    hour: string,
    minute: string,
  ): void {
    const hm = tryBuildTimeHm(hour, minute)
    if (!hm) return
    const s = ensureSlotNotBeforeAdminTz(date, hm, bookingNotBeforeIso)
    setDateYmd(s.dateYmd)
    const { hour: h, minute: m } = splitTimeHm(s.timeHm)
    setHourStr(h)
    setMinuteStr(m)
  }

  /** カレンダーで開始日を変えたときだけ、時刻を下限に合わせて補正 */
  useEffect(() => {
    commitSlotToBookingMin(dateYmd, hourStr, minuteStr)
    // hourStr / minuteStr は依存に含めない（入力中に再実行しない）
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dateYmd（開始日）の変更時のみ
  }, [dateYmd, bookingNotBeforeIso])

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
        setMenus(filterBookableMenus(list))
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
    if (menusLoading || menusError) return
    if (!menuId.trim()) return
    if (!menus.some((m) => m.menu_id === menuId)) {
      setMenuId("")
    }
  }, [menus, menusLoading, menusError, menuId])

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
      const parts = splitTimeHm(s.timeHm)
      setHourStr(parts.hour)
      setMinuteStr(parts.minute)
      setTrainerId(draft.trainerId)
      setCustomerName(draft.customerName)
      setCustomerEmail(draft.customerEmail)
      setCustomerPhone(draft.customerPhone ?? "")
      setNotes(draft.notes ?? "")
      return
    }

    const slot = defaultNextReservationSlotAdminTz(bookingIso)
    setDateYmd(slot.dateYmd)
    const slotParts = splitTimeHm(slot.timeHm)
    setHourStr(slotParts.hour)
    setMinuteStr(slotParts.minute)
    setMenuId("")
    setTrainerId("")
    setCustomerName("")
    setCustomerEmail("")
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
    setDateYmd(nextDateYmd)
  }

  function handleHourDigitsInput(raw: string) {
    const d = filterDigitsMax2(raw)
    let next = d
    if (d.length === 2) {
      const n = Number(d)
      if (n > 23) next = "23"
    }
    setHourStr(next)
  }

  function handleMinuteDigitsInput(raw: string) {
    const d = filterDigitsMax2(raw)
    let next = d
    if (d.length === 2) {
      const n = Number(d)
      if (n > 59) next = "59"
    }
    setMinuteStr(next)
  }

  function handleHourBlur() {
    commitSlotToBookingMin(dateYmd, hourStr, minuteStr)
  }

  function handleMinuteBlur() {
    const d = minuteStr.replace(/\D/g, "")
    let nextMin = minuteStr
    if (d !== "") {
      const n = Math.min(59, Math.max(0, Number(d)))
      if (Number.isFinite(n)) nextMin = String(n).padStart(2, "0")
    } else {
      nextMin = ""
    }
    setMinuteStr(nextMin)
    commitSlotToBookingMin(dateYmd, hourStr, nextMin)
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
    const ensuredSlot = (() => {
      const hm = tryBuildTimeHm(hourStr, minuteStr)
      if (!hm) return null
      return ensureSlotNotBeforeAdminTz(dateYmd, hm, bookingNotBeforeIso)
    })()
    if (!ensuredSlot) {
      setFormError("日付と時刻を入力してください。")
      return
    }
    const finalDateYmd = ensuredSlot.dateYmd
    const finalTimeHm = ensuredSlot.timeHm
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
      dateYmd: finalDateYmd,
      timeHm: finalTimeHm,
      durationMinutes,
      trainerId: trainerId.trim(),
      trainerName,
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
    }
    navigate(ROUTES.adminNewReservationConfirm, { state: draft })
  }

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
            任意: 電話、メモ。
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
              <Label htmlFor="admin-new-hour">開始時刻</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  id="admin-new-hour"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="w-14 tabular-nums"
                  maxLength={2}
                  value={hourStr}
                  placeholder="0-23"
                  onChange={(e) => {
                    handleHourDigitsInput(e.target.value)
                    setTrainerId("")
                  }}
                  onBlur={handleHourBlur}
                  aria-label="時（0〜23、数字のみ）"
                />
                <span className="select-none text-muted-foreground" aria-hidden>
                  :
                </span>
                <Input
                  id="admin-new-minute"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  className="w-14 tabular-nums"
                  maxLength={2}
                  value={minuteStr}
                  placeholder="00-59"
                  onChange={(e) => {
                    handleMinuteDigitsInput(e.target.value)
                    setTrainerId("")
                  }}
                  onBlur={handleMinuteBlur}
                  aria-label="分（00〜59、数字のみ）"
                />
              </div>
              {dateYmd === minDateYmd ? (
                <p className="text-xs text-muted-foreground">
                  この日は {minTimeHmOnMinDate} 以降のみ選択できます（入力後に自動で調整される場合があります）。
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
