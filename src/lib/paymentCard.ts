export const MAJOR_BRANDS = ["Visa", "Mastercard", "JCB", "American Express", "Diners Club"] as const

export function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ")
}

export function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function validateExpiry(value: string) {
  if (!/^\d{2}\/\d{2}$/.test(value)) {
    return "有効期限は MM/YY 形式で入力してください。"
  }

  const month = Number(value.slice(0, 2))
  const year2digits = Number(value.slice(3, 5))
  if (month < 1 || month > 12) {
    return "月は 01 から 12 の範囲で入力してください。"
  }

  const now = new Date()
  const currentYear2digits = now.getFullYear() % 100
  const currentMonth = now.getMonth() + 1

  if (year2digits < currentYear2digits) {
    return "有効期限が過去になっています。"
  }
  if (year2digits === currentYear2digits && month < currentMonth) {
    return "有効期限が過去になっています。"
  }

  if (year2digits > currentYear2digits + 20) {
    return "年は有効な範囲で入力してください。"
  }

  return ""
}

export function maskCardNumber(cardNumber: string) {
  const digits = cardNumber.replace(/\s/g, "")
  if (digits.length < 4) return "••••"
  return `•••• •••• •••• ${digits.slice(-4)}`
}
