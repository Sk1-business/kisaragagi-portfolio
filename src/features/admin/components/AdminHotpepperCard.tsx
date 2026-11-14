import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  fetchHotpepperSettings,
  importHotpepperCsv,
  saveHotpepperSettings,
  type HotpepperCoupon,
} from "@/features/admin/api/hotpepperApi"

const SAMPLE_CSV = `予約日,開始時刻,終了時刻,スタイリスト,メニュー,お客様名,電話番号,経路
2026-11-16,13:00,14:00,青井 凛,カット,CSV 花,09066667777,ホットペッパー`

export function AdminHotpepperCard() {
  const [url, setUrl] = useState("")
  const [coupons, setCoupons] = useState<HotpepperCoupon[]>([])
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
          掲載ページとクーポンを案内し、サロンボード形式のCSVを予約台帳へ取り込みます。
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
