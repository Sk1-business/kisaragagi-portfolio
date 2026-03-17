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
  adminReservationDetail: "/admin/reservations/:id",
} as const
