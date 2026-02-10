"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Loader2, CheckCircle } from "lucide-react"
import { toast } from "react-hot-toast"

interface TransactionData {
  amount: number
  phone_number: string
  app: string
  user_app_id: string
  network: number
  withdriwal_code?: string
}

interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  transactionData: TransactionData
  type: "deposit" | "withdrawal"
  platformName: string
  networkName: string
  isLoading?: boolean
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  transactionData,
  type,
  platformName,
  networkName,
  isLoading = false
}: ConfirmationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    try {
      await onConfirm()
      toast.success(
        type === "deposit" 
          ? "Dépôt initié avec succès!" 
          : "Retrait initié avec succès!"
      )
      onClose()
    } catch (error) {
      toast.error("Une erreur est survenue lors de la transaction")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 shrink-0" />
            <span>Confirmer {type === "deposit" ? "le dépôt" : "le retrait"}</span>
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Vérifiez les détails de votre transaction avant de confirmer
          </DialogDescription>
        </DialogHeader>

        <Card className="border-border/40 min-w-0">
          <CardHeader className="pb-3 min-w-0">
            <CardTitle className="text-sm sm:text-base min-w-0">
              Détails de la transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4 min-w-0">
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Type</span>
              <Badge variant={type === "deposit" ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                {type === "deposit" ? "Dépôt" : "Retrait"}
              </Badge>
            </div>
            
            <Separator />
            
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Montant</span>
              <span className="font-semibold text-xs sm:text-sm text-right break-words">
                {transactionData.amount.toLocaleString("fr-FR", {
                  style: "currency",
                  currency: "XOF",
                  minimumFractionDigits: 0,
                })}
              </span>
            </div>
            
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Plateforme</span>
              <span className="font-medium text-xs sm:text-sm text-right break-words">{platformName}</span>
            </div>
            
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">ID de pari</span>
              <span className="font-medium text-xs sm:text-sm text-right break-all">{transactionData.user_app_id}</span>
            </div>
            
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Réseau</span>
              <span className="font-medium text-xs sm:text-sm text-right break-words">{networkName}</span>
            </div>
            
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Numéro</span>
              <span className="font-medium text-xs sm:text-sm text-right break-all">{transactionData.phone_number}</span>
            </div>
            
            {type === "withdrawal" && transactionData.withdriwal_code && (
              <>
                <Separator />
                <div className="flex justify-between items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">Code de retrait</span>
                  <span className="font-medium text-xs sm:text-sm text-right break-all">{transactionData.withdriwal_code}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="w-full sm:w-auto h-9 text-xs sm:text-sm"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isSubmitting || isLoading}
            className="w-full sm:w-auto h-9 text-xs sm:text-sm min-w-[100px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                <span className="text-xs sm:text-sm">Traitement...</span>
              </>
            ) : (
              "Confirmer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
