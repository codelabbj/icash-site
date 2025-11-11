"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowDownToLine, ArrowUpFromLine, History, Wallet, Loader2, ArrowRight, RefreshCw, Copy, Check, Phone, Smartphone, Gift } from "lucide-react"
import Link from "next/link"
import { transactionApi, advertisementApi } from "@/lib/api-client"
import type { Transaction } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useSettings } from "@/lib/hooks/use-settings"

export default function DashboardPage() {
  const { user } = useAuth()
  const { referralBonus } = useSettings()
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [copiedReference, setCopiedReference] = useState<string | null>(null)
  const [advertisement, setAdvertisement] = useState<string | null>(null)
  const [isLoadingAd, setIsLoadingAd] = useState(true)

  useEffect(() => {
    if (user) {
      fetchRecentTransactions()
      fetchAdvertisement()
    }
  }, [user])

  // Refetch data when the page gains focus
  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchRecentTransactions()
      }
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user])

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

  const fetchAdvertisement = async () => {
    try {
      setIsLoadingAd(true)
      const data = await advertisementApi.get()
      // Check if advertisement has image URL
      // Handle different response formats: object with image field, or direct string
      if (data) {
        if (data?.image && typeof data.image === 'string' && data.image.trim() !== '') {
          setAdvertisement(data.image)
        } else {
          setAdvertisement(null)
        }
      } else {
        setAdvertisement(null)
      }
    } catch (error) {
      console.error("Error fetching advertisement:", error)
      setAdvertisement(null)
    } finally {
      setIsLoadingAd(false)
    }
  }

  const getStatusBadge = (status: Transaction["status"]) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending: { variant: "secondary", label: "En attente" },
      accept: { variant: "default", label: "Accepté" },
      init_payment: { variant: "secondary", label: "En attente" },
      error: { variant: "destructive", label: "Erreur" },
      reject: { variant: "destructive", label: "Rejeté" },
      timeout: { variant: "outline", label: "Expiré" },
    }
    
    const config = statusConfig[status] || { variant: "outline" as const, label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeBadge = (type: Transaction["type_trans"]) => {
    return (
      <Badge variant={type === "deposit" ? "default" : "secondary"}>
        {type === "deposit" ? "Dépôt" : "Retrait"}
      </Badge>
    )
  }

  const copyReference = async (reference: string) => {
    try {
      await navigator.clipboard.writeText(reference)
      setCopiedReference(reference)
      toast.success("Référence copiée!")
      setTimeout(() => setCopiedReference(null), 2000)
    } catch (error) {
      toast.error("Erreur lors de la copie")
    }
  }

  return (
    <div className="space-y-6 sm:space-y-10 px-4 sm:px-0">
      {/* Welcome section */}
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight gradient-text">
          Bienvenue, {user?.first_name}! 👋
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground">Gérez vos dépôts et retraits en toute simplicité</p>
      </div>

      {/* Balance card */}
      {/* <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
        <CardHeader>
          <CardDescription className="text-primary-foreground/80">Solde disponible</CardDescription>
          <CardTitle className="text-4xl font-bold">
            {user?.balance?.toLocaleString("fr-FR", {
              style: "currency",
              currency: "XOF",
              minimumFractionDigits: 0,
            }) || "0 FCFA"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button asChild variant="secondary" size="sm" className="text-deposit border-deposit hover:bg-deposit/10">
              <Link href="/dashboard/deposit">
                <ArrowDownToLine className="mr-2 h-4 w-4 text-deposit" />
                Déposer
              </Link>
            </Button>
            <Button asChild variant="secondary" size="sm" className="text-withdrawal border-withdrawal hover:bg-withdrawal/10">
              <Link href="/dashboard/withdrawal">
                <ArrowUpFromLine className="mr-2 h-4 w-4 text-withdrawal" />
                Retirer
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card> */}

      {/* Quick actions */}
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 sm:flex sm:flex-row">
          <Link href="/dashboard/deposit" className="group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-deposit via-deposit/90 to-deposit/80 p-3 sm:p-4 lg:p-6 text-white shadow-lg hover:shadow-xl hover:shadow-deposit/40 transition-all duration-300 hover:scale-[1.02] border-2 border-deposit/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
                <div className="p-2 sm:p-3 lg:p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all shrink-0">
                  <ArrowDownToLine className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="text-xs sm:text-sm lg:text-xl font-bold">Dépôt</h3>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-white/90 hidden sm:block">Rechargez rapidement</p>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold group-hover:translate-x-1 transition-transform shrink-0 hidden sm:block">
                  →
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/withdrawal" className="group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-withdrawal via-withdrawal/90 to-withdrawal/80 p-3 sm:p-4 lg:p-6 text-white shadow-lg hover:shadow-xl hover:shadow-withdrawal/40 transition-all duration-300 hover:scale-[1.02] border-2 border-withdrawal/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
                <div className="p-2 sm:p-3 lg:p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all shrink-0">
                  <ArrowUpFromLine className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="text-xs sm:text-sm lg:text-xl font-bold">Retrait</h3>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-white/90 hidden sm:block">Retirez vos gains</p>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold group-hover:translate-x-1 transition-transform shrink-0 hidden sm:block">
                  →
                </div>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/phones" className="group">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-3 sm:p-4 lg:p-6 text-white shadow-lg hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] border-2 border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
                <div className="p-2 sm:p-3 lg:p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all shrink-0">
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h3 className="text-xs sm:text-sm lg:text-xl font-bold leading-tight">Numéros & IDs</h3>
                  <p className="text-[10px] sm:text-xs lg:text-sm text-white/90 hidden sm:block">Gérez vos numéros et IDs</p>
                </div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold group-hover:translate-x-1 transition-transform shrink-0 hidden sm:block">
                  →
                </div>
              </div>
            </div>
          </Link>

          {referralBonus && (
            <Link href="/dashboard/bonus" className="group">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 via-yellow-500/90 to-yellow-500/80 p-3 sm:p-4 lg:p-6 text-white shadow-lg hover:shadow-xl hover:shadow-yellow-500/40 transition-all duration-300 hover:scale-[1.02] border-2 border-yellow-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex flex-col items-center gap-2 sm:flex-row sm:gap-4">
                  <div className="p-2 sm:p-3 lg:p-4 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all shrink-0">
                    <Gift className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <h3 className="text-xs sm:text-sm lg:text-xl font-bold leading-tight">Bonus</h3>
                    <p className="text-[10px] sm:text-xs lg:text-sm text-white/90 hidden sm:block">Voir mes bonus</p>
                  </div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold group-hover:translate-x-1 transition-transform shrink-0 hidden sm:block">
                    →
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Advertisement section */}
      {!isLoadingAd && (
        <div className="space-y-4 sm:space-y-6">
          <Card className="border-2 overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <CardContent className="p-0">
              <div className="relative w-full aspect-[3/1] bg-muted">
                {advertisement ? (
                  <img
                    src={advertisement}
                    alt="Advertisement"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.src = "/placeholder.jpg"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">Publicité</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent activity */}
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Activité récente</h2>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchRecentTransactions}
              disabled={isLoadingTransactions}
              className="rounded-xl border-2 flex-1 sm:flex-initial"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingTransactions ? 'animate-spin' : ''}`} />
            </Button>
            <Button asChild variant="outline" size="sm" className="rounded-xl border-2 flex-1 sm:flex-initial">
              <Link href="/dashboard/history" className="flex items-center justify-center gap-2">
                <span className="hidden sm:inline">Voir tout</span>
                <span className="sm:hidden">Tout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        
        {isLoadingTransactions ? (
          <Card className="border-2">
            <CardContent className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : recentTransactions.length === 0 ? (
          <Card className="border-2 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="p-3 sm:p-4 rounded-2xl bg-muted/50 mb-4 sm:mb-6">
                <Wallet className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
              </div>
              <p className="text-base sm:text-lg font-semibold text-muted-foreground text-center mb-1 sm:mb-2">Aucune transaction récente</p>
              <p className="text-xs sm:text-sm text-muted-foreground text-center">Vos transactions apparaîtront ici</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {recentTransactions.map((transaction) => (
              <Card key={transaction.id} className="group hover:shadow-xl hover:scale-[1.01] transition-all duration-300 border-2 border-transparent hover:border-primary/20 bg-gradient-to-r from-card via-card to-transparent hover:via-primary/5">
                <CardContent className="p-3 sm:p-4 lg:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                      <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${
                        transaction.type_trans === "deposit" 
                          ? "bg-gradient-to-br from-deposit/20 to-deposit/10 text-deposit ring-2 ring-deposit/10" 
                          : "bg-gradient-to-br from-withdrawal/20 to-withdrawal/10 text-withdrawal ring-2 ring-withdrawal/10"
                      }`}>
                        {transaction.type_trans === "deposit" ? (
                          <ArrowDownToLine className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <ArrowUpFromLine className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1 sm:mb-1.5">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <h3 className="font-bold text-sm sm:text-base text-foreground">#{transaction.reference}</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 sm:h-6 sm:w-6 rounded-md hover:bg-muted"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                copyReference(transaction.reference)
                              }}
                              title="Copier la référence"
                            >
                              {copiedReference === transaction.reference ? (
                                <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground hover:text-foreground" />
                              )}
                            </Button>
                          </div>
                          {getTypeBadge(transaction.type_trans)}
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                          <span className="font-medium">{transaction.app}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate">{transaction.phone_number}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1 sm:gap-1">
                      <p className={`text-base sm:text-lg font-bold ${
                        transaction.type_trans === "deposit" ? "text-deposit" : "text-withdrawal"
                      }`}>
                        {transaction.type_trans === "deposit" ? "+" : "-"}
                        {transaction.amount.toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "XOF",
                          minimumFractionDigits: 0,
                        })}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), "dd MMM à HH:mm", {
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
