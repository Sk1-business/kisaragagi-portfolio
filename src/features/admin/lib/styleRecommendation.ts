import type { CustomerRecord } from "@/features/admin/lib/customerDirectory"

export type StyleRecommendation = {
  cut: string
  menu: string
  reason: string
}

function countMenu(record: CustomerRecord, needle: string): number {
  return record.reservations.filter(
    (reservation) => reservation.status !== "CANCELLED" && (reservation.menuName ?? "").includes(needle),
  ).length
}

export function recommendStyle(record: CustomerRecord): StyleRecommendation {
  const chart = record.chart
  const talk = chart.conversationLogs
    .filter((entry) => entry.speaker === "customer")
    .map((entry) => entry.text)
    .join(" ")
  const text = `${chart.hairRequest} ${chart.preference} ${chart.texture} ${chart.notes} ${chart.length} ${chart.colorHistory} ${chart.homeCare} ${talk}`
  const allergy = `${chart.allergy} ${chart.colorHistory}`

  if (/ジアミン|カラー剤|ブリーチ/.test(allergy)) {
    return {
      cut: "色を足さない、顔まわりの軽いカット",
      menu: "カット",
      reason: "カルテにカラー剤の禁忌があるので、染毛は提案しません。長さと輪郭だけ整えます。",
    }
  }
  if (/残して|長め/.test(`${talk} ${chart.length}`)) {
    return {
      cut: "長さを残す顔まわりカット",
      menu: "カット",
      reason: "会話かカルテで長さを残す希望があるので、全体は切らず顔まわりだけ整えます。",
    }
  }
  if (/レイヤー|軽く|重くしない|顔まわり/.test(text)) {
    return {
      cut: "顔まわりレイヤーのミディアム",
      menu: "カット",
      reason: "希望が「重さを出さない」なので、全体は残して顔まわりだけ段を入れます。",
    }
  }
  if (/くせ|うねり/.test(chart.texture + chart.notes)) {
    return {
      cut: "くせを活かすカット",
      menu: "カット",
      reason: "髪質がくせ毛なので、伸ばして抑えるより、乾かした形でまとまる長さにします。",
    }
  }
  if (countMenu(record, "カラー") >= 1) {
    return {
      cut: "前回のトーンを崩さないリタッチ",
      menu: "カラー",
      reason: "来店履歴がカラー中心です。根元だけを前回の明るさに合わせて足します。",
    }
  }
  if (countMenu(record, "パーマ") >= 1) {
    return {
      cut: "パーマを残すカット",
      menu: "カット",
      reason: "前回パーマがあるので、かかりを切らない位置で形だけ整えます。",
    }
  }
  return {
    cut: record.recommendedMenu ? `${record.recommendedMenu}を軸にした似合わせ` : "似合わせカット",
    menu: record.recommendedMenu ?? "カット",
    reason: "カルテの希望と来店履歴から、まず長さと輪郭を整える施術が合います。",
  }
}
