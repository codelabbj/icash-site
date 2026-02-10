"use client"

import {useState, useEffect} from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowDownToLine, ArrowUpFromLine, Loader2, RefreshCw, ExternalLink } from "lucide-react"
import Link from "next/link"
import { transactionApi } from "@/lib/api-client"
import type {Transaction} from "@/lib/types"
import { toast } from "react-hot-toast"
import Image from "next/image"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function DashboardPageV2() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true)
  const [filter, setFilter] = useState<"all" | "deposit" | "withdrawal">("all")

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user, filter])

  const fetchTransactions = async () => {
    try {
      setIsLoadingTransactions(true)
      const params: any = {
        page: 1,
        page_size: 20,
      }
      
      if (filter !== "all") {
        params.type_trans = filter
      }
      
      const data = await transactionApi.getHistory(params)
      setTransactions(data.results)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast.error("Erreur lors du chargement des transactions")
    } finally {
      setIsLoadingTransactions(false)
    }
  }

  const filteredTransactions = transactions

  return (
    <div className="space-y-6">
      {/* Header avec navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">iCASH</h1>
          <p className="text-sm text-gray-400 mt-1">Tableau de bord</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className={filter === "all" ? "bg-[#FF6B35] hover:bg-[#FF8C42] text-white border-0" : "border-gray-700 text-gray-300"}
          >
            Tout
          </Button>
          <Button
            variant={filter === "deposit" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("deposit")}
            className={filter === "deposit" ? "bg-[#FF6B35] hover:bg-[#FF8C42] text-white border-0" : "border-gray-700 text-gray-300"}
          >
            Dépôt
          </Button>
          <Button
            variant={filter === "withdrawal" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("withdrawal")}
            className={filter === "withdrawal" ? "bg-[#FF6B35] hover:bg-[#FF8C42] text-white border-0" : "border-gray-700 text-gray-300"}
          >
            Retrait
          </Button>
        </div>
      </div>

      {/* Section Graphique - Remplacé par une image */}
      <Card className="bg-[#1a1a1a] border border-gray-800">
        <CardContent className="p-0">
          <div className="relative w-full aspect-[21/9] sm:aspect-[21/6]">
            <Image
              src="/placeholder-image.jpg"
              alt="Graphique"
              fill
              className="object-cover rounded-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Section Transactions */}
      <Card className="bg-[#1a1a1a] border border-gray-800">
        <CardContent className="p-0">
          {/* En-têtes du tableau */}
          <div className="grid grid-cols-5 gap-4 p-4 border-b border-gray-800">
            <div className="text-sm font-semibold text-gray-400">Temps</div>
            <div className="text-sm font-semibold text-gray-400">Type</div>
            <div className="text-sm font-semibold text-gray-400">Pour</div>
            <div className="text-sm font-semibold text-gray-400">Montant</div>
            <div className="text-sm font-semibold text-gray-400">Référence</div>
          </div>

          {/* Liste des transactions */}
          {isLoadingTransactions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6B35]" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-400">Aucune transaction</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid grid-cols-5 gap-4 p-4 hover:bg-[#2a2a2a] transition-colors"
                >
                  {/* Temps */}
                  <div className="text-sm text-gray-300">
                    {format(new Date(transaction.created_at), "HH:mm", { locale: fr })}
                  </div>

                  {/* Type */}
                  <div className="flex items-center">
                    {transaction.type_trans === "deposit" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-500/20 text-green-400">
                        <ArrowDownToLine className="h-3 w-3" />
                        Dépôt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400">
                        <ArrowUpFromLine className="h-3 w-3" />
                        Retrait
                      </span>
                    )}
                  </div>

                  {/* Pour */}
                  <div className="text-sm text-gray-300">
                    {transaction.app_details?.name || "N/A"}
                  </div>

                  {/* Montant */}
                  <div className={`text-sm font-semibold ${
                    transaction.type_trans === "deposit" ? "text-green-400" : "text-red-400"
                  }`}>
                    {transaction.type_trans === "deposit" ? "+" : "-"}
                    {transaction.amount.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                      minimumFractionDigits: 0,
                    })}
                  </div>

                  {/* Référence */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 font-mono">
                      {transaction.reference.slice(0, 8)}...
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(transaction.reference)
                        toast.success("Référence copiée")
                      }}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

