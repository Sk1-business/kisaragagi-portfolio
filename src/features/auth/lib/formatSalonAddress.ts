/** サロン住所の入力4項目（salons / salon_profiles の `address` 結合用） */
export type SalonAddressParts = {
  prefecture: string
  municipality: string
  street: string
  building?: string
}

/**
 * 「都道府県」「市区町村」「町名・番地」「建物名」を1文字列に結合する。
 * 建物名があるときのみ、その前に半角スペースを入れる。
 */
export function composeSalonAddress(parts: SalonAddressParts): string {
  const prefecture = parts.prefecture.trim()
  const municipality = parts.municipality.trim()
  const street = parts.street.trim()
  const building = parts.building?.trim() ?? ""
  let out = `${prefecture}${municipality}${street}`
  if (building) out += ` ${building}`
  return out
}
