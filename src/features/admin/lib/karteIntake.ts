import {
  normalizeChart,
  type ConversationEntry,
  type ConversationSpeaker,
  type CustomerChart,
} from "@/features/admin/lib/customerDirectory"

export type KarteTemplate = {
  id: string
  name: string
  summary: string
  chart: Pick<
    CustomerChart,
    | "texture"
    | "hairRequest"
    | "preference"
    | "allergy"
    | "length"
    | "scalp"
    | "colorHistory"
    | "homeCare"
    | "notes"
  >
}

const TEMPLATE_FIELDS = [
  "texture",
  "hairRequest",
  "preference",
  "allergy",
  "length",
  "scalp",
  "colorHistory",
  "homeCare",
  "notes",
] as const

export const KARTE_TEMPLATES: KarteTemplate[] = [
  {
    id: "first-visit",
    name: "初回来店",
    summary: "髪質、長さ、アレルギー、自宅での乾かし方を聞く",
    chart: {
      texture: "直毛 / くせ / 細毛 / 太毛: ",
      length: "今の長さ: \n希望の長さ: ",
      hairRequest: "顔まわり: \n避けたいこと: ",
      preference: "雰囲気: \n色の希望: ",
      allergy: "なし / あり（薬剤名）: ",
      scalp: "かゆみ、赤み、痛み: ",
      colorHistory: "染毛の有無と時期: ",
      homeCare: "ドライヤー / アイロン / ワックス: ",
      notes: "初回問診。次回までに残すことを一行で書く。",
    },
  },
  {
    id: "color-retouch",
    name: "カラーリタッチ",
    summary: "根元の明るさと頭皮の空け幅を残す",
    chart: {
      texture: "",
      length: "長さは前回のまま",
      hairRequest: "根元だけ前回のトーンに合わせる",
      preference: "明るさは今のトーンを維持",
      allergy: "なし",
      scalp: "塗布前に赤みを確認",
      colorHistory: "前回色: \n根元の伸び: \n希望の明るさ: ",
      homeCare: "カラー用シャンプー",
      notes: "毛先には色を足さない。放置時間は前回どおり。",
    },
  },
  {
    id: "wavy-cut",
    name: "くせ毛カット",
    summary: "乾かした形でまとまる長さを残す",
    chart: {
      texture: "くせ毛。湿っているときと乾いたときの差が大きい",
      length: "乾かした状態で決める",
      hairRequest: "伸ばして抑えず、乾かした形でまとまる",
      preference: "ワックス少なめ",
      allergy: "なし",
      scalp: "普通",
      colorHistory: "",
      homeCare: "ドライヤーで根元を立ててから中間を収める",
      notes: "濡れた長さで切りすぎない。",
    },
  },
  {
    id: "mens-business",
    name: "メンズビジネス",
    summary: "朝セットなしでも襟が整う長さ",
    chart: {
      texture: "",
      length: "サイド短め。トップは立ち上がりを残す。襟はシャツに触れない",
      hairRequest: "出勤前にワックスなしでもまとまる",
      preference: "清潔感。刈り上げすぎない",
      allergy: "なし",
      scalp: "普通",
      colorHistory: "白髪の有無: ",
      homeCare: "ワックスはつけない",
      notes: "サイドと襟を先に決め、トップは残す。",
    },
  },
  {
    id: "sensitive",
    name: "敏感肌",
    summary: "染毛を止めるか、頭皮から空けて塗る",
    chart: {
      texture: "",
      length: "",
      hairRequest: "色を足すかはパッチの結果を見て決める",
      preference: "明るくしすぎない",
      allergy: "ジアミンでかぶれたことがある",
      scalp: "敏感。赤みが出たらすぐ落とす",
      colorHistory: "ノンジアミンのみ。頭皮から1cm空ける",
      homeCare: "低刺激のシャンプー",
      notes: "禁忌がある間は染毛を提案しない。",
    },
  },
  {
    id: "straight-perm",
    name: "縮毛矯正の前",
    summary: "薬剤履歴とダメージ位置を先に書く",
    chart: {
      texture: "広がり。うねりは中間から毛先",
      length: "矯正後に短く見える分を残す",
      hairRequest: "毛先のダメージは伸ばしきらない",
      preference: "まっすぐすぎない",
      allergy: "過去の薬剤でしみたことがあればここに書く",
      scalp: "塗布前に傷と赤みを見る",
      colorHistory: "直近のカラー日: \nブリーチ: ",
      homeCare: "アイロンの頻度: ",
      notes: "カラーから何日空いているかを確認してから薬剤を選ぶ。",
    },
  },
]

export function applyKarteTemplate(
  chart: CustomerChart,
  template: KarteTemplate,
  mode: "fill" | "replace",
): CustomerChart {
  const next: CustomerChart = { ...chart, conversationLogs: chart.conversationLogs }
  for (const field of TEMPLATE_FIELDS) {
    const incoming = template.chart[field]
    if (mode === "replace" || !next[field].trim()) next[field] = incoming
  }
  return normalizeChart(next)
}

const SPEAKER_LABEL: Record<string, ConversationSpeaker> = {
  お客様: "customer",
  顧客: "customer",
  ゲスト: "customer",
  スタイリスト: "stylist",
  スタッフ: "stylist",
  担当: "stylist",
  メモ: "note",
}

export const SAMPLE_CONVERSATION = `お客様: 前回より2cm残してほしいです
スタイリスト: 顔まわりだけ軽くして、長さは鎖骨の下で止めます
お客様: 家ではドライヤーだけです
メモ: 次回はトリートメントを提案`

export function parseConversationText(text: string, at = new Date().toISOString()): ConversationEntry[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const entries: ConversationEntry[] = []
  lines.forEach((line, index) => {
    const labeled = line.match(/^(お客様|顧客|ゲスト|スタイリスト|スタッフ|担当|メモ)\s*[:：]\s*(.+)$/)
    if (labeled) {
      entries.push({
        id: `import-${index}`,
        at,
        speaker: SPEAKER_LABEL[labeled[1]],
        text: labeled[2].trim(),
        source: "import",
      })
      return
    }
    const stamped = line.match(
      /^(\d{4}[/.-]\d{1,2}[/.-]\d{1,2}(?:\s+\d{1,2}:\d{2})?)\s+(お客様|顧客|スタイリスト|スタッフ|メモ)\s+(.+)$/,
    )
    if (stamped) {
      entries.push({
        id: `import-${index}`,
        at,
        speaker: SPEAKER_LABEL[stamped[2]],
        text: stamped[3].trim(),
        source: "line",
      })
    }
  })
  if (entries.length === 0 && text.trim()) {
    return [{ id: "import-blob", at, speaker: "note", text: text.trim(), source: "import" }]
  }
  return entries
}

export function conversationDigest(entries: ConversationEntry[]): string {
  const picked = entries.filter((entry) => entry.text.trim()).slice(-8)
  if (picked.length === 0) return ""
  return picked
    .map((entry) => {
      const who = entry.speaker === "customer" ? "お客様" : entry.speaker === "stylist" ? "スタイリスト" : "メモ"
      return `${who}: ${entry.text}`
    })
    .join("\n")
}
