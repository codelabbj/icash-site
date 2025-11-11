"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TransactionProgressBar } from "@/components/transaction/progress-bar"
import { StepNavigation } from "@/components/transaction/step-navigation"
import { ConfirmationDialog } from "@/components/transaction/confirmation-dialog"
import { PlatformStep } from "@/components/transaction/steps/platform-step"
import { BetIdStep } from "@/components/transaction/steps/bet-id-step"
import { NetworkStep } from "@/components/transaction/steps/network-step"
import { PhoneStep } from "@/components/transaction/steps/phone-step"
import { AmountStep } from "@/components/transaction/steps/amount-step"
import { transactionApi } from "@/lib/api-client"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"
import { toast } from "react-hot-toast"
import { normalizePhoneNumber } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function DepositPage() {
  const router = useRouter()
  const { user } = useAuth()
  
  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5
  
  // Form data
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)
  
  // Confirmation dialog
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Transaction link modal
  const [transactionLink, setTransactionLink] = useState<string | null>(null)
  const [isTransactionLinkModalOpen, setIsTransactionLinkModalOpen] = useState(false)

  // Redirect if not authenticated
  if (!user) {
    router.push("/login")
    return null
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsConfirmationOpen(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConfirmTransaction = async () => {
    if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
      toast.error("Données manquantes pour la transaction")
      return
    }

    setIsSubmitting(true)
    try {
      const response = await transactionApi.createDeposit({
        amount,
        phone_number: normalizePhoneNumber(selectedPhone.phone),
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        network: selectedNetwork.id,
        source: "web"
      })
      
      toast.success("Dépôt initié avec succès!")
      
      // Check if transaction_link exists in the response
      if (response.transaction_link) {
        setTransactionLink(response.transaction_link)
        setIsTransactionLinkModalOpen(true)
        setIsConfirmationOpen(false)
      } else {
        router.push("/dashboard")
      }
    } catch (error: any) {
      // Error message is already handled by API interceptor
      // Only show additional toast if it's not the rate limiting error
      if (!error?.response?.data?.error_time_message) {
        // Generic error toast is already shown by interceptor, but we can add context if needed
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContinueTransaction = () => {
    if (transactionLink) {
      window.open(transactionLink, "_blank", "noopener,noreferrer")
      setIsTransactionLinkModalOpen(false)
      router.push("/dashboard")
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return selectedPlatform !== null
      case 2:
        return selectedBetId !== null
      case 3:
        return selectedNetwork !== null
      case 4:
        return selectedPhone !== null
      case 5:
        return amount > 0 && selectedPlatform && 
               amount >= selectedPlatform.minimun_deposit && 
               amount <= selectedPlatform.max_deposit
      default:
        return false
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PlatformStep
            selectedPlatform={selectedPlatform}
            onSelect={setSelectedPlatform}
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <BetIdStep
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            onSelect={setSelectedBetId}
            onNext={handleNext}
          />
        )
      case 3:
        return (
          <NetworkStep
            selectedNetwork={selectedNetwork}
            onSelect={setSelectedNetwork}
            type="deposit"
          />
        )
      case 4:
        return (
          <PhoneStep
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            onSelect={setSelectedPhone}
            onNext={handleNext}
          />
        )
      case 5:
    return (
          <AmountStep
            amount={amount}
            setAmount={setAmount}
            withdriwalCode=""
            setWithdriwalCode={() => {}}
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            type="deposit"
            onNext={handleNext}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl hover:bg-muted shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Effectuer un dépôt</h1>
          </div>
        </div>

        {/* Progress Bar */}
        <TransactionProgressBar 
          currentStep={currentStep} 
          totalSteps={totalSteps}
          type="deposit"
        />

        {/* Current Step */}
        <div className="min-h-[300px] sm:min-h-[400px]">
          {renderCurrentStep()}
        </div>

        {/* Navigation */}
        {currentStep < 5 && (
          <StepNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onPrevious={handlePrevious}
            onNext={handleNext}
            isNextDisabled={!isStepValid()}
          />
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={handleConfirmTransaction}
          transactionData={{
            amount,
            phone_number: selectedPhone?.phone || "",
            app: selectedPlatform?.id || "",
            user_app_id: selectedBetId?.user_app_id || "",
            network: selectedNetwork?.id || 0,
          }}
          type="deposit"
          platformName={selectedPlatform?.name || ""}
          networkName={selectedNetwork?.public_name || ""}
          isLoading={isSubmitting}
        />

        {/* Transaction Link Modal */}
        <Dialog open={isTransactionLinkModalOpen} onOpenChange={setIsTransactionLinkModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Continuer la transaction</DialogTitle>
              <DialogDescription>
                Cliquez sur continuer pour continuer la transaction
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={handleContinueTransaction}>
                Continuer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}