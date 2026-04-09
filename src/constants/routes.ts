export const ROUTES = {
  landing: "/",
  customerLogin: "/customer/login",
  customerSignup: "/customer/signup",
  backofficeLogin: "/backoffice/login",
  backofficeSignup: "/backoffice/signup",
  userHome: "/user",
  adminHome: "/admin",
  adminCalendar: "/admin/calendar",
  adminShiftCalendar: "/admin/shifts",
  adminCancelled: "/admin/cancelled",
  adminStaff: "/admin/staff",
  /** 管理者による代理予約（入力） */
  adminNewReservation: "/admin/reservations/new",
  /** 代理予約の確認・確定 */
  adminNewReservationConfirm: "/admin/reservations/new/confirm",
  adminReservationDetail: "/admin/reservations/:id",
} as const
