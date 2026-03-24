import { useEffect, useMemo, useState } from "react"
import { Clock, UserRound } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { fetchReservationMenus, type ReservationMenuOption } from "@/features/user/api/userReservationApi"
import { UserSectionCard } from "@/features/user/components/UserSectionCard"
import { usePersistentReservationId } from "@/features/user/hooks/usePersistentReservationId"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"
import { useUserReservation } from "@/features/user/hooks/useUserReservation"
import { useUserTrainers } from "@/features/user/hooks/useUserTrainers"

export function UserNominationPage() {
  const shopId = useShopId()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = (location.state as { isUpdatingExistingReservation?: boolean } | null) ?? null
  const isUpdateFlow = routeState?.isUpdatingExistingReservation === true
  const persistentReservationId = usePersistentReservationId()
  const reservationId = isUpdateFlow ? persistentReservationId : ""
  const { trainers } = useUserTrainers(shopId)
  const { reservation } = useUserReservation(reservationId, shopId)
  const [selectedTrainerId, setSelectedTrainerId] = useState("")
  const [menuOptions, setMenuOptions] = useState<ReservationMenuOption[]>([])
  const [selectedMenuId, setSelectedMenuId] = useState("")
  const [isLoadingMenus, setIsLoadingMenus] = useState(false)
  const [menuLoadError, setMenuLoadError] = useState("")
  const currentTrainerId = useMemo(
    () => (reservation?.mode === "nomination" ? (reservation.trainerId ?? "") : ""),
    [reservation],
  )
  const selectedTrainer = useMemo(
    () => trainers.find((trainer) => trainer.id === selectedTrainerId),
    [selectedTrainerId, trainers],
  )

  useEffect(() => {
    if (!selectedTrainerId) {
      setMenuOptions([])
      setSelectedMenuId("")
      setMenuLoadError("")
      setIsLoadingMenus(false)
      return
    }
    let mounted = true
    setIsLoadingMenus(true)
    setMenuLoadError("")
    void fetchReservationMenus(shopId, selectedTrainerId)
      .then((menus) => {
        if (!mounted) return
        setMenuOptions(menus)
        setSelectedMenuId("")
      })
      .catch(() => {
        if (!mounted) return
        setMenuOptions([])
        setSelectedMenuId("")
        setMenuLoadError("メニューの取得に失敗しました。")
      })
      .finally(() => {
        if (!mounted) return
        setIsLoadingMenus(false)
      })
    return () => {
      mounted = false
    }
  }, [selectedTrainerId, shopId])

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(buildPathWithShopId(ROUTES.userHome, shopId))
  }

  return (
    <section className="space-y-5">
      <UserSectionCard title="トレーナーを選択" headerTone="plain">
        <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
          {trainers
            .slice()
            .sort((a, b) => b.rating - a.rating)
            .map((trainer) => {
              const isCurrentTrainer = trainer.id === currentTrainerId
              const isSelected = selectedTrainerId === trainer.id
              return (
              <button
                key={trainer.id}
                type="button"
                onClick={() => setSelectedTrainerId(trainer.id)}
                className={`group relative overflow-hidden rounded-2xl border transition hover:-translate-y-1 hover:shadow-lg ${
                  isSelected
                    ? "border-black ring-2 ring-slate-500 bg-white"
                    : isCurrentTrainer
                    ? "border-emerald-400 ring-2 ring-emerald-100"
                    : "border-slate-200 bg-white"
                }`}
              >
                {isCurrentTrainer ? (
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    変更前トレーナー
                  </div>
                ) : null}
                <div className="flex flex-col items-center px-5 pb-4 pt-6">
                  <div className="relative mb-3">
                    <div className="flex size-20 items-center justify-center rounded-full border-2 border-slate-100 bg-slate-100 shadow-sm">
                      <UserRound className="size-9 text-slate-400" />
                    </div>
                  </div>
                  <p className="text-base font-bold text-foreground">
                    {trainer.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {trainer.specialty}
                  </p>
                </div>

                <div
                  className={`grid grid-cols-2 gap-px border-t text-center text-xs ${
                    "border-slate-100 bg-slate-100"
                  }`}
                >
                  <div className="bg-white py-2.5">
                    <p className="text-muted-foreground">経験</p>
                    <p className="font-semibold text-foreground">
                      {`${trainer.experienceYears}年`}
                    </p>
                  </div>
                  <div className="bg-white py-2.5">
                    <p className="text-muted-foreground">指名料</p>
                    <p className="font-semibold text-foreground">
                      {`¥${trainer.nominationFee.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </button>
              )
            })}
        </div>
      </UserSectionCard>
      {selectedTrainer ? (
        <UserSectionCard title="メニューを選択" headerTone="plain">
          <div className="space-y-3 p-5">
            {menuLoadError ? <p className="text-sm text-destructive">{menuLoadError}</p> : null}
            {isLoadingMenus ? (
              <p className="text-sm text-muted-foreground">メニューを読み込み中です...</p>
            ) : (
              <>
                {menuOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">このトレーナーに紐づくメニューがありません。</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {menuOptions.map((menu) => {
                      const isSelectedMenu = selectedMenuId === menu.id
                      return (
                        <button
                          key={menu.id}
                          type="button"
                          onClick={() => setSelectedMenuId(menu.id)}
                          className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
                            isSelectedMenu
                              ? "border-black ring-2 ring-slate-500"
                              : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <p className="font-semibold text-foreground">{menu.name}</p>
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3.5 shrink-0" aria-hidden />
                            <span>所要時間 {menu.durationMinutes}分</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
                <Button
                  type="button"
                  size="lg"
                  className="w-full rounded-xl"
                  disabled={!selectedMenuId}
                  onClick={() => {
                    const selectedMenu = menuOptions.find((menu) => menu.id === selectedMenuId)
                    if (!selectedMenu) return
                    navigate(buildPathWithShopId(ROUTES.userReservationSchedule, shopId), {
                      state: {
                        mode: "nomination",
                        trainerId: selectedTrainer.id,
                        trainerName: selectedTrainer.name,
                        preferredMenuId: selectedMenu.id,
                        preferredMenuName: selectedMenu.name,
                        ...(reservationId ? { reservationId } : {}),
                        isUpdatingExistingReservation: isUpdateFlow,
                      },
                    })
                  }}
                >
                  確定して進む
                </Button>
              </>
            )}
          </div>
        </UserSectionCard>
      ) : null}
      <Button type="button" variant="outline" size="lg" className="w-full rounded-xl" onClick={handleBack}>
        前の画面へ戻る
      </Button>
    </section>
  )
}
