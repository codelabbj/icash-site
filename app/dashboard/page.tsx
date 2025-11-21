"use client"

import {useState, useEffect, useRef} from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDownToLine, ArrowUpFromLine, Wallet, Loader2, ArrowRight, RefreshCw, Phone,Gift } from "lucide-react"
import Link from "next/link"
import { transactionApi, advertisementApi } from "@/lib/api-client"
import type {Advertisement, Transaction} from "@/lib/types"
import { toast } from "react-hot-toast"
import { useSettings } from "@/lib/hooks/use-settings"
import {Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious} from "@/components/ui/carousel";
import Image from "next/image"
import {TransactionCard} from "@/components/transaction/TransactionCard";

export default function DashboardPage() {
  const { user } = useAuth()
  const { referralBonus } = useSettings()
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([])
  const [isLoadingAd, setIsLoadingAd] = useState(true)
    const carouselRef = useRef<HTMLDivElement>(null)
    const [isCarouselHovered, setIsCarouselHovered] = useState<boolean>(false)


  useEffect(() => {
    if (user) {
      fetchRecentTransactions()
        fetchAdvertisements()
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

    useEffect(() => {
        const autoScrollCarousel = () =>{
            if(!isCarouselHovered){
                const next = document.getElementById("next")
                if (next) next.click()
            }
        }

        const intervalId = setInterval(autoScrollCarousel, 5000)
        return () => clearInterval(intervalId)
    }, [isCarouselHovered]);

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

  const fetchAdvertisements = async () => {
      try {
          setIsLoadingAd(true)
          const data = await advertisementApi.get()
          setAdvertisements(data.results)
      }catch (error) {
          console.error("Error fetching advertisements:", error)
          toast.error("Erreur lors du chargement des publicités")
      } finally {
          setIsLoadingAd(false)
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
        <div className="grid grid-cols-4 gap-2 sm:gap-4 sm:flex sm:flex-row">
          <Link href="/dashboard/deposit" className="group flex-1">
            <div className="h-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-deposit via-deposit/90 to-deposit/80 p-3 sm:p-4 lg:p-6 text-white shadow-lg hover:shadow-xl hover:shadow-deposit/40 transition-all duration-300 hover:scale-[1.02] border-2 border-deposit/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 h-full flex flex-col items-center gap-2 sm:flex-row sm:gap-4 sm:justify-between">
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

          <Link href="/dashboard/withdrawal" className="group flex-1">
            <div className="h-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-withdrawal via-withdrawal/90 to-withdrawal/80 p-3 sm:p-4 lg:p-6 text-white shadow-lg hover:shadow-xl hover:shadow-withdrawal/40 transition-all duration-300 hover:scale-[1.02] border-2 border-withdrawal/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 h-full flex flex-col items-center gap-2 sm:flex-row sm:gap-4 sm:justify-between">
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

          <Link href="/dashboard/phones" className="group flex-1">
            <div className="h-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-3 sm:p-4 lg:p-6 text-white shadow-lg hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] border-2 border-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 h-full flex flex-col items-center gap-2 sm:flex-row sm:gap-4 sm:justify-between">
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
            <Link href="/dashboard/bonus" className="group flex-1">
              <div className="h-full relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 via-yellow-500/90 to-yellow-500/80 p-3 sm:p-4 lg:p-6 text-white shadow-lg hover:shadow-xl hover:shadow-yellow-500/40 transition-all duration-300 hover:scale-[1.02] border-2 border-yellow-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 h-full flex flex-col items-center gap-2 sm:flex-row sm:gap-4 sm:justify-between">
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

        {/* Ads Section */}
        {
            isLoadingAd ?(
                <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/10">
                    <CardContent className="flex items-center justify-center py-8 sm:py-12">
                        <div className="flex gap-2 items-center justifiy-center text-primary space-y-2">
                            <Loader2 className="h-4 w-4 animate-spin"/>
                            <p className="text-sm sm:text-base font-medium text-muted-foreground">
                                Chargement...
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ): advertisements.length > 0  && advertisements.find((ad)=>ad.enable) ? (
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
                                        <div className="relative w-full aspect-[21/9] sm:aspect-[21/6]">
                                            <Image
                                                src={ad.image}
                                                alt={`Publicité ${index + 1}`}
                                                fill
                                                className="object-fit border-2 rounded-lg"
                                                priority={index === 0}
                                            />
                                        </div>
                                    </CarouselItem>
                                ):(
                                    <></>
                                )
                            )}
                        </CarouselContent>
                        {advertisements.length > 1 && (
                            <>
                                <CarouselPrevious id="previous" className="left-2 sm:left-4" />
                                <CarouselNext id="next" className="right-2 sm:right-4" />
                            </>
                        )}

                    </Carousel>
                </div>
            ) : (
                <Card className="border-2 border-dashed border-muted-foreground/20 bg-muted/10">
                    <CardContent className="flex items-center justify-center py-8 sm:py-12">
                        <div className="text-center space-y-2">
                            <p className="text-sm sm:text-base font-medium text-muted-foreground">
                                Espace publicitaire à venir
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                                Les publicités arriveront bientôt ici
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )
        }

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
                <TransactionCard key={transaction.id} transaction={transaction}/>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
