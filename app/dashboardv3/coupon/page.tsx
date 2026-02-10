"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Ticket, Copy, Check, Bell, Moon, Sun } from "lucide-react"
import { couponApi } from "@/lib/api-client"
import type { Coupon } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import icashLogo from "@/public/icash-logo.png"
import { Badge } from "@/components/ui/badge"

export default function CouponPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [particles, setParticles] = useState<Array<{
    id: number
    left: number
    top: number
    delay: number
    duration: number
    x: number
  }>>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Generate particle positions only on client side
    setParticles(
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 10 + Math.random() * 10,
        x: (Math.random() - 0.5) * 200
      }))
    )
  }, [])

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
    <div className="min-h-screen w-full bg-background flex flex-col relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs - MUCH MORE VISIBLE */}
        <div className="absolute top-0 -left-4 w-96 h-96 bg-[#FF6B35] rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-[#2563EB] rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF8C42] rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Floating Shapes - MUCH MORE VISIBLE */}
        <div 
          className="absolute top-20 left-10 w-40 h-40 bg-[#FF6B35] rounded-full blur-2xl opacity-40"
          style={{ animation: 'float 6s ease-in-out infinite' }}
        ></div>
        <div 
          className="absolute top-40 right-20 w-32 h-32 bg-[#2563EB] rounded-full blur-2xl opacity-40"
          style={{ animation: 'float-delayed 8s ease-in-out infinite 1s' }}
        ></div>
        <div 
          className="absolute bottom-32 left-1/4 w-48 h-48 bg-[#FF8C42] rounded-full blur-2xl opacity-40"
          style={{ animation: 'float-slow 10s ease-in-out infinite 2s' }}
        ></div>
        <div 
          className="absolute bottom-20 right-1/3 w-36 h-36 bg-[#FF6B35] rounded-full blur-2xl opacity-40"
          style={{ animation: 'float 7s ease-in-out infinite 0.5s' }}
        ></div>
        
        {/* Animated Grid Pattern - MUCH MORE VISIBLE */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255, 107, 53, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 53, 0.5) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
        </div>

        {/* Particle Effect - MUCH MORE VISIBLE */}
        {particles.length > 0 && (
          <div className="absolute inset-0">
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-4 h-4 bg-[#FF6B35] rounded-full opacity-70"
                style={{
                  left: `${particle.left}%`,
                  top: `${particle.top}%`,
                  animation: `particle ${particle.duration}s linear infinite`,
                  animationDelay: `${particle.delay}s`,
                  '--random-x': `${particle.x}px`
                } as React.CSSProperties & { '--random-x': string }}
              ></div>
            ))}
          </div>
        )}
      </div>

      {/* Zone centrale - dimension téléphone, contenu en bas */}
      <div className="flex-1 flex items-start justify-center p-3 sm:p-4 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto flex flex-col pt-2 sm:pt-3">
          {/* Header avec logo et icônes - Plus compact */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-card/70 to-card/50 backdrop-blur-md hover:from-card/90 hover:to-card/70 text-foreground border border-border/40 shadow-sm shrink-0 transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-500/20 rounded-lg blur-sm"></div>
                  <Image src={icashLogo} alt="iCASH logo" className="w-7 h-7 relative z-10" />
                </div>
                <span className="text-foreground font-bold text-base bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Coupons</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-card/70 to-card/50 backdrop-blur-md hover:from-card/90 hover:to-card/70 text-foreground border border-border/40 shadow-sm transition-all"
                title="Notifications"
                asChild
              >
                <Link href="/dashboardv3/notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl bg-gradient-to-br from-card/70 to-card/50 backdrop-blur-md hover:from-card/90 hover:to-card/70 text-foreground border border-border/40 shadow-sm transition-all"
                onClick={() => {
                  if (mounted) {
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                }}
                title={mounted ? `Passer en mode ${resolvedTheme === "dark" ? "clair" : "sombre"}` : "Changer le thème"}
              >
                {mounted ? (
                  resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Coupons List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                  <Loader2 className="h-10 w-10 animate-spin text-primary relative z-10" />
                </div>
                <p className="text-sm text-muted-foreground">Chargement des coupons...</p>
              </div>
            </div>
          ) : coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/30 to-yellow-600/30 rounded-full blur-2xl"></div>
                <div className="relative bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 p-6 rounded-full border-2 border-yellow-500/30">
                  <Ticket className="h-12 w-12 text-yellow-600 dark:text-yellow-500" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Aucun coupon disponible</h3>
              <p className="text-sm text-muted-foreground text-center max-w-[280px]">
                Vous n'avez pas encore de coupons. Ils apparaîtront ici lorsqu'ils arriveront.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.02] border-yellow-500/40 bg-gradient-to-br from-yellow-500/10 via-card/60 to-card/60 shadow-lg shadow-yellow-500/10"
                >
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-transparent pointer-events-none"></div>
                  
                  <div className="relative p-4">
                    <div className="flex items-start gap-3">
                      {/* Icon container */}
                      <div className="shrink-0 p-2.5 rounded-xl bg-yellow-500/20 border-2 border-yellow-500/30">
                        <Ticket className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-sm text-foreground">
                                {coupon.code}
                              </h3>
                            </div>
                            <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-border/40 bg-muted/30 mb-1.5">
                              {coupon.bet_app}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              Créé le {format(new Date(coupon.created_at), "dd MMM yyyy à HH:mm", {
                                locale: fr,
                              })}
                            </p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyCouponCode(coupon.code)}
                            className="h-7 w-7 rounded-lg bg-card/60 backdrop-blur-md hover:bg-card/80 border border-border/40 shrink-0"
                            title="Copier le code"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="h-3.5 w-3.5 text-green-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && coupons.length > 0 && (hasNextPage || hasPreviousPage) && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || !hasPreviousPage}
                className="h-9 border-border/40"
              >
                <span className="text-xs">Précédent</span>
              </Button>
              <span className="text-xs text-muted-foreground px-2">
                Page {currentPage}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={!hasNextPage}
                className="h-9 border-border/40"
              >
                <span className="text-xs">Suivant</span>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
