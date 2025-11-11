"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Gift, ArrowLeft } from "lucide-react"
import { bonusApi } from "@/lib/api-client"
import { useSettings } from "@/lib/hooks/use-settings"
import type { Bonus } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function BonusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { referralBonus, isLoading: isLoadingSettings } = useSettings()
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)

  useEffect(() => {
    // Redirect if referral_bonus is false
    if (!isLoadingSettings && !referralBonus) {
      router.push("/dashboard")
      toast.error("Cette fonctionnalité n'est pas disponible")
    }
  }, [referralBonus, isLoadingSettings, router])

  useEffect(() => {
    if (user && referralBonus && !isLoadingSettings) {
      fetchBonuses()
    }
  }, [user, referralBonus, isLoadingSettings, currentPage])

  const fetchBonuses = async () => {
    try {
      setIsLoading(true)
      const data = await bonusApi.getAll(currentPage)
      setBonuses(data.results)
      setHasNextPage(!!data.next)
    } catch (error) {
      console.error("Error fetching bonuses:", error)
      toast.error("Erreur lors du chargement des bonus")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking settings
  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Don't render if referral_bonus is false
  if (!referralBonus) {
    return null
  }

  return (
    <div className="space-y-6 sm:space-y-10 px-4 sm:px-0">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl hover:bg-muted shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mes Bonus</h1>
          <p className="text-sm text-muted-foreground">Historique de vos bonus et récompenses</p>
        </div>
      </div>

      {/* Bonus List */}
      {isLoading ? (
        <Card className="border-2">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : bonuses.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-muted/50 mb-6">
              <Gift className="h-16 w-16 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground text-center mb-2">
              Aucun bonus pour le moment
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Vos bonus apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bonuses.map((bonus) => (
            <Card key={bonus.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Bonus</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {bonus.reason_bonus}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(bonus.created_at), "dd MMM yyyy à HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      +{parseFloat(bonus.amount).toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "XOF",
                        minimumFractionDigits: 0,
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && bonuses.length > 0 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => prev + 1)}
            disabled={!hasNextPage}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}

