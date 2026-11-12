import { useEffect, useState } from "react"

import { fetchSalonPage } from "@/features/user/api/userSalonApi"

export const DEFAULT_VISIT_NOTICES = [
  "ご予約メニューには所要時間があります。開始時刻までにお越しください。",
  "カットのみのメニューは、髪をセットした状態でご来店されると施術をお受けできないことがあります。セットを落とした状態でお越しください。",
  "遅刻された場合、できる施術が短くなったり、内容が限られたりすることがあります。",
  "指名なしのご予約では、担当者の性別のご希望には沿えません。ご希望の場合は必ず指名予約をしてください。",
]

export const SALON_QUESTION_PROMPT =
  "口コミをご投稿いただける方を対象に、今回の施術時に「炭酸泉」を無料でサービスします。施術内容にシャンプーが含まれる場合に限ります。"

type Props = {
  shopSlug?: string
  agreed: boolean
  onAgreedChange: (agreed: boolean) => void
  reviewChoice: "" | "review" | "no_review"
  onReviewChoiceChange: (choice: "review" | "no_review") => void
  reviewNote: string
  onReviewNoteChange: (note: string) => void
}

export function BookingVisitConfirmation({
  shopSlug,
  agreed,
  onAgreedChange,
  reviewChoice,
  onReviewChoiceChange,
  reviewNote,
  onReviewNoteChange,
}: Props) {
  const [salonMessage, setSalonMessage] = useState("")

  useEffect(() => {
    let mounted = true
    if (!shopSlug?.trim()) return
    void fetchSalonPage(shopSlug)
      .then((page) => {
        if (!mounted) return
        setSalonMessage(page.booking_page_message?.trim() ?? "")
      })
      .catch(() => {
        if (mounted) setSalonMessage("")
      })
    return () => {
      mounted = false
    }
  }, [shopSlug])

  return (
    <div className="space-y-4 border-b border-slate-100 px-6 py-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          サロンからお客様への確認事項
        </p>
        <div className="mt-3 space-y-3 rounded-xl border border-rose-100 bg-rose-50/70 p-4 text-sm text-foreground">
          <div>
            <p className="text-xs font-semibold text-rose-700">ご来店に際しての注意事項</p>
            {salonMessage ? <p className="mt-2 whitespace-pre-wrap text-sm">{salonMessage}</p> : null}
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
              {DEFAULT_VISIT_NOTICES.map((notice) => (
                <li key={notice}>{notice}</li>
              ))}
            </ul>
          </div>
          <label className="flex items-start gap-2 rounded-lg bg-white/80 px-3 py-2 text-sm font-medium">
            <input
              type="checkbox"
              className="mt-0.5 size-4"
              checked={agreed}
              onChange={(event) => onAgreedChange(event.target.checked)}
              required
            />
            確認しました
          </label>
          <div className="border-t border-rose-100 pt-3">
            <p className="text-xs font-semibold text-rose-700">サロンからの質問（必須）</p>
            <p className="mt-2 text-sm leading-relaxed">{SALON_QUESTION_PROMPT}</p>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="salon-review-choice"
                  checked={reviewChoice === "review"}
                  onChange={() => onReviewChoiceChange("review")}
                  required
                />
                書いていただける方
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="salon-review-choice"
                  checked={reviewChoice === "no_review"}
                  onChange={() => onReviewChoiceChange("no_review")}
                />
                書かれない方
              </label>
            </div>
            <label className="mt-3 block text-xs text-muted-foreground" htmlFor="salon-question-note">
              補足（200文字以内）
              <textarea
                id="salon-question-note"
                rows={3}
                maxLength={200}
                value={reviewNote}
                onChange={(event) => onReviewNoteChange(event.target.value.slice(0, 200))}
                placeholder="こちらに記入してください。"
                className="mt-1 w-full resize-none rounded-lg border border-input bg-white px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
            </label>
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{reviewNote.length}/200</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function composeBookingNote(input: {
  request: string
  reviewChoice: "review" | "no_review"
  reviewNote: string
}): string {
  const choice = input.reviewChoice === "review" ? "口コミを書いていただける" : "口コミは書かれない"
  return [
    "来店時の注意事項: 確認済み",
    `サロンからの質問: ${choice}`,
    input.reviewNote.trim() ? `質問への記入: ${input.reviewNote.trim()}` : "",
    input.request.trim() ? `ご要望・アレルギー: ${input.request.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}
