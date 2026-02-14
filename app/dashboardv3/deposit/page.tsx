"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, Moon, Sun } from "lucide-react"
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
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import icashLogo from "@/public/icash-logo.png"

export default function DepositPage() {
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
      setIsConfirmationOpen(false)

      const detailUrl = `/dashboardv3/history/detail?id=${response.id}`

      // Ouvrir lien ou USSD puis toujours rediriger vers le détail
      const ussdCode = (response as { ussd_code?: string | null }).ussd_code?.trim()
      if (ussdCode) {
        setTimeout(() => { window.location.href = `tel:${ussdCode}` }, 300)
        setTimeout(() => router.push(detailUrl), 800)
        return
      }
      if (response.transaction_link) {
        window.open(response.transaction_link, "_blank", "noopener,noreferrer")
        router.push(detailUrl)
        return
      }

      router.push(detailUrl)
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
            onSelect={(platform)=>{
                setSelectedPlatform(platform)
                setTimeout(()=>{setCurrentStep(currentStep + 1)}, 1000)
            }}
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <BetIdStep
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            onSelect={(betId)=>{
                setSelectedBetId(betId)
                setTimeout(()=>{setCurrentStep(currentStep + 1)}, 1000)
            }}
            onNext={handleNext}
          />
        )
      case 3:
        return (
          <NetworkStep
            selectedNetwork={selectedNetwork}
            onSelect={(network)=>{
                setSelectedNetwork(network)
                setTimeout(()=>{setCurrentStep(currentStep + 1)}, 1000)
            }}
            type="deposit"
          />
        )
      case 4:
        return (
          <PhoneStep
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            onSelect={(phone)=>{
                setSelectedPhone(phone)
                setTimeout(()=>{setCurrentStep(currentStep + 1)}, 1000)
            }}
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
                <span className="text-foreground font-bold text-base bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Dépôt</span>
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

          {/* Progress Bar - Plus compact */}
          <div className="mb-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-lg p-3">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent"></div>
              <div className="relative z-10">
                <TransactionProgressBar 
                  currentStep={currentStep} 
                  totalSteps={totalSteps}
                  type="deposit"
                />
              </div>
            </div>
          </div>

          {/* Current Step - Plus compact */}
          <div className="mb-3">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
              <div className="relative z-10 p-3 min-h-[280px] sm:min-h-[320px]">
                {renderCurrentStep()}
              </div>
            </div>
          </div>

          {/* Navigation - Plus compact */}
          {currentStep < 5 && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
              <div className="relative z-10 p-3">
                <StepNavigation
                  currentStep={currentStep}
                  totalSteps={totalSteps}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  isNextDisabled={!isStepValid()}
                />
              </div>
            </div>
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

        </div>
      </div>
    </div>
  )
}
