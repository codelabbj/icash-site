"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Youtube, HelpCircle, ExternalLink } from "lucide-react"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"

interface AmountStepProps {
  amount: number
  setAmount: (amount: number) => void
  withdriwalCode: string
  setWithdriwalCode: (code: string) => void
  selectedPlatform: Platform | null
  selectedBetId: UserAppId | null
  selectedNetwork: Network | null
  selectedPhone: UserPhone | null
  type: "deposit" | "withdrawal"
  onNext: () => void
}

export function AmountStep({
  amount,
  setAmount,
  withdriwalCode,
  setWithdriwalCode,
  selectedPlatform,
  selectedBetId,
  selectedNetwork,
  selectedPhone,
  type,
  onNext
}: AmountStepProps) {
  const [errors, setErrors] = useState<{ amount?: string; withdriwalCode?: string }>({})

  const validateAmount = (value: number) => {
    if (!selectedPlatform) return "Plateforme non sélectionnée"
    if (value <= 0) return "Le montant doit être supérieur à 0"
    
    const minAmount = type === "deposit" ? selectedPlatform.minimun_deposit : selectedPlatform.minimun_with
    const maxAmount = type === "deposit" ? selectedPlatform.max_deposit : selectedPlatform.max_win
    
    if (value < minAmount) return `Le montant minimum est ${minAmount.toLocaleString()} FCFA`
    if (value > maxAmount) return `Le montant maximum est ${maxAmount.toLocaleString()} FCFA`
    
    return null
  }

  const validateWithdriwalCode = (code: string) => {
    if (type === "withdrawal" && code.length < 4) {
      return "Le code de retrait doit contenir au moins 4 caractères"
    }
    return null
  }

  const handleAmountChange = (value: string) => {
    const numValue = parseFloat(value) || 0
    setAmount(numValue)
    
    const error = validateAmount(numValue)
    setErrors(prev => ({ ...prev, amount: error || undefined }))
  }

  const handleWithdriwalCodeChange = (value: string) => {
    setWithdriwalCode(value)
    
    const error = validateWithdriwalCode(value)
    setErrors(prev => ({ ...prev, withdriwalCode: error || undefined }))
  }

  const isFormValid = () => {
    const amountError = validateAmount(amount)
    const withdriwalCodeError = type === "withdrawal" ? validateWithdriwalCode(withdriwalCode) : null
    
    return !amountError && !withdriwalCodeError && 
           selectedPlatform && selectedBetId && selectedNetwork && selectedPhone
  }

  if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Veuillez compléter les étapes précédentes</p>
      </div>
    )
  }

  const isDeposit = type === "deposit"

  return (
    <div className="space-y-3">
      {/* Transaction Summary */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2.5 px-1">Résumé de la transaction</h3>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
          <div className="relative z-10 p-3 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Type</span>
              <Badge variant={isDeposit ? "default" : "secondary"} className="text-[10px] px-2 py-0.5 h-5">
                {isDeposit ? "Dépôt" : "Retrait"}
              </Badge>
            </div>
            
            <div className="h-px bg-border/40"></div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Plateforme</span>
              <span className="text-xs font-semibold">{selectedPlatform.name}</span>
            </div>

            {selectedPlatform.city && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Ville</span>
                <span className="text-xs font-semibold">{selectedPlatform.city}</span>
              </div>
            )}

            {selectedPlatform.street && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Rue</span>
                <span className="text-xs font-semibold">{selectedPlatform.street}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">ID de pari</span>
              <span className="text-xs font-semibold font-mono">{selectedBetId.user_app_id}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Réseau</span>
              <span className="text-xs font-semibold">{selectedNetwork.public_name}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Téléphone</span>
              <span className="text-xs font-semibold">+{selectedPhone.phone.slice(0,3)} {selectedPhone.phone.slice(3)}</span>
            </div>
          </div>
        </div>
      </div>

        {/* Network Message */}
        {selectedNetwork && (() => {
            const message = type === "deposit"
                ? selectedNetwork.deposit_message
                : selectedNetwork.withdrawal_message

            if (!message || message.trim() === "") return null

            return (
                <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
                    <div className="p-3">
                        <p className="text-xs text-foreground whitespace-pre-wrap break-words leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>
            )
        })()}

      {/* Important: numéro de paiement (dépôt uniquement) */}
      {isDeposit && selectedPhone && (
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-foreground leading-relaxed">
            <strong>Important :</strong> Le numéro <strong>{selectedPhone.phone}</strong> est celui que vous avez choisi. C’est avec ce même numéro que vous devez effectuer le paiement (USSD ou lien de paiement).
          </p>
        </div>
      )}

      {/* Amount Input */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2.5 px-1">Montant de la transaction</h3>
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
          <div className="relative z-10 p-3">
            <div>
              <Label htmlFor="amount" className="text-xs">Montant (FCFA)</Label>
              <Input
                id="amount"
                type="number"
                value={amount || ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Entrez le montant"
                className={`h-8 text-xs mt-1.5 ${errors.amount ? "border-red-500" : ""}`}
              />
              {errors.amount && (
                <p className="text-[10px] text-red-500 mt-1">{errors.amount}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>Min: {isDeposit ? selectedPlatform.minimun_deposit.toLocaleString() : selectedPlatform.minimun_with.toLocaleString()} FCFA</span>
                <span>•</span>
                <span>Max: {isDeposit ? selectedPlatform.max_deposit.toLocaleString() : selectedPlatform.max_win.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Withdrawal Code (only for withdrawals) */}
      {type === "withdrawal" && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-2.5 px-1">Code de retrait</h3>
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
            <div className="relative z-10 p-3">
              <div>
                <Label htmlFor="withdriwalCode" className="text-xs">Code de retrait</Label>
                <Input
                  id="withdriwalCode"
                  type="text"
                  value={withdriwalCode}
                  onChange={(e) => handleWithdriwalCodeChange(e.target.value)}
                  placeholder="Entrez votre code de retrait"
                  className={`h-8 text-xs mt-1.5 ${errors.withdriwalCode ? "border-red-500" : ""}`}
                />
                {errors.withdriwalCode && (
                  <p className="text-[10px] text-red-500 mt-1">{errors.withdriwalCode}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Links */}
      {(type === "withdrawal" && (selectedPlatform.why_withdrawal_fail || selectedPlatform.withdrawal_tuto_link)) ||
        (type === "deposit" && selectedPlatform.deposit_tuto_link) ? (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent backdrop-blur-md border border-primary/20 shadow-lg">
          <div className="relative z-10 p-3 space-y-2.5">
            <h4 className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
              <HelpCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              Besoin d'aide ?
            </h4>
            <div className={`grid gap-2 ${type === "withdrawal" && selectedPlatform.why_withdrawal_fail && selectedPlatform.withdrawal_tuto_link
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1"
              }`}>
              {type === "withdrawal" && selectedPlatform.why_withdrawal_fail && (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-lg border border-red-200/60 bg-red-500/5 hover:bg-red-500/10 text-xs font-medium text-red-600 dark:text-red-400 h-8 px-2.5 transition-colors"
                  onClick={() => window.open(selectedPlatform.why_withdrawal_fail!, "_blank", "noopener,noreferrer")}
                >
                  <Youtube className="h-3 w-3 text-red-500 shrink-0" />
                  <span className="truncate sm:whitespace-normal text-left flex-1 min-w-0">Pourquoi le retrait échoue ?</span>
                  <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                </button>
              )}
              {type === "withdrawal" && selectedPlatform.withdrawal_tuto_link && (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-xs font-medium text-foreground h-8 px-2.5 transition-colors"
                  onClick={() => window.open(selectedPlatform.withdrawal_tuto_link!, "_blank", "noopener,noreferrer")}
                >
                  <Youtube className="h-3 w-3 text-red-500 shrink-0" />
                  <span className="truncate sm:whitespace-normal text-left flex-1 min-w-0">Tutoriel de retrait</span>
                  <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                </button>
              )}
              {type === "deposit" && selectedPlatform.deposit_tuto_link && (
                <button
                  type="button"
                  className="w-full flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 text-xs font-medium text-foreground h-8 px-2.5 transition-colors"
                  onClick={() => window.open(selectedPlatform.deposit_tuto_link!, "_blank", "noopener,noreferrer")}
                >
                  <Youtube className="h-3 w-3 text-red-500 shrink-0" />
                  <span className="truncate sm:whitespace-normal text-left flex-1 min-w-0">Tutoriel de dépôt</span>
                  <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Continue Button */}
      <div className="flex justify-end pt-1">
        <Button
          onClick={onNext}
          disabled={!isFormValid()}
          className="min-w-[100px] h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg disabled:opacity-50"
        >
          <span className="text-xs font-semibold">Continuer</span>
        </Button>
      </div>
    </div>
  )
}
