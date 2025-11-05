"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Filter, RefreshCw, ArrowDownToLine, ArrowUpFromLine, Copy, Check, ArrowLeft } from "lucide-react"
import { transactionApi } from "@/lib/api-client"
import type { Transaction } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function TransactionHistoryPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [copiedReference, setCopiedReference] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "deposit" | "withdrawal">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accept" | "reject" | "timeout">("all")

  useEffect(() => {
    fetchTransactions()
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Veuillez vous connecter pour voir l'historique</p>
      </div>
    )
  }

  const router = useRouter()

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl hover:bg-muted shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Historique des transactions</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 hidden sm:block">
              Consultez toutes vos transactions de dépôt et de retrait
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-2 border-transparent bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
              </div>
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={(value) => handleFilterChange("type", value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="deposit">Dépôts</SelectItem>
                  <SelectItem value="withdrawal">Retraits</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger className="text-sm">
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
              
              <Button variant="outline" onClick={clearFilters} className="text-sm w-full sm:w-auto">
                Effacer
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <Card className="border-2 border-transparent bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 text-base sm:text-lg">
              <div className="flex items-center gap-2">
                <span>Transactions</span>
                <span className="px-2 py-0.5 sm:py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium">{totalCount}</span>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={fetchTransactions}
                  disabled={isLoading}
                  title="Actualiser les données"
                  className="rounded-xl border-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <p className="text-sm sm:text-base text-muted-foreground">Aucune transaction trouvée</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Vos transactions apparaîtront ici une fois effectuées
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="group hover:shadow-xl hover:scale-[1.01] transition-all duration-300 border-2 border-transparent hover:border-primary/20 bg-gradient-to-r from-card via-card to-transparent hover:via-primary/5">
                    <CardContent className="p-3 sm:p-5">
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
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
                          <div className="flex-1 min-w-0 space-y-1.5 sm:space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
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
                                    <Check className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-green-600" />
                                  ) : (
                                    <Copy className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-muted-foreground hover:text-foreground" />
                                  )}
                                </Button>
                              </div>
                              {getTypeBadge(transaction.type_trans)}
                              {getStatusBadge(transaction.status)}
                            </div>
                            <div className="flex flex-col gap-1 text-[10px] sm:text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Plateforme:</span>
                                <span className="truncate">{transaction.app}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">ID de pari:</span>
                                <span className="truncate">{transaction.user_app_id}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Téléphone:</span>
                                <span className="truncate">{transaction.phone_number}</span>
                              </div>
                              {transaction.withdriwal_code && (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Code de retrait:</span>
                                  <span className="px-1.5 sm:px-2 py-0.5 rounded bg-primary/10 text-primary font-mono text-[10px] sm:text-xs">{transaction.withdriwal_code}</span>
                                </div>
                              )}
                            </div>
                            {transaction.error_message && (
                              <p className="text-[10px] sm:text-xs text-destructive font-medium">
                                ⚠️ {transaction.error_message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0 flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2">
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
                            {format(new Date(transaction.created_at), "dd MMM yyyy à HH:mm", {
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6">
                <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                  Page {currentPage} sur {totalPages} ({totalCount} transactions)
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex-1 sm:flex-initial text-xs sm:text-sm"
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}