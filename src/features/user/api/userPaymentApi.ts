export interface PaymentCard {
  id: string
  brand: string
  cardNumber: string
  expiry: string
  cvc: string
  holderName: string
}

const PAYMENT_CARD_STORAGE_KEY = "user:payment-cards:v1"

const DEFAULT_PAYMENT_CARDS: PaymentCard[] = [
  {
    id: "card-001",
    brand: "Visa",
    cardNumber: "4242 4242 4242 4242",
    expiry: "12/28",
    cvc: "123",
    holderName: "TARO YAMADA",
  },
]

function safeReadStorage<T>(key: string): T | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function safeWriteStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage failures in development fallback mode.
  }
}

function loadPaymentCardsFromStorage() {
  const stored = safeReadStorage<PaymentCard[]>(PAYMENT_CARD_STORAGE_KEY)
  if (stored && Array.isArray(stored)) {
    return stored
  }
  safeWriteStorage(PAYMENT_CARD_STORAGE_KEY, DEFAULT_PAYMENT_CARDS)
  return DEFAULT_PAYMENT_CARDS
}

function savePaymentCardsToStorage(cards: PaymentCard[]) {
  safeWriteStorage(PAYMENT_CARD_STORAGE_KEY, cards)
}

export async function fetchPaymentCards(): Promise<PaymentCard[]> {
  return Promise.resolve(loadPaymentCardsFromStorage())
}

export async function fetchPaymentCardById(cardId: string): Promise<PaymentCard | null> {
  const cards = loadPaymentCardsFromStorage()
  return Promise.resolve(cards.find((card) => card.id === cardId) ?? null)
}

export async function addPaymentCard(
  payload: Omit<PaymentCard, "id">,
): Promise<{ ok: true; card: PaymentCard }> {
  const cards = loadPaymentCardsFromStorage()
  const newCard: PaymentCard = {
    ...payload,
    id: `card-${Date.now()}`,
  }
  savePaymentCardsToStorage([...cards, newCard])
  return Promise.resolve({ ok: true, card: newCard })
}

export async function deletePaymentCard(cardId: string): Promise<{ ok: true } | { ok: false }> {
  const cards = loadPaymentCardsFromStorage()
  const nextCards = cards.filter((card) => card.id !== cardId)
  if (nextCards.length === cards.length) {
    return Promise.resolve({ ok: false })
  }
  savePaymentCardsToStorage(nextCards)
  return Promise.resolve({ ok: true })
}

export async function updatePaymentCard(
  payload: PaymentCard,
): Promise<{ ok: true; card: PaymentCard } | { ok: false; error: string }> {
  const cards = loadPaymentCardsFromStorage()
  const index = cards.findIndex((card) => card.id === payload.id)
  if (index < 0) {
    return Promise.resolve({ ok: false, error: "カード情報が見つかりませんでした。" })
  }
  cards[index] = payload
  savePaymentCardsToStorage(cards)
  return Promise.resolve({ ok: true, card: payload })
}
