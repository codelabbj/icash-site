"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Ticket, Copy, Check } from "lucide-react"
import { couponApi } from "@/lib/api-client"
import type { Coupon } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function CouponPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Redirect if not authenticated
  if (!user) {
    router.push("/login")
    return null
  }

  useEffect(() => {
    if (user) {
      fetchCoupons()
    }
  }, [user, currentPage])

  const fetchCoupons = async () => {
    try {
      setIsLoading(true)
      const data = await couponApi.getAll(currentPage)
      setCoupons(data.results)
      setHasNextPage(!!data.next)
      setHasPreviousPage(!!data.previous)
    } catch (error) {
      console.error("Error fetching coupons:", error)
      toast.error("Erreur lors du chargement des coupons")
    } finally {
      setIsLoading(false)
    }
  }

  const copyCouponCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      toast.success("Code copié!")
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      toast.error("Erreur lors de la copie")
    }
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mes Coupons</h1>
          <p className="text-sm text-muted-foreground">Gérez vos codes de coupon</p>
        </div>
      </div>

      {/* Coupons List */}
      {isLoading ? (
        <Card className="border-2">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : coupons.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-2xl bg-muted/50 mb-6">
              <Ticket className="h-16 w-16 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-muted-foreground text-center mb-2">
              Aucun coupon disponible
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Vos coupons apparaîtront ici
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => (
            <Card key={coupon.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Ticket className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-lg">Code: {coupon.code}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Plateforme: {coupon.bet_app}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Créé le {format(new Date(coupon.created_at), "dd MMM yyyy à HH:mm", {
                        locale: fr,
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyCouponCode(coupon.code)}
                      className="rounded-lg"
                      title="Copier le code"
                    >
                      {copiedCode === coupon.code ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && coupons.length > 0 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || !hasPreviousPage}
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

