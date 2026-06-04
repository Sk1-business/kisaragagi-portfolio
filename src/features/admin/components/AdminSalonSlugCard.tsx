import { AlertTriangle, ExternalLink, Save } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  fetchAdminSalonProfile,
  updateAdminSalonProfile,
} from "@/features/admin/api/adminSalonProfileApi"

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/

function validateSlug(slug: string): string {
  if (slug.length < 3) return "3文字以上で入力してください。"
  if (slug.length > 100) return "100文字以内で入力してください。"
  if (!SLUG_PATTERN.test(slug)) {
    return "小文字英数字とハイフンのみ使えます。先頭と末尾は英数字にしてください。"
  }
  return ""
}

export function AdminSalonSlugCard() {
  const [slug, setSlug] = useState("")
  const [savedSlug, setSavedSlug] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [pendingSlug, setPendingSlug] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    void fetchAdminSalonProfile()
      .then((profile) => {
        if (!mounted) return
        const currentSlug = profile?.slug ?? ""
        setSlug(currentSlug)
        setSavedSlug(currentSlug)
      })
      .catch((e) => {
        if (!mounted) return
        setError(e instanceof Error ? e.message : "プロフィールの取得に失敗しました。")
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  const validationError = useMemo(() => {
    const trimmed = slug.trim()
    if (!trimmed) return "予約URL slug を入力してください。"
    return validateSlug(trimmed)
  }, [slug])

  const publicPath = savedSlug ? `/s/${savedSlug}` : ""
  const publicUrl =
    typeof window !== "undefined" && publicPath ? `${window.location.origin}${publicPath}` : publicPath

  async function saveSlug(nextSlug: string) {
    setSaving(true)
    try {
      const profile = await updateAdminSalonProfile({
        slug: nextSlug,
        timezone: "Asia/Tokyo",
      })
      setSlug(profile.slug)
      setSavedSlug(profile.slug)
      setMessage("予約URLを保存しました。")
    } catch (e) {
      setError(e instanceof Error ? e.message : "予約URLの保存に失敗しました。")
    } finally {
      setSaving(false)
      setPendingSlug(null)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextSlug = slug.trim()
    const nextError = validateSlug(nextSlug)
    setMessage("")
    setError("")
    if (nextError) {
      setError(nextError)
      return
    }
    setPendingSlug(nextSlug)
  }

  return (
    <>
      <Card className="rounded-lg border-border shadow-xs">
        <CardHeader>
          <CardTitle className="text-lg">予約URL</CardTitle>
          <CardDescription>
            お客様に共有するURLの末尾を設定します。例: sample-salon-2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="salon-slug">slug</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center rounded-md border border-input bg-background shadow-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]">
                  <span className="shrink-0 px-3 text-sm text-muted-foreground">/s/</span>
                  <Input
                    id="salon-slug"
                    value={slug}
                    onChange={(event) => {
                      setSlug(event.target.value.trim().toLowerCase())
                      setMessage("")
                      setError("")
                    }}
                    placeholder="sample-salon-2026"
                    className="border-0 shadow-none focus-visible:ring-0"
                    disabled={loading || saving}
                    aria-invalid={Boolean(error || validationError)}
                  />
                </div>
                <Button type="submit" disabled={loading || saving || Boolean(validationError)}>
                  <Save className="size-4" />
                  {saving ? "変更中..." : "変更"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                小文字英数字とハイフンのみ。3〜100文字、先頭と末尾は英数字です。
              </p>
            </div>

            {publicUrl ? (
              <div className="flex flex-col gap-2 rounded-md border bg-muted/40 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="break-all text-muted-foreground">{publicUrl}</span>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link to={publicPath} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                    開く
                  </Link>
                </Button>
              </div>
            ) : null}

            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </form>
        </CardContent>
      </Card>

      {pendingSlug ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="slug-confirm-title"
        >
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle className="size-5" />
              </div>
              <div className="space-y-1">
                <h2 id="slug-confirm-title" className="text-base font-semibold">
                  予約URLを変更しますか？
                </h2>
                <p className="text-sm text-muted-foreground">
                  変更後のURLは{" "}
                  <span className="font-medium text-foreground">/s/{pendingSlug}</span> になります。
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPendingSlug(null)}
                disabled={saving}
              >
                キャンセル
              </Button>
              <Button type="button" onClick={() => void saveSlug(pendingSlug)} disabled={saving}>
                {saving ? "変更中..." : "変更する"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
