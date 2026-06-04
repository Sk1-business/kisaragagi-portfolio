import { apiRequest } from "@/lib/apiClient"
import { buildSalonApiPath, resolveShopSlug } from "@/lib/shopSlug"

function cardsApiBase(shopSlug?: string): string {
  const slug = resolveShopSlug(shopSlug)
  if (!slug) {
    throw new Error(
      "店舗情報が必要です。サロンの予約ページからログインし、マイページを開き直してください。",
    )
  }
  return buildSalonApiPath(slug, "/payments/cards")
}

/** SetupIntent 取得失敗時のユーザー向け文言 */
export function describePaymentSetupFailure(error: unknown): string {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return (
      "サーバーに接続できません。(1) バックエンドが http://127.0.0.1:8000 で起動しているか確認してください。 " +
      "(2) `.env.development` の `VITE_API_BASE_URL=http://localhost:8000` はやめて、変数を未設定のまま Vite の /api プロキシを使うか、`http://127.0.0.1:8000` にしてください（Windows で localhost→IPv6 かつ API が 127.0.0.1 のみだと接続できません）。 " +
      "(3) `npm run dev` / `npm run preview` でフロントを開いているか確認してください。"
    )
  }
  if (error instanceof Error && error.message) {
    return error.message
  }
  return "カード登録の初期化に失敗しました。"
}

export interface PaymentCard {
  id: string
  brand: string
  maskedNumber: string
  expiry: string
  holderName: string
}

interface CustomerPaymentCardResponse {
  card_id: string
  brand: string
  masked_number: string
  expiry: string
  holder_name: string
}

interface StripeSetupIntentResponse {
  setup_intent_id: string
  client_secret: string
  publishable_key: string
}

export interface StripeCardSetupIntent {
  setupIntentId: string
  clientSecret: string
  publishableKey: string
}

export async function fetchPaymentCards(shopSlug?: string): Promise<PaymentCard[]> {
  const cards = await apiRequest<CustomerPaymentCardResponse[]>(cardsApiBase(shopSlug))
  return cards.map((card) => ({
    id: card.card_id,
    brand: card.brand,
    maskedNumber: card.masked_number,
    expiry: card.expiry,
    holderName: card.holder_name,
  }))
}

export async function createCardSetupIntent(shopSlug?: string): Promise<StripeCardSetupIntent> {
  const response = await apiRequest<StripeSetupIntentResponse>(
    `${cardsApiBase(shopSlug)}/setup-intent`,
    {
      method: "POST",
      body: {},
    },
  )
  return {
    setupIntentId: response.setup_intent_id,
    clientSecret: response.client_secret,
    publishableKey: response.publishable_key,
  }
}

export async function finalizeCardSetup(
  setupIntentId: string,
  replaceCardId?: string,
  shopSlug?: string,
): Promise<{ ok: true; card: PaymentCard } | { ok: false; error: string }> {
  try {
    const response = await apiRequest<CustomerPaymentCardResponse>(`${cardsApiBase(shopSlug)}/finalize`, {
      method: "POST",
      body: {
        setup_intent_id: setupIntentId,
        replace_card_id: replaceCardId || undefined,
      },
    })
    return {
      ok: true,
      card: {
        id: response.card_id,
        brand: response.brand,
        maskedNumber: response.masked_number,
        expiry: response.expiry,
        holderName: response.holder_name,
      },
    }
  } catch (error) {
    if (error instanceof Error && error.message) return { ok: false, error: error.message }
    return { ok: false, error: "カード登録に失敗しました。" }
  }
}

export async function deletePaymentCard(
  cardId: string,
  shopSlug?: string,
): Promise<{ ok: true } | { ok: false }> {
  try {
    await apiRequest<{ message: string }>(`${cardsApiBase(shopSlug)}/${encodeURIComponent(cardId)}`, {
      method: "DELETE",
    })
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
