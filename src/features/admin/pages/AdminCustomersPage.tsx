import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import { fetchAllReservationsForAdmin } from "@/features/admin/api/reservationsApi"
import {
  ageFromBirthday,
  buildCustomerDirectory,
  customerKey,
  genderLabel,
  importCustomerProfiles,
  kindLabel,
  parseGender,
  saveCustomerProfile,
  type CustomerGender,
  type CustomerKind,
  type CustomerRecord,
} from "@/features/admin/lib/customerDirectory"
import { useStaff } from "@/features/admin/hooks/useStaff"

function formatReservationWhen(iso: string): string {
  const date = iso.slice(0, 10).replaceAll("-", "/")
  const time = iso.slice(11, 16)
  return time ? `${date} ${time}` : date
}

function statusLabel(status: CustomerRecord["reservations"][number]["status"]): string {
  if (status === "CONFIRMED") return "予約確定"
  if (status === "COMPLETED") return "完了"
  if (status === "CANCELLED") return "キャンセル"
  return "無断キャンセル"
}

export function AdminCustomersPage() {
  const navigate = useNavigate()
  const { staffList, loading: staffLoading } = useStaff()
  const [records, setRecords] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [genderFilter, setGenderFilter] = useState<CustomerGender | "all">("all")
  const [kindFilter, setKindFilter] = useState<CustomerKind | "all">("all")
  const [blockedOnly, setBlockedOnly] = useState(false)
  const [selectedKey, setSelectedKey] = useState("")
  const [draft, setDraft] = useState<CustomerRecord | null>(null)
  const [saveMessage, setSaveMessage] = useState("")
  const [importMessage, setImportMessage] = useState("")

  async function reload() {
    setLoading(true)
    setError("")
    try {
      const reservations = await fetchAllReservationsForAdmin(staffList)
      const next = buildCustomerDirectory(reservations)
      setRecords(next)
      setSelectedKey((current) => current || next[0]?.key || "")
    } catch (cause) {
      if (cause instanceof Error && cause.message === "UNAUTHORIZED") {
        navigate(ROUTES.backofficeLogin, { replace: true })
        return
      }
      setError("顧客一覧を取得できませんでした。")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (staffLoading) return
    void reload()
  }, [staffLoading])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return records.filter((record) => {
      if (blockedOnly && !record.blocked) return false
      if (genderFilter !== "all" && record.gender !== genderFilter) return false
      if (kindFilter !== "all" && record.kind !== kindFilter) return false
      if (!needle) return true
      return [record.name, record.furigana, record.email, record.phone]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [blockedOnly, genderFilter, kindFilter, query, records])

  const selected = records.find((record) => record.key === selectedKey) ?? filtered[0] ?? null

  useEffect(() => {
    setDraft(selected)
    setSaveMessage("")
  }, [selected])

  function updateDraft(patch: Partial<CustomerRecord>) {
    setDraft((current) => (current ? { ...current, ...patch } : current))
    setSaveMessage("")
  }

  function handleSaveProfile() {
    if (!draft) return
    const key = customerKey(draft.phone, draft.email) || draft.key
    saveCustomerProfile({
      key,
      name: draft.name.trim(),
      furigana: draft.furigana.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      birthday: draft.birthday,
      gender: draft.gender,
      kind: draft.kind,
      chart: {
        ...draft.chart,
        updatedAt: new Date().toISOString(),
      },
    })
    setSaveMessage("顧客情報とカルテを保存しました。")
    void reload()
  }

  function handleImport(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? "")
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
      const profiles = lines.slice(lines[0]?.includes("名前") || lines[0]?.toLowerCase().includes("name") ? 1 : 0)
        .map((line) => line.split(",").map((cell) => cell.trim()))
        .map(([name, phone, email, furigana, birthday, gender]) => {
          const key = customerKey(phone ?? "", email ?? "")
          return {
            key,
            name: name ?? "",
            phone: phone ?? "",
            email: email ?? "",
            furigana: furigana ?? "",
            birthday: birthday ?? "",
            gender: parseGender(gender ?? ""),
            kind: "existing" as const,
            chart: { hairRequest: "", allergy: "", notes: "", updatedAt: "" },
          }
        })
        .filter((profile) => profile.key && profile.name)
      const count = importCustomerProfiles(profiles)
      setImportMessage(`${count}件の顧客を取り込みました。`)
      void reload()
    }
    reader.readAsText(file, "utf-8")
  }

  const age = draft ? ageFromBirthday(draft.birthday) : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">顧客マスタ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          名前・電話番号・メールで検索し、来店履歴とカルテを確認します。無断キャンセル3回で予約不可になります。
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="space-y-3 rounded-lg border border-border bg-card p-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="名前、フリガナ、電話、メール"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={genderFilter}
              onChange={(event) => setGenderFilter(event.target.value as CustomerGender | "all")}
            >
              <option value="all">性別すべて</option>
              <option value="female">女性</option>
              <option value="male">男性</option>
              <option value="unspecified">未指定</option>
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-2 text-sm"
              value={kindFilter}
              onChange={(event) => setKindFilter(event.target.value as CustomerKind | "all")}
            >
              <option value="all">新規・既存</option>
              <option value="new">新規</option>
              <option value="existing">既存</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={blockedOnly}
              onChange={(event) => setBlockedOnly(event.target.checked)}
            />
            予約不可のみ
          </label>
          <label className="block text-xs text-muted-foreground">
            CSV取り込み（名前,電話,メール,フリガナ,生年月日,性別）
            <input
              type="file"
              accept=".csv,text/csv"
              className="mt-1 block w-full text-sm"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) handleImport(file)
                event.target.value = ""
              }}
            />
          </label>
          {importMessage ? <p className="text-xs text-muted-foreground">{importMessage}</p> : null}
          {loading ? <p className="text-sm text-muted-foreground">読み込み中...</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <ul className="max-h-[32rem] space-y-1 overflow-auto">
            {filtered.map((record) => (
              <li key={record.key}>
                <button
                  type="button"
                  onClick={() => setSelectedKey(record.key)}
                  className={`w-full rounded-md px-3 py-2 text-left text-sm ${
                    selected?.key === record.key ? "bg-foreground text-background" : "hover:bg-muted"
                  }`}
                >
                  <span className="block font-medium">{record.name || "名前未登録"}</span>
                  <span className="block text-xs opacity-80">
                    {record.phone || record.email || "連絡先未登録"}
                    {record.blocked ? " / 予約不可" : ""}
                  </span>
                </button>
              </li>
            ))}
            {!loading && filtered.length === 0 ? (
              <li className="text-sm text-muted-foreground">該当する顧客はいません。</li>
            ) : null}
          </ul>
        </section>

        {draft ? (
          <section className="space-y-4 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold">{draft.name || "顧客詳細"}</h2>
              {draft.blocked ? (
                <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  予約不可（無断{draft.noShowCount}回）
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">来店 {draft.visitCount}回</span>
              )}
            </div>
            {draft.recommendedMenu ? (
              <p className="rounded-md bg-muted px-3 py-2 text-sm">
                次回候補: {draft.recommendedMenu}（これまでの予約で多いメニュー）
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="customer-name">名前</Label>
                <Input id="customer-name" value={draft.name} onChange={(event) => updateDraft({ name: event.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customer-furigana">フリガナ</Label>
                <Input
                  id="customer-furigana"
                  value={draft.furigana}
                  onChange={(event) => updateDraft({ furigana: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customer-phone">電話番号</Label>
                <Input id="customer-phone" value={draft.phone} onChange={(event) => updateDraft({ phone: event.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customer-email">メール</Label>
                <Input id="customer-email" value={draft.email} onChange={(event) => updateDraft({ email: event.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="customer-birthday">誕生日</Label>
                <Input
                  id="customer-birthday"
                  type="date"
                  value={draft.birthday}
                  onChange={(event) => updateDraft({ birthday: event.target.value })}
                />
                <p className="text-xs text-muted-foreground">{age == null ? "年齢未算出" : `${age}歳`}</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="customer-gender">性別</Label>
                <select
                  id="customer-gender"
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={draft.gender}
                  onChange={(event) => updateDraft({ gender: event.target.value as CustomerGender })}
                >
                  <option value="">未登録</option>
                  <option value="female">女性</option>
                  <option value="male">男性</option>
                  <option value="unspecified">未指定</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="customer-kind">新規 / 既存</Label>
                <select
                  id="customer-kind"
                  className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={draft.kind}
                  onChange={(event) => updateDraft({ kind: event.target.value as CustomerKind })}
                >
                  <option value="">未登録</option>
                  <option value="new">新規</option>
                  <option value="existing">既存</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 rounded-md border border-border p-3">
              <h3 className="text-sm font-semibold">カルテ</h3>
              <p className="text-xs text-muted-foreground">
                来店前にデジタルで残す問診です。髪型の希望、アレルギー、施術メモを保存します。
              </p>
              <label className="block text-xs text-muted-foreground" htmlFor="chart-hair">
                髪型・仕上がりの希望
                <textarea
                  id="chart-hair"
                  className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={draft.chart.hairRequest}
                  onChange={(event) =>
                    updateDraft({ chart: { ...draft.chart, hairRequest: event.target.value } })
                  }
                />
              </label>
              <label className="block text-xs text-muted-foreground" htmlFor="chart-allergy">
                アレルギー・禁忌
                <textarea
                  id="chart-allergy"
                  className="mt-1 min-h-16 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={draft.chart.allergy}
                  onChange={(event) => updateDraft({ chart: { ...draft.chart, allergy: event.target.value } })}
                />
              </label>
              <label className="block text-xs text-muted-foreground" htmlFor="chart-notes">
                施術メモ
                <textarea
                  id="chart-notes"
                  className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={draft.chart.notes}
                  onChange={(event) => updateDraft({ chart: { ...draft.chart, notes: event.target.value } })}
                />
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Button type="button" onClick={handleSaveProfile}>
                保存
              </Button>
              {saveMessage ? <p className="text-sm text-muted-foreground">{saveMessage}</p> : null}
            </div>

            <div>
              <h3 className="text-sm font-semibold">来店履歴</h3>
              <ul className="mt-2 divide-y divide-border text-sm">
                {draft.reservations.length === 0 ? (
                  <li className="py-2 text-muted-foreground">予約履歴はまだありません。</li>
                ) : (
                  draft.reservations.map((reservation) => (
                    <li key={reservation.id} className="flex items-center justify-between gap-3 py-2">
                      <span>
                        {formatReservationWhen(reservation.startAt)}
                        <span className="ml-2 text-muted-foreground">{reservation.menuName || "メニュー未設定"}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">{statusLabel(reservation.status)}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <p className="text-xs text-muted-foreground">
              性別: {genderLabel(draft.gender)} / {kindLabel(draft.kind)}
            </p>
          </section>
        ) : (
          <p className="text-sm text-muted-foreground">顧客を選ぶと詳細とカルテを編集できます。</p>
        )}
      </div>
    </div>
  )
}
