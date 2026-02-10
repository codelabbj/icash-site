"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { SafeImage } from "@/components/ui/safe-image"
import { Loader2, Check} from "lucide-react"
import { platformApi } from "@/lib/api-client"
import type { Platform } from "@/lib/types"
import { toast } from "react-hot-toast"

interface PlatformStepProps {
  selectedPlatform: Platform | null
  onSelect: (platform: Platform) => void
  onNext: () => void
}

export function PlatformStep({ selectedPlatform, onSelect}: PlatformStepProps) {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const data = await platformApi.getAll()
        // Filter only enabled platforms
        const enabledPlatforms = data.filter(platform => platform.enable)
        setPlatforms(enabledPlatforms)
      } catch (error) {
        toast.error("Erreur lors du chargement des plateformes")
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlatforms()
  }, [])

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

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Choisir une plateforme</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`relative overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer group ${
              selectedPlatform?.id === platform.id
                ? "border-primary/60 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-lg shadow-primary/10 scale-[0.98]"
                : "border-border/40 bg-gradient-to-br from-card/50 to-card/30 hover:border-border/60 hover:shadow-md"
            }`}
            onClick={() => onSelect(platform)}
          >
            {/* Selected indicator */}
            {selectedPlatform?.id === platform.id && (
              <div className="absolute top-2 right-2 z-10">
                <div className="p-1.5 rounded-full bg-primary border border-primary/30">
                  <Check className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
            
            <div className="p-2.5">
              <div className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <div className={`absolute inset-0 rounded-lg blur-sm ${
                    selectedPlatform?.id === platform.id ? "bg-primary/30" : "bg-muted/30"
                  }`}></div>
                  <SafeImage
                    src={platform.image}
                    alt={platform.name}
                    className="relative w-10 h-10 rounded-lg object-cover border border-border/30"
                    fallbackText={platform.name.charAt(0).toUpperCase()}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm truncate ${
                    selectedPlatform?.id === platform.id ? "text-foreground" : "text-foreground/90"
                  }`}>
                    {platform.name}
                  </h3>
                  {(platform.city || platform.street) && (
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {platform.city && <span>{platform.city}</span>}
                      {platform.city && platform.street && <span> • </span>}
                      {platform.street && <span>{platform.street}</span>}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-border/40 bg-muted/30">
                  Min: {platform.minimun_deposit.toLocaleString()}
                </Badge>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-border/40 bg-muted/30">
                  Max: {platform.max_deposit.toLocaleString()}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {platforms.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">Aucune plateforme disponible</p>
        </div>
      )}
    </div>
  )
}
