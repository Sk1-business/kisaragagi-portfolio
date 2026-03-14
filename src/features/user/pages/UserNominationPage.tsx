import { ArrowRight, Award, Star, UserRound } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import mockTrainers from "@/features/user/api/mockTrainers.json"
import { buildPathWithShopId, useShopId } from "@/features/user/hooks/useShopId"

interface Trainer {
  id: string
  name: string
  specialty: string
  experienceYears: number
  rating: number
  nominationFee: number
  photoUrl: string
}

const trainers = mockTrainers as Trainer[]

export function UserNominationPage() {
  const shopId = useShopId()
  const navigate = useNavigate()

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(buildPathWithShopId(ROUTES.userHome, shopId))
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-white shadow-lg">
        <div className="border-b border-slate-100 px-6 py-5">
          <h2 className="text-lg font-bold text-foreground">トレーナーを選択</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            指名したいトレーナーを選ぶと、日時選択へ進みます。
          </p>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2 lg:grid-cols-3">
          {trainers
            .slice()
            .sort((a, b) => b.rating - a.rating)
            .map((trainer, index) => (
              <Link
                key={trainer.id}
                to={buildPathWithShopId(ROUTES.userReservationSchedule, shopId, {
                  mode: "nomination",
                  trainerId: trainer.id,
                })}
                className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
              >
                {index === 0 ? (
                  <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow">
                    <Award className="size-3" />
                    TOP
                  </div>
                ) : null}

                <div className="flex flex-col items-center px-5 pb-4 pt-6">
                  <div className="relative mb-3">
                    <div className="flex size-20 items-center justify-center rounded-full border-2 border-slate-100 bg-slate-100 shadow-sm">
                      <UserRound className="size-9 text-slate-400" />
                    </div>
                    <span className="absolute -bottom-1 left-1/2 inline-flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                      <Star className="size-3 fill-current" />
                      {trainer.rating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-base font-bold text-foreground">{trainer.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{trainer.specialty}</p>
                </div>

                <div className="grid grid-cols-2 gap-px border-t border-slate-100 bg-slate-100 text-center text-xs">
                  <div className="bg-white py-2.5">
                    <p className="text-muted-foreground">経験</p>
                    <p className="font-semibold text-foreground">{`${trainer.experienceYears}年`}</p>
                  </div>
                  <div className="bg-white py-2.5">
                    <p className="text-muted-foreground">指名料</p>
                    <p className="font-semibold text-foreground">{`¥${trainer.nominationFee.toLocaleString()}`}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1 border-t border-slate-100 bg-slate-50 py-3 text-xs font-medium text-primary transition group-hover:bg-primary group-hover:text-white">
                  このトレーナーで予約する
                  <ArrowRight className="size-3.5 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
        </div>
      </div>
      <Button type="button" variant="outline" size="lg" className="w-full rounded-xl" onClick={handleBack}>
        前の画面へ戻る
      </Button>
    </section>
  )
}
