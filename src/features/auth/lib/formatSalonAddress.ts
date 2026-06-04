/** サロン住所の入力4項目（salons / salon_profiles の `address` 結合用） */
export type SalonAddressParts = {
  prefecture: string
  municipality: string
  street: string
  building?: string
}

/**
 * 「県」「市町村」「町名・番地」「マンション名」を1文字列に結合する。
 * マンション名があるときのみ、その前に半角スペースを入れる。
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
