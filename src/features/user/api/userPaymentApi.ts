import { apiRequest } from "@/lib/apiClient"

export interface PaymentCard {
  id: string
  brand: string
  cardNumber: string
  expiry: string
  cvc: string
  holderName: string
}

interface CustomerPaymentCardResponse {
  card_id: string
  brand: string
  masked_number: string
  expiry: string
  holder_name: string
}

interface CustomerPaymentCardDetailResponse {
  card_id: string
  brand: string
  card_number: string
  expiry: string
  cvc: string
  holder_name: string
}

interface CustomerPaymentCardCreateRequest {
  brand: string
  card_number: string
  expiry: string
  cvc: string
  holder_name: string
}

export async function fetchPaymentCards(): Promise<PaymentCard[]> {
  const cards = await apiRequest<CustomerPaymentCardResponse[]>("/api/payments/cards")
  return cards.map((card) => ({
    id: card.card_id,
    brand: card.brand,
    cardNumber: card.masked_number,
    expiry: card.expiry,
    cvc: "",
    holderName: card.holder_name,
  }))
}

export async function fetchPaymentCardById(cardId: string): Promise<PaymentCard | null> {
  try {
    const card = await apiRequest<CustomerPaymentCardDetailResponse>(`/api/payments/cards/${cardId}`)
    return {
      id: card.card_id,
      brand: card.brand,
      cardNumber: card.card_number,
      expiry: card.expiry,
      cvc: card.cvc,
      holderName: card.holder_name,
    }
  } catch {
    return Promise.resolve(null)
  }
}

export async function addPaymentCard(
  payload: Omit<PaymentCard, "id">,
): Promise<{ ok: true; card: PaymentCard } | { ok: false; error: string }> {
  try {
    const created = await apiRequest<CustomerPaymentCardResponse>("/api/payments/cards", {
      method: "POST",
      body: {
        brand: payload.brand,
        card_number: payload.cardNumber,
        expiry: payload.expiry,
        cvc: payload.cvc,
        holder_name: payload.holderName,
      } satisfies CustomerPaymentCardCreateRequest,
    })
    return {
      ok: true,
      card: {
        id: created.card_id,
        brand: created.brand,
        cardNumber: created.masked_number,
        expiry: created.expiry,
        cvc: "",
        holderName: created.holder_name,
      },
    }
  } catch (error) {
    if (error instanceof Error && error.message) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "カード情報の登録に失敗しました。" }
  }
}

export async function deletePaymentCard(cardId: string): Promise<{ ok: true } | { ok: false }> {
  try {
    await apiRequest<{ message: string }>(`/api/payments/cards/${cardId}`, { method: "DELETE" })
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export async function updatePaymentCard(
  payload: PaymentCard,
): Promise<{ ok: true; card: PaymentCard } | { ok: false; error: string }> {
  try {
    const updated = await apiRequest<CustomerPaymentCardResponse>(`/api/payments/cards/${payload.id}`, {
      method: "PUT",
      body: {
        brand: payload.brand,
        card_number: payload.cardNumber,
        expiry: payload.expiry,
        cvc: payload.cvc,
        holder_name: payload.holderName,
      } satisfies CustomerPaymentCardCreateRequest,
    })
    return {
      ok: true,
      card: {
        id: updated.card_id,
        brand: updated.brand,
        cardNumber: updated.masked_number,
        expiry: updated.expiry,
        cvc: "",
        holderName: updated.holder_name,
      },
    }
  } catch (error) {
    if (error instanceof Error && error.message) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "カード情報の更新に失敗しました。" }
  }
}
