import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  fetchHotpepperSettings,
  importHotpepperCsv,
  importHotpepperEmail,
  saveHotpepperSettings,
  type HotpepperCoupon,
  type HotpepperMail,
} from "@/features/admin/api/hotpepperApi"

const SAMPLE_CSV = `予約日,開始時刻,終了時刻,スタイリスト,メニュー,お客様名,電話番号,経路
2026-11-16,13:00,14:00,青井 凛,カット,CSV 花,09066667777,ホットペッパー`

export function AdminHotpepperCard() {
  const [url, setUrl] = useState("")
  const [coupons, setCoupons] = useState<HotpepperCoupon[]>([])
  const [emails, setEmails] = useState<HotpepperMail[]>([])
  const [mailText, setMailText] = useState("")
  const [csv, setCsv] = useState(SAMPLE_CSV)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true
    void fetchHotpepperSettings()
      .then((settings) => {
        if (!active) return
        setUrl(settings.hotpepper_url ?? "")
        setCoupons(settings.coupons ?? [])
        setEmails(settings.emails ?? [])
      })
      .catch(() => {
        if (active) setError("ホットペッパー設定を読み込めませんでした。")
      })
    return () => {
      active = false
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const saved = await saveHotpepperSettings({
        hotpepper_url: url.trim(),
        coupons: coupons.filter((coupon) => coupon.title.trim()),
      })
      setCoupons(saved.coupons)
      setMessage("掲載情報を保存しました。")
    } catch {
      setError("保存に失敗しました。")
    } finally {
      setSaving(false)
    }
  }

  async function handleEmailImport(input: { email_id?: string; text?: string }) {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const result = await importHotpepperEmail(input)
      const detail = result.errors.length > 0 ? result.errors.join(" / ") : ""
      setMessage(
        result.imported > 0
          ? `${result.imported}件の予約メールを台帳に反映しました。`
          : detail || "取り込みませんでした。",
      )
      const settings = await fetchHotpepperSettings()
      setEmails(settings.emails ?? [])
    } catch {
      setError("予約メールの取り込みに失敗しました。")
    } finally {
      setSaving(false)
    }
  }

  async function handleImport() {
    setSaving(true)
    setError("")
    setMessage("")
    try {
      const result = await importHotpepperCsv(csv)
      const detail = result.errors.length > 0 ? ` ${result.errors.join(" / ")}` : ""
      setMessage(`${result.imported}件を予約台帳に取り込みました。${detail}`)
    } catch {
      setError("CSVの取り込みに失敗しました。")
    } finally {
      setSaving(false)
    }
  }

  function updateCoupon(index: number, patch: Partial<HotpepperCoupon>) {
    setCoupons((current) => current.map((coupon, i) => (i === index ? { ...coupon, ...patch } : coupon)))
  }

  return (
    <Card className="border-border shadow-xs sm:col-span-2">
      <CardHeader>
        <CardTitle className="text-base">ホットペッパー</CardTitle>
        <CardDescription>
          掲載ページとクーポンに加え、サロンに届く予約メールを読み取って台帳へ反映します。ホットペッパーの画面は取得しません。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="hotpepper-url">掲載ページURL</Label>
          <Input
            id="hotpepper-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://beauty.hotpepper.jp/"
          />
        </div>
        <div className="space-y-3">
          <p className="text-sm font-medium">クーポン</p>
          {coupons.map((coupon, index) => (
            <div key={coupon.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_8rem]">
              <Input
                value={coupon.title}
                onChange={(event) => updateCoupon(index, { title: event.target.value })}
                placeholder="クーポン名"
              />
              <Input
                value={coupon.description}
                onChange={(event) => updateCoupon(index, { description: event.target.value })}
                placeholder="説明"
              />
              <Input
                type="number"
                value={coupon.price_yen}
                onChange={(event) => updateCoupon(index, { price_yen: Number(event.target.value) })}
                placeholder="価格"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setCoupons((current) => [
                ...current,
                { id: `coupon_${current.length + 1}`, title: "", description: "", price_yen: 0 },
              ])
            }
          >
            クーポンを追加
          </Button>
        </div>
        <Button type="button" onClick={() => void handleSave()} disabled={saving}>
          掲載情報を保存
        </Button>
        <div className="space-y-3">
          <p className="text-sm font-medium">届いた予約メール</p>
          <p className="text-xs text-muted-foreground">
            ホットペッパーからサロンのメールアドレスへ届く予約通知を読み取ります。
          </p>
          {emails.length === 0 ? (
            <p className="text-sm text-muted-foreground">未取り込みのメールはありません。</p>
          ) : (
            <ul className="space-y-3">
              {emails.map((mail) => (
                <li key={mail.id} className="rounded-md border border-border p-3">
                  <p className="text-sm font-medium">{mail.subject}</p>
                  <p className="text-xs text-muted-foreground">{mail.from}</p>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{mail.body}</pre>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    disabled={saving || mail.imported}
                    onClick={() => void handleEmailImport({ email_id: mail.id })}
                  >
                    {mail.imported ? "取り込み済み" : "台帳に反映する"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <Label htmlFor="hotpepper-mail">メール本文を貼り付け</Label>
          <textarea
            id="hotpepper-mail"
            value={mailText}
            onChange={(event) => setMailText(event.target.value)}
            rows={5}
            placeholder={"予約日時：2026年11月20日 15:00\nメニュー：カット\n氏名：森 あかり\n電話番号：09077778888"}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleEmailImport({ text: mailText })}
            disabled={saving || !mailText.trim()}
          >
            貼り付けたメールを取り込む
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hotpepper-csv">予約CSV</Label>
          <p className="text-xs text-muted-foreground">
            列: 予約日,開始時刻,終了時刻,スタイリスト,メニュー,お客様名,電話番号,経路
          </p>
          <textarea
            id="hotpepper-csv"
            value={csv}
            onChange={(event) => setCsv(event.target.value)}
            rows={5}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
          />
          <Button type="button" variant="secondary" onClick={() => void handleImport()} disabled={saving}>
            CSVを取り込む
          </Button>
        </div>
        {message ? <p className="text-sm text-foreground">{message}</p> : null}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </CardContent>
    </Card>
  )
}
