import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ROUTES } from "@/constants/routes"
import { fetchAllReservationsForAdmin } from "@/features/admin/api/reservationsApi"
import {
  ageFromBirthday,
  buildCustomerDirectory,
  customerKey,
  ensureShowcaseCharts,
  genderLabel,
  importCustomerProfiles,
  kindLabel,
  normalizeChart,
  parseGender,
  parseKarteText,
  saveCustomerProfile,
  type CustomerGender,
  type CustomerKind,
  type ConversationEntry,
  type CustomerChart,
  type CustomerRecord,
} from "@/features/admin/lib/customerDirectory"
import {
  KARTE_TEMPLATES,
  SAMPLE_CONVERSATION,
  applyKarteTemplate,
  conversationDigest,
  parseConversationText,
} from "@/features/admin/lib/karteIntake"
import { prepareKarteImage, recognizeKarteImage } from "@/features/admin/lib/karteOcr"
import { recommendStyle } from "@/features/admin/lib/styleRecommendation"
import { useStaff } from "@/features/admin/hooks/useStaff"

function formatReservationWhen(iso: string): string {
  const date = iso.slice(0, 10).replaceAll("-", "/")
  const time = iso.slice(11, 16)
  return time ? `${date} ${time}` : date
}

const CHART_FIELDS: { key: "texture" | "length" | "hairRequest" | "preference" | "allergy" | "scalp" | "colorHistory" | "homeCare" | "notes"; label: string; rows: number }[] = [
  { key: "texture", label: "髪質", rows: 2 },
  { key: "length", label: "長さ・形", rows: 2 },
  { key: "hairRequest", label: "仕上がりの希望", rows: 3 },
  { key: "preference", label: "好み", rows: 2 },
  { key: "allergy", label: "アレルギー・禁忌", rows: 2 },
  { key: "scalp", label: "頭皮", rows: 2 },
  { key: "colorHistory", label: "カラー履歴", rows: 2 },
  { key: "homeCare", label: "ホームケア", rows: 2 },
  { key: "notes", label: "施術メモ", rows: 3 },
]

function speakerLabel(speaker: ConversationEntry["speaker"]): string {
  if (speaker === "customer") return "お客様"
  if (speaker === "stylist") return "スタイリスト"
  return "メモ"
}

function sourceLabel(source: ConversationEntry["source"]): string {
  if (source === "chair") return "椅子の横"
  if (source === "line") return "LINE"
  if (source === "phone") return "電話"
  return "取り込み"
}

const SAMPLE_KARTE = `氏名: 森 あかり
電話: 09077778888
髪質: 猫っ毛、細毛
希望: 顔まわりにレイヤー。重くしない
アレルギー: なし
好み: ナチュラル。真っ黒は避ける
メモ: 前回は耳上1cm。次はもう少し残す`

function statusLabel(status: CustomerRecord["reservations"][number]["status"]): string {
  if (status === "CONFIRMED") return "予約確定"
  if (status === "COMPLETED") return "完了"
  if (status === "CANCELLED") return "キャンセル"
  return "無断キャンセル"
}

