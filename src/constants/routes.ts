export const ROUTES = {
  landing: "/",
  customerLogin: "/customer/login",
  customerSignup: "/customer/signup",
  backofficeLogin: "/backoffice/login",
  backofficeSignup: "/backoffice/signup",
  /** 認証メール送信完了案内（5分カウントダウン） */
  backofficeSignupVerifySent: "/backoffice/signup/verify-sent",
  /** メール内リンクから飛んでくるトークン検証画面 */
  backofficeSignupVerify: "/backoffice/signup/verify",
  /** 認証完了後に遷移する初期設定画面（サロン情報） */
  backofficeInitialSetup: "/backoffice/setup/initial",
  /** 初期設定の続き: 営業日・営業時間登録画面 */
  backofficeSetupBusinessHours: "/backoffice/setup/business-hours",
  /** 初期設定の続き: 予約ルール登録画面 */
  backofficeSetupBookingRules: "/backoffice/setup/booking-rules",
  /** 初期設定の完了画面 */
  backofficeSetupDone: "/backoffice/setup/done",
  userHome: "/user",
  userReservationNomination: "/user/reservation/nomination",
  userReservationChangeMode: "/user/reservation/change-mode",
  userReservationSchedule: "/user/reservation/schedule",
  userReservationInput: "/user/reservation/input",
  userReservationConfirm: "/user/reservation/confirm",
  userReservationPaypayReturn: "/user/reservation/paypay-return",
  userMypage: "/user/mypage",
  userMypageReservationDetail: "/user/mypage/reservation",
  userMypageProfile: "/user/mypage/profile",
  userMypagePayment: "/user/mypage/payment",
  userMypagePaymentDetail: "/user/mypage/payment/detail",

  adminHome: "/admin",
  adminCalendar: "/admin/calendar",
  adminShiftCalendar: "/admin/shifts",
  adminCancelled: "/admin/cancelled",
  adminStaff: "/admin/staff",
  adminMenus: "/admin/menus",
  /** 管理者による代理予約（入力） */
  adminNewReservation: "/admin/reservations/new",
  /** 代理予約の確認・確定 */
  adminNewReservationConfirm: "/admin/reservations/new/confirm",
  adminReservationDetail: "/admin/reservations/:id",
} as const
