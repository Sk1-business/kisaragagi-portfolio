import { fetchSalonPage } from "@/features/user/api/userSalonApi"
import { fetchCancellationPolicy } from "@/features/user/api/userReservationApi"

const MARKER = "[[cancel-policy-v1]]"

export type StructuredCancellationPolicy = {
  dayBeforePercent: number
  sameDayPercent: number
  noShowPercent: number
  body: string
  /** 管理画面で料率つき保存された本文か */
  structured: boolean
}

export const DEFAULT_CANCELLATION_BODY = `ご予約のキャンセルや日時変更は、予約日の2日前までにお願いいたします。
前日・当日キャンセルにつきましては、所定のキャンセル料を申し受けます。
前日・当日のご予約に関するご連絡は、お電話で受け付けております。

※悪天候・災害発生（台風・大雪・地震等）による交通機関の運行中止、その他やむを得ない理由がある場合は、キャンセル料を免除する場合がございます。お電話にてご相談ください。

無断キャンセルが3回に達したお客様は、以降のご予約をお受けできません。`

export function defaultStructuredCancellationPolicy(): StructuredCancellationPolicy {
  return {
    dayBeforePercent: 50,
    sameDayPercent: 50,
    noShowPercent: 100,
    body: DEFAULT_CANCELLATION_BODY,
    structured: true,
  }
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function parseCancellationPolicyText(text: string | null | undefined): StructuredCancellationPolicy {
  const raw = (text ?? "").replace(/^\uFEFF/, "").trim()
  const defaults = defaultStructuredCancellationPolicy()
  if (!raw) return { ...defaults, structured: false }
  if (!raw.startsWith(MARKER)) {
    return {
      dayBeforePercent: defaults.dayBeforePercent,
      sameDayPercent: defaults.sameDayPercent,
      noShowPercent: defaults.noShowPercent,
      body: raw,
      structured: false,
    }
  }

  const lines = raw.split(/\r?\n/).slice(1)
  let dayBeforePercent = defaults.dayBeforePercent
  let sameDayPercent = defaults.sameDayPercent
  let noShowPercent = defaults.noShowPercent
  const bodyLines: string[] = []
  let inBody = false
  for (const line of lines) {
    if (!inBody && line.trim() === "---") {
      inBody = true
      continue
    }
    if (!inBody) {
      const matched = /^(day_before|same_day|no_show)=(\d{1,3})$/.exec(line.trim())
      if (!matched) continue
      const percent = clampPercent(Number(matched[2]))
      if (matched[1] === "day_before") dayBeforePercent = percent
      if (matched[1] === "same_day") sameDayPercent = percent
      if (matched[1] === "no_show") noShowPercent = percent
      continue
    }
    bodyLines.push(line)
  }

  return {
    dayBeforePercent,
    sameDayPercent,
    noShowPercent,
    body: bodyLines.join("\n").trim() || defaults.body,
    structured: true,
  }
}

export function serializeCancellationPolicy(
  policy: Pick<
    StructuredCancellationPolicy,
    "dayBeforePercent" | "sameDayPercent" | "noShowPercent" | "body"
  >,
): string {
  return [
    MARKER,
    `day_before=${clampPercent(policy.dayBeforePercent)}`,
    `same_day=${clampPercent(policy.sameDayPercent)}`,
    `no_show=${clampPercent(policy.noShowPercent)}`,
    "---",
    policy.body.trim(),
  ].join("\n")
}

export function formatCancellationPolicySummary(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return "（未設定）"
  const parsed = parseCancellationPolicyText(trimmed)
  if (!parsed.structured) return parsed.body || "（未設定）"
  const rates = `1日前 ${parsed.dayBeforePercent}% / 当日 ${parsed.sameDayPercent}% / 無断 ${parsed.noShowPercent}%`
  return parsed.body.trim() ? `${rates}\n${parsed.body.trim()}` : rates
}

function readPolicyText(raw: unknown): string {
  if (!raw || typeof raw !== "object") return ""
  const record = raw as Record<string, unknown>
  const value =
    record.cancellation_policy_text ??
    record.cancellationPolicyText ??
    record.cancellation_policy
  return typeof value === "string" ? value.trim() : ""
}

export async function loadDisplayedCancellationPolicy(
  shopSlug?: string,
): Promise<StructuredCancellationPolicy> {
  try {
    const page = await fetchSalonPage(shopSlug)
    const text = readPolicyText(page)
    if (text) return parseCancellationPolicyText(text)
  } catch {
    // 公開ページにポリシーが無い場合は予約ポリシー API を見る
  }

  try {
    const policy = await fetchCancellationPolicy()
    const joined = [policy.summary, ...policy.detailLines].filter(Boolean).join("\n").trim()
    if (joined && !joined.includes("暫定")) {
      const parsed = parseCancellationPolicyText(joined)
      return parsed.structured ? parsed : { ...parsed, structured: false }
    }
  } catch {
    // 既定のサロン向け文面を表示する
  }

  return defaultStructuredCancellationPolicy()
}