export function AdminCustomersPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
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
  const [karteText, setKarteText] = useState("")
  const [readingPhoto, setReadingPhoto] = useState(false)
  const [talkDraft, setTalkDraft] = useState("")
  const [talkPaste, setTalkPaste] = useState("")
  const [templateNote, setTemplateNote] = useState("")

  async function reload() {
    setLoading(true)
    setError("")
    try {
      ensureShowcaseCharts()
      const reservations = await fetchAllReservationsForAdmin(staffList)
      const next = buildCustomerDirectory(reservations)
      setRecords(next)
      const requested = params.get("customer") ?? ""
      setSelectedKey((current) => {
        if (requested && next.some((record) => record.key === requested)) return requested
        if (current && next.some((record) => record.key === current)) return current
        return next[0]?.key || ""
      })
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

  function updateChart(patch: Partial<CustomerChart>) {
    setDraft((current) => (current ? { ...current, chart: { ...current.chart, ...patch } } : current))
    setSaveMessage("")
  }

  function selectCustomer(key: string) {
    setSelectedKey(key)
    setParams({ customer: key }, { replace: true })
  }

  function handleTemplate(templateId: string, mode: "fill" | "replace") {
    const template = KARTE_TEMPLATES.find((item) => item.id === templateId)
    if (!draft || !template) return
    updateChart(applyKarteTemplate(draft.chart, template, mode))
    setTemplateNote(
      mode === "replace"
        ? `「${template.name}」でカルテの項目を書き直しました。会話と写真はそのままです。`
        : `「${template.name}」の空欄だけ埋めました。`,
    )
  }

  function appendTalks(entries: ConversationEntry[]) {
    if (!draft || entries.length === 0) return
    const stamped = entries.map((entry, index) => ({ ...entry, id: `talk-${Date.now()}-${index}` }))
    updateChart({ conversationLogs: [...draft.chart.conversationLogs, ...stamped] })
  }

  function handleTalkPaste() {
    const entries = parseConversationText(talkPaste)
    appendTalks(entries)
    setTalkPaste("")
    setTemplateNote(entries.length ? `${entries.length}件の会話をカルテに足しました。` : "会話として読める行がありません。")
  }

  function handleDigest() {
    if (!draft) return
    const digest = conversationDigest(draft.chart.conversationLogs)
    if (!digest) {
      setTemplateNote("会話がまだないので、メモには足せません。")
      return
    }
    const marker = "会話の要点"
    const notes = draft.chart.notes.includes(marker)
      ? draft.chart.notes.replace(new RegExp(`${marker}[\\s\\S]*$`), `${marker}\n${digest}`)
      : [draft.chart.notes, marker, digest].filter(Boolean).join("\n")
    updateChart({ notes })
    setTemplateNote("直近の会話を施術メモへ写しました。保存すると残ります。")
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

  function applyParsedKarte(text: string, photo?: { name: string; data: string }, message?: string) {
    const parsed = parseKarteText(text)
    if (!parsed?.key || !parsed.chart) {
      setImportMessage("氏名か電話番号のあるカルテとして読み取れませんでした。")
      return
    }
    const chart = normalizeChart({
      ...parsed.chart,
      photoName: photo?.name || parsed.chart.photoName,
      photoData: photo?.data || parsed.chart.photoData,
    })
    saveCustomerProfile({
      key: parsed.key,
      name: parsed.name ?? "",
      furigana: parsed.furigana ?? "",
      email: parsed.email ?? "",
      phone: parsed.phone ?? "",
      birthday: parsed.birthday ?? "",
      gender: parsed.gender ?? "",
      kind: parsed.kind ?? "existing",
      chart,
    })
    setSelectedKey(parsed.key)
    setImportMessage(message ?? (photo ? "写真付きカルテを項目に反映しました。" : "カルテの項目を反映しました。"))
    void reload()
  }

  async function handlePhoto(file: File) {
    setReadingPhoto(true)
    setImportMessage("カルテ写真の文字を読み取っています。")
    try {
      const prepared = await prepareKarteImage(file)
      const text = await recognizeKarteImage(prepared.ocrBlob)
      setKarteText(text)
      const parsed = parseKarteText(text)
      if (parsed?.key && parsed.chart) {
        applyParsedKarte(text, { name: file.name, data: prepared.previewUrl }, "写真から文字を読み取り、項目に反映しました。内容を確認して保存してください。")
        return
      }
      if (draft) {
        saveCustomerProfile({
          key: draft.key,
          name: draft.name,
          furigana: draft.furigana,
          email: draft.email,
          phone: draft.phone,
          birthday: draft.birthday,
          gender: draft.gender,
          kind: draft.kind,
          chart: normalizeChart({
            ...draft.chart,
            photoName: file.name,
            photoData: prepared.previewUrl,
            notes: [draft.chart.notes, text].filter(Boolean).join("\n"),
            updatedAt: new Date().toISOString(),
          }),
        })
        setImportMessage(
          text
            ? "氏名か電話番号を読み取れなかったので、文字をメモに残しました。確認して保存してください。"
            : "文字を読み取れませんでした。写真は添付してあります。",
        )
        void reload()
        return
      }
      setImportMessage(
        text
          ? "文字は読み取りました。氏名と電話を確認してから項目に反映してください。"
          : "文字を読み取れませんでした。",
      )
    } catch {
      setImportMessage("写真の読み取りに失敗しました。テキストから項目を入れられます。")
    } finally {
      setReadingPhoto(false)
    }
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
            chart: normalizeChart({}),
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
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground">KARTE</p>
        <h1 className="text-lg font-semibold tracking-tight">顧客カルテ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          この店の本体です。テンプレで枠を入れ、写真の文字と会話をカルテへ残します。予約と売上は補助です。
        </p>
        <nav className="mt-3 flex flex-wrap gap-2 text-sm" aria-label="サブ機能">
          {[
            [ROUTES.adminReservationLedger, "予約台帳"],
            [ROUTES.adminSales, "売上"],
            [ROUTES.adminCalendar, "カレンダー"],
            [ROUTES.adminShiftCalendar, "シフト"],
          ].map(([to, label]) => (
            <Link key={to} to={to} className="rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid gap-2 sm:grid-cols-4">
        {[
          { label: "顧客", value: `${records.length}人` },
          { label: "カルテ未入力", value: `${records.filter((record) => !record.chart.updatedAt).length}人` },
          { label: "予約不可", value: `${records.filter((record) => record.blocked).length}人` },
          {
            label: "次の来店予定",
            value: `${records.filter((record) => record.reservations.some((reservation) => reservation.status === "CONFIRMED" && reservation.startAt >= new Date().toISOString())).length}人`,
          },
        ].map((item) => (
          <section key={item.label} className="rounded-lg border border-border bg-card px-3 py-2">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-semibold">{item.value}</p>
          </section>
        ))}
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
                  onClick={() => selectCustomer(record.key)}
                  className={`w-full rounded-[1.25rem] px-3 py-2 text-left text-sm ${
                    selected?.key === record.key ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                  }`}
                >
                  <span className="block font-medium">{record.name || "名前未登録"}</span>
                  <span className="block text-xs opacity-80">
                    {record.chart.texture || record.phone || "カルテ未記入"}
                    {record.chart.conversationLogs.length ? ` / 会話${record.chart.conversationLogs.length}` : ""}
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
            {(() => {
              const nextVisit = [...draft.reservations]
                .filter((reservation) => reservation.status === "CONFIRMED")
                .sort((a, b) => a.startAt.localeCompare(b.startAt))
                .find((reservation) => reservation.startAt >= new Date().toISOString())
              if (!nextVisit) return null
              return (
                <p className="text-sm text-muted-foreground">
                  次の来店は {nextVisit.startAt.slice(0, 10).replaceAll("-", "/")} {nextVisit.startAt.slice(11, 16)} {nextVisit.menuName}
                </p>
              )
            })()}
            <details className="rounded-[1.25rem] border border-border px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">連絡先と来店区分</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
            </details>

            {(() => {
              const suggestion = recommendStyle(draft)
              const allergyHot = draft.chart.allergy.trim() && !/^なし/.test(draft.chart.allergy.trim())
              return (
                <div className="space-y-2 rounded-[1.25rem] bg-primary px-4 py-3 text-primary-foreground">
                  <h3 className="text-sm font-semibold">次のカット</h3>
                  <p className="text-base font-medium">{suggestion.cut}</p>
                  <p className="text-sm leading-relaxed text-primary-foreground/80">{suggestion.reason}</p>
                  <p className="text-xs text-primary-foreground/80">提案メニュー: {suggestion.menu}</p>
                  {allergyHot ? <p className="text-sm font-medium">禁忌: {draft.chart.allergy}</p> : null}
                </div>
              )
            })()}

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">テンプレカルテ</h3>
              <div className="flex flex-wrap gap-2">
                {KARTE_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    title={template.summary}
                    className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground"
                    onClick={() => handleTemplate(template.id, "fill")}
                  >
                    {template.name}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {KARTE_TEMPLATES.map((template) => (
                  <button
                    key={`${template.id}-replace`}
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-xs"
                    onClick={() => handleTemplate(template.id, "replace")}
                  >
                    {template.name}で書き直す
                  </button>
                ))}
              </div>
              {templateNote ? <p className="text-xs text-muted-foreground">{templateNote}</p> : null}
            </div>

            <div className="space-y-3 rounded-[1.25rem] border border-border p-4">
              <h3 className="text-sm font-semibold">カルテ</h3>
              {draft.chart.photoData ? (
                <img src={draft.chart.photoData} alt="カルテ写真" className="max-h-40 rounded-[1.25rem] border border-border" />
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                {CHART_FIELDS.map((field) => (
                  <label key={field.key} className="block text-xs text-muted-foreground" htmlFor={`chart-${field.key}`}>
                    {field.label}
                    <textarea
                      id={`chart-${field.key}`}
                      rows={field.rows}
                      className="mt-1 w-full rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm text-foreground"
                      value={String(draft.chart[field.key] ?? "")}
                      onChange={(event) => updateChart({ [field.key]: event.target.value })}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-[1.25rem] border border-border p-4">
              <h3 className="text-sm font-semibold">会話ログ</h3>
              <ul className="space-y-2">
                {draft.chart.conversationLogs.length === 0 ? (
                  <li className="text-sm text-muted-foreground">まだ会話はありません。椅子の横の一言か、LINEの貼り付けを残します。</li>
                ) : (
                  draft.chart.conversationLogs.map((entry) => (
                    <li
                      key={entry.id}
                      className={`rounded-[1.25rem] px-3 py-2 text-sm ${
                        entry.speaker === "customer"
                          ? "bg-accent"
                          : entry.speaker === "stylist"
                            ? "bg-secondary"
                            : "bg-muted"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">
                        {speakerLabel(entry.speaker)} / {sourceLabel(entry.source)}
                      </p>
                      <p>{entry.text}</p>
                      <button
                        type="button"
                        className="mt-1 text-xs underline"
                        onClick={() =>
                          updateChart({
                            conversationLogs: draft.chart.conversationLogs.filter((item) => item.id !== entry.id),
                          })
                        }
                      >
                        外す
                      </button>
                    </li>
                  ))
                )}
              </ul>
              <label className="block text-xs text-muted-foreground" htmlFor="talk-draft">
                椅子の横で足す
                <textarea
                  id="talk-draft"
                  value={talkDraft}
                  placeholder="お客様: 前髪はもう少し残して"
                  className="mt-1 min-h-16 w-full rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm text-foreground"
                  onChange={(event) => setTalkDraft(event.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!talkDraft.trim()}
                  onClick={() => {
                    appendTalks(parseConversationText(talkDraft.includes(":") || talkDraft.includes("：") ? talkDraft : `スタイリスト: ${talkDraft}`))
                    setTalkDraft("")
                  }}
                >
                  会話に足す
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleDigest}>
                  要点を施術メモへ
                </Button>
              </div>
              <label className="block text-xs text-muted-foreground" htmlFor="talk-paste">
                会話の貼り付け（お客様 / スタイリスト / メモ）
                <textarea
                  id="talk-paste"
                  value={talkPaste}
                  placeholder={SAMPLE_CONVERSATION}
                  className="mt-1 min-h-24 w-full rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm text-foreground"
                  onChange={(event) => setTalkPaste(event.target.value)}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" disabled={!talkPaste.trim()} onClick={handleTalkPaste}>
                  貼り付けを取り込む
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setTalkPaste(SAMPLE_CONVERSATION)}>
                  会話の例を入れる
                </Button>
              </div>
            </div>

            <details className="rounded-[1.25rem] border border-border px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">テキストと写真から取り込む</summary>
              <div className="mt-3 space-y-3">
              <p className="text-xs text-muted-foreground">
                項目つきの文章を分けます。写真は文字を読み、確認してから保存します。
              </p>
              <textarea
                value={karteText}
                placeholder={SAMPLE_KARTE}
                className="min-h-24 w-full rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm"
                onChange={(event) => setKarteText(event.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={!karteText.trim()}
                  onClick={() => {
                    applyParsedKarte(karteText)
                    setKarteText("")
                  }}
                >
                  テキストを項目に反映
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => applyParsedKarte(SAMPLE_KARTE)}>
                  手書きカルテの例を反映
                </Button>
                <label className="inline-flex cursor-pointer items-center rounded-full border border-input px-3 py-1.5 text-sm">
                  {readingPhoto ? "読み取り中..." : "写真から文字を読み取る"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="sr-only"
                    disabled={readingPhoto}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void handlePhoto(file)
                      event.target.value = ""
                    }}
                  />
                </label>
              </div>
              </div>
            </details>

            <div className="flex items-center gap-3">
              <Button type="button" onClick={handleSaveProfile}>
                保存
              </Button>
              {saveMessage ? <p className="text-sm text-muted-foreground">{saveMessage}</p> : null}
            </div>

            <details className="rounded-[1.25rem] border border-border px-4 py-3">
              <summary className="cursor-pointer text-sm font-medium">来店履歴</summary>
              <h3 className="sr-only">来店履歴</h3>
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
            </details>
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
