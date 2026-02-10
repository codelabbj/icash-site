"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { SafeImage } from "@/components/ui/safe-image"
import { Loader2, Check } from "lucide-react"
import { networkApi } from "@/lib/api-client"
import type { Network } from "@/lib/types"
import { TRANSACTION_TYPES, getTransactionTypeLabel } from "@/lib/constants"

interface NetworkStepProps {
  selectedNetwork: Network | null
  onSelect: (network: Network) => void
  type: "deposit" | "withdrawal"
}

export function NetworkStep({ selectedNetwork, onSelect, type }: NetworkStepProps) {
  const [networks, setNetworks] = useState<Network[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        const data = await networkApi.getAll()
        // Filter networks based on transaction type
        const activeNetworks = data.filter(network => 
          type === TRANSACTION_TYPES.DEPOSIT ? network.active_for_deposit : network.active_for_with
        )
        setNetworks(activeNetworks)
      } catch (error) {
        console.error("Error fetching networks:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNetworks()
  }, [type])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
          <Loader2 className="h-6 w-6 animate-spin text-primary relative z-10" />
        </div>
      </div>
    )
  }

  const isDeposit = type === TRANSACTION_TYPES.DEPOSIT

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Choisir un réseau</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {networks.map((network) => (
          <div
            key={network.id}
            className={`relative overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer group ${
              selectedNetwork?.id === network.id
                ? `border-primary/60 bg-gradient-to-br ${
                    isDeposit 
                      ? "from-primary/20 via-primary/10 to-transparent shadow-lg shadow-primary/10" 
                      : "from-secondary/20 via-secondary/10 to-transparent shadow-lg shadow-secondary/10"
                  } scale-[0.98]`
                : "border-border/40 bg-gradient-to-br from-card/50 to-card/30 hover:border-border/60 hover:shadow-md"
            }`}
            onClick={() => onSelect(network)}
          >
            {/* Selected indicator */}
            {selectedNetwork?.id === network.id && (
              <div className="absolute top-2 right-2 z-10">
                <div className={`p-1.5 rounded-full border ${
                  isDeposit ? "bg-primary border-primary/30" : "bg-secondary border-secondary/30"
                }`}>
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            
            <div className="p-2.5">
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <div className={`absolute inset-0 rounded-lg blur-sm ${
                    selectedNetwork?.id === network.id 
                      ? isDeposit ? "bg-primary/30" : "bg-secondary/30"
                      : "bg-muted/30"
                  }`}></div>
                  <SafeImage
                    src={network.image}
                    alt={network.name}
                    className="relative w-10 h-10 rounded-lg object-cover border border-border/30"
                    fallbackText={network.public_name.charAt(0).toUpperCase()}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm truncate ${
                    selectedNetwork?.id === network.id ? "text-foreground" : "text-foreground/90"
                  }`}>
                    {network.public_name}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {network.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {network.active_for_deposit && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-border/40 bg-muted/30">
                        {getTransactionTypeLabel(TRANSACTION_TYPES.DEPOSIT)}
                      </Badge>
                    )}
                    {network.active_for_with && (
                      <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-border/40 bg-muted/30">
                        {getTransactionTypeLabel(TRANSACTION_TYPES.WITHDRAWAL)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {networks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Aucun réseau disponible pour {type === TRANSACTION_TYPES.DEPOSIT ? "les dépôts" : "les retraits"}
          </p>
        </div>
      )}
    </div>
  )
}
