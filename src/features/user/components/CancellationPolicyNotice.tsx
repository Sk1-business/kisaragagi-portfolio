import { useEffect, useState } from "react"

import {
  defaultStructuredCancellationPolicy,
  loadDisplayedCancellationPolicy,
  type StructuredCancellationPolicy,
} from "@/features/user/lib/cancellationPolicyContent"

type Props = {
  shopSlug?: string
  compact?: boolean
}

export function CancellationPolicyNotice({ shopSlug, compact = false }: Props) {
  const [policy, setPolicy] = useState<StructuredCancellationPolicy>(defaultStructuredCancellationPolicy)

  useEffect(() => {
    let mounted = true
    void loadDisplayedCancellationPolicy(shopSlug).then((next) => {
      if (mounted) setPolicy(next)
    })
    return () => {
      mounted = false
    }
  }, [shopSlug])

  const showRates = policy.structured

  return (
    <section className={`rounded-xl border border-slate-200 bg-slate-50 ${compact ? "p-3" : "p-4"}`}>
      <h3 className="text-sm font-semibold text-foreground">キャンセルポリシーについてのお知らせ</h3>
      {showRates ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-foreground">
          <p className="text-center text-xs font-semibold text-muted-foreground">キャンセルポリシー</p>
          <ul className="mt-2 space-y-1 text-center font-medium">
            <li>1日前　合計金額の{policy.dayBeforePercent}%</li>
            <li>当日　合計金額の{policy.sameDayPercent}%</li>
            <li>無断　合計金額の{policy.noShowPercent}%</li>
          </ul>
        </div>
      ) : null}
      {policy.body.trim() ? (
        <p className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">{policy.body.trim()}</p>
      ) : null}
    </section>
  )
}
