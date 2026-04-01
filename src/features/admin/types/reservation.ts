export type ReservationStatus = "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"

export interface Reservation {
  id: string
  customerName: string
  customerEmail: string
  startAt: string // ISO 8601
  endAt: string
  status: ReservationStatus
  /** 担当者ID */
  assigneeId: string
  /** API の trainer_name（スタッフ一覧に無い場合の色分け・絞り込み用） */
  trainerName?: string
  memo?: string
  createdAt: string
}
