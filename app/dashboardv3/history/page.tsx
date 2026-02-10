"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Filter, RefreshCw, ArrowLeft, Bell, Moon, Sun } from "lucide-react"
import { transactionApi } from "@/lib/api-client"
import type { Transaction } from "@/lib/types"
import { toast } from "react-hot-toast"
import { TransactionCard } from "@/components/transaction/TransactionCard"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import icashLogo from "@/public/icash-logo.png"

export default function TransactionHistoryPage() {
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
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "withdrawal">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accept" | "reject" | "timeout">("all")

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
      fetchTransactions()
    }
  }, [currentPage, searchTerm, typeFilter, statusFilter])

  // Refetch data when the page gains focus to ensure fresh data
  useEffect(() => {
    const handleFocus = () => {
      fetchTransactions()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const fetchTransactions = async () => {
    setIsLoading(true)
    try {
      const params: any = {
        page: currentPage,
        page_size: 10,
      }
      
      if (searchTerm) params.search = searchTerm
      if (typeFilter !== "all") params.type_trans = typeFilter
      if (statusFilter !== "all") params.status = statusFilter
      
      const data = await transactionApi.getHistory(params)
      setTransactions(data.results)
      setTotalCount(data.count)
      setTotalPages(Math.ceil(data.count / 10))
    } catch (error) {
      toast.error("Erreur lors du chargement de l'historique")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === "type") {
      setTypeFilter(value as any)
    } else if (filterType === "status") {
      setStatusFilter(value as any)
    }
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-muted-foreground">Veuillez vous connecter pour voir l'historique</p>
      </div>
    )
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
        <div className="w-full max-w-[420px] flex flex-col pt-2 sm:pt-3">
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
                  <div className="absolute inset-0 bg-primary/20 rounded-lg blur-sm"></div>
                  <Image src={icashLogo} alt="iCASH logo" className="w-7 h-7 relative z-10" />
                </div>
                <span className="text-foreground font-bold text-base bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Historique</span>
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

          {/* Filters */}
          <div className="mb-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
              <div className="relative z-10">
                <div className="p-3 border-b border-border/40 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/30">
                    <Filter className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold">Filtres</h3>
                </div>
                <div className="p-3 space-y-2.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3.5 w-3.5" />
                    <Input
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-9 h-8 text-xs"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={typeFilter} onValueChange={(value) => handleFilterChange("type", value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les types</SelectItem>
                        <SelectItem value="deposit">Dépôts</SelectItem>
                        <SelectItem value="withdrawal">Retraits</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="pending">En attente</SelectItem>
                        <SelectItem value="accept">Accepté</SelectItem>
                        <SelectItem value="reject">Rejeté</SelectItem>
                        <SelectItem value="timeout">Expiré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={clearFilters} 
                    className="w-full h-9 text-xs border-border/40"
                  >
                    Effacer les filtres
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="mb-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
              <div className="relative z-10">
                <div className="p-3 border-b border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold">Transactions</h3>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-semibold border border-primary/30">
                      {totalCount}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={fetchTransactions}
                    disabled={isLoading}
                    title="Actualiser les données"
                    className="h-7 w-7 p-0 rounded-lg bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="p-3">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                        <Loader2 className="h-8 w-8 animate-spin text-primary relative z-10" />
                      </div>
                    </div>
                  ) : transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="relative mb-4">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                        <div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-full border-2 border-primary/30">
                          <Filter className="h-8 w-8 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-foreground mb-1">Aucune transaction trouvée</h3>
                      <p className="text-xs text-muted-foreground">
                        Vos transactions apparaîtront ici une fois effectuées
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {transactions.map((transaction) => (
                        <TransactionCard key={transaction.id} transaction={transaction}/>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex flex-col items-center gap-2 mt-4 pt-3 border-t border-border/40">
                      <p className="text-xs text-muted-foreground text-center">
                        Page {currentPage} sur {totalPages} ({totalCount} transactions)
                      </p>
                      <div className="flex gap-2 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="flex-1 h-9 text-xs border-border/40"
                        >
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="flex-1 h-9 text-xs border-border/40"
                        >
                          Suivant
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
