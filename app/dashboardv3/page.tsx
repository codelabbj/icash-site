"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Moon, Sun, Github, Loader2, Bell, User, ArrowDownToLine, ArrowUpFromLine, Phone, Ticket, Wallet, RefreshCw, ArrowRight, Copy } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import icashLogo from "@/public/icash-logo.png"
import { advertisementApi, transactionApi } from "@/lib/api-client"
import type { Advertisement, Transaction } from "@/lib/types"
import { toast } from "react-hot-toast"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { TransactionCard } from "@/components/transaction/TransactionCard"

export default function DashboardV3Page() {
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
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [isLoadingAd, setIsLoadingAd] = useState(true)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isCarouselHovered, setIsCarouselHovered] = useState<boolean>(false)
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)

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

  useEffect(() => {
    if (user) {
      fetchAdvertisements()
      fetchRecentTransactions()
    }
  }, [user])

  // Auto-scroll carousel
  useEffect(() => {
    const autoScrollCarousel = () => {
      if (!isCarouselHovered) {
        const next = document.getElementById("next-carousel")
        if (next) next.click()
      }
    }

    const intervalId = setInterval(autoScrollCarousel, 5000)
    return () => clearInterval(intervalId)
  }, [isCarouselHovered])

  const fetchAdvertisements = async () => {
    try {
      setIsLoadingAd(true)
      const data = await advertisementApi.get()
      setAdvertisements(data.results)
    } catch (error) {
      console.error("Error fetching advertisements:", error)
      toast.error("Erreur lors du chargement des publicités")
    } finally {
      setIsLoadingAd(false)
    }
  }

  const fetchRecentTransactions = async () => {
    try {
      setIsLoadingTransactions(true)
      const data = await transactionApi.getHistory({
        page: 1,
        page_size: 5, // Get only the 5 most recent transactions
      })
      setRecentTransactions(data.results)
    } catch (error) {
      console.error("Error fetching recent transactions:", error)
      toast.error("Erreur lors du chargement des transactions récentes")
    } finally {
      setIsLoadingTransactions(false)
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
      <div className="flex-1 flex items-start justify-center p-4 sm:p-6 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[420px] flex flex-col pt-4 sm:pt-6">
          {/* Header avec logo et icônes */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Image src={icashLogo} alt="iCASH logo" className="w-8 h-8" />
              <span className="text-foreground font-semibold text-lg">iCASH</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-full bg-card/60 backdrop-blur-md hover:bg-card/80 text-foreground border border-border/50"
                title="Profil"
                asChild
              >
                <Link href="/dashboardv3/profile">
                  <User className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-full bg-card/60 backdrop-blur-md hover:bg-card/80 text-foreground border border-border/50"
                title="Notifications"
                asChild
              >
                <Link href="/dashboardv3/notifications">
                  <Bell className="h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="h-10 w-10 rounded-full bg-card/60 backdrop-blur-md hover:bg-card/80 text-foreground border border-border/50"
                onClick={() => {
                  if (mounted) {
                    setTheme(resolvedTheme === "dark" ? "light" : "dark")
                  }
                }}
                title={mounted ? `Passer en mode ${resolvedTheme === "dark" ? "clair" : "sombre"}` : "Changer le thème"}
              >
                {mounted ? (
                  resolvedTheme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Carrousel de publicités */}
          <div className="mb-4">
            {isLoadingAd ? (
              <Card className="border-2 border-dashed border-muted-foreground/20 bg-card/50 backdrop-blur-sm">
                <CardContent className="flex items-center justify-center py-8">
                  <div className="flex gap-2 items-center text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Chargement...
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : advertisements.length > 0 && advertisements.find((ad) => ad.enable) ? (
              <div
                ref={carouselRef}
                onMouseEnter={() => setIsCarouselHovered(true)}
                onMouseLeave={() => setIsCarouselHovered(false)}
              >
                <Carousel
                  className="w-full"
                  opts={{
                    loop: true,
                  }}
                >
                  <CarouselContent>
                    {advertisements.map((ad, index) =>
                      ad.enable ? (
                        <CarouselItem key={index}>
                          <div className="relative w-full aspect-[21/12] rounded-xl overflow-hidden border-2 border-border">
                            <Image
                              src={ad.image}
                              alt={`Publicité ${index + 1}`}
                              fill
                              className="object-cover"
                              priority={index === 0}
                            />
                          </div>
                        </CarouselItem>
                      ) : (
                        <></>
                      )
                    )}
                  </CarouselContent>
                  {advertisements.filter((ad) => ad.enable).length > 1 && (
                    <>
                      <CarouselPrevious id="previous-carousel" className="left-2" />
                      <CarouselNext id="next-carousel" className="right-2" />
                    </>
                  )}
                </Carousel>
              </div>
            ) : (
              <Card className="border-2 border-dashed border-muted-foreground/20 bg-card/50 backdrop-blur-sm">
                <CardContent className="flex items-center justify-center py-8">
                  <div className="text-center space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Espace publicitaire à venir
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Options en grid 2x2 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Dépôt */}
            <Link href="/dashboardv3/deposit" className="group">
              <div className="relative overflow-hidden rounded-xl bg-card/60 backdrop-blur-md border border-border/50 p-4 shadow-lg hover:shadow-xl hover:shadow-deposit/20 transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-deposit/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-deposit/20 border border-deposit/30 group-hover:bg-deposit/30 transition-all">
                    <ArrowDownToLine className="h-5 w-5 text-deposit" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Dépôt</h3>
                </div>
              </div>
            </Link>

            {/* Retrait */}
            <Link href="/dashboardv3/withdrawal" className="group">
              <div className="relative overflow-hidden rounded-xl bg-card/60 backdrop-blur-md border border-border/50 p-4 shadow-lg hover:shadow-xl hover:shadow-withdrawal/20 transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-withdrawal/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-withdrawal/20 border border-withdrawal/30 group-hover:bg-withdrawal/30 transition-all">
                    <ArrowUpFromLine className="h-5 w-5 text-withdrawal" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Retrait</h3>
                </div>
              </div>
            </Link>

            {/* Numéros & IDs */}
            <Link href="/dashboardv3/phones" className="group">
              <div className="relative overflow-hidden rounded-xl bg-card/60 backdrop-blur-md border border-border/50 p-4 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/20 border border-primary/30 group-hover:bg-primary/30 transition-all">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground leading-tight">Numéros & IDs</h3>
                </div>
              </div>
            </Link>

            {/* Coupons */}
            <Link href="/dashboardv3/coupon" className="group">
              <div className="relative overflow-hidden rounded-xl bg-card/60 backdrop-blur-md border border-border/50 p-4 shadow-lg hover:shadow-xl hover:shadow-yellow-500/20 transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30 group-hover:bg-yellow-500/30 transition-all">
                    <Ticket className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">Coupons</h3>
                </div>
              </div>
            </Link>
          </div>

          {/* Activité récente */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-foreground">Activité récente</h2>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={fetchRecentTransactions}
                  disabled={isLoadingTransactions}
                  className="h-8 w-8 rounded-lg bg-card/60 backdrop-blur-md border border-border/50 hover:bg-card/80"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
                </Button>
                <Button 
                  asChild 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 rounded-lg bg-card/60 backdrop-blur-md border border-border/50 hover:bg-card/80"
                >
                  <Link href="/dashboardv3/history">
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            
            {isLoadingTransactions ? (
              <Card className="border border-border/50 bg-card/60 backdrop-blur-md shadow-lg">
                <CardContent className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </CardContent>
              </Card>
            ) : recentTransactions.length === 0 ? (
              <Card className="border border-border/50 bg-card/60 backdrop-blur-md shadow-lg">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="p-3 rounded-xl bg-muted/30 mb-3">
                    <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground text-center mb-1">Aucune transaction récente</p>
                  <p className="text-xs text-muted-foreground text-center">Vos transactions apparaîtront ici</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((transaction) => {
                  const isDeposit = transaction.type_trans === "deposit"
                  const statusConfig: Record<string, { label: string; className: string }> = {
                    accept: { label: "Accepté", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
                    init_payment: { label: "En attente", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
                    pending: { label: "En attente", className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
                    error: { label: "Erreur", className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
                    reject: { label: "Rejeté", className: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30" },
                    timeout: { label: "Expiré", className: "bg-muted text-muted-foreground border-border" },
                  }
                  const status = statusConfig[transaction.status] ?? { label: transaction.status, className: "bg-muted text-muted-foreground border-border" }
                  return (
                    <div
                      key={transaction.id}
                      className="group rounded-xl border border-border/50 bg-card/70 backdrop-blur-md p-4 shadow-sm hover:shadow-md hover:border-border/70 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex gap-3 flex-1 min-w-0">
                          <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                            isDeposit ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-primary/20 text-primary"
                          }`}>
                            {isDeposit ? (
                              <ArrowDownToLine className="h-5 w-5" />
                            ) : (
                              <ArrowUpFromLine className="h-5 w-5" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground mb-0.5">
                              {isDeposit ? "Dépôt" : "Retrait"}
                            </p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs text-muted-foreground font-mono truncate max-w-[140px]">
                                #{transaction.reference.slice(0, 12)}…
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  navigator.clipboard.writeText(transaction.reference)
                                  toast.success("Référence copiée !")
                                }}
                                className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                title="Copier la référence"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className={`inline-block mt-2 text-[11px] font-medium px-2 py-0.5 rounded-md border ${status.className}`}>
                              {status.label}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold tabular-nums ${
                            isDeposit ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
                          }`}>
                            {isDeposit ? "+" : "−"}
                            {transaction.amount.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            <span className="text-xs font-normal text-muted-foreground ml-0.5">FCFA</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {format(new Date(transaction.created_at), "dd MMM à HH:mm", { locale: fr })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Contenu aligné en bas */}
          <div className="flex-1 flex flex-col justify-end">
            <div className="w-full space-y-4">
              {/* Contenu à ajouter ici */}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

