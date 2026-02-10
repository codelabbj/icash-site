"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { authApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff, Mail, Lock, Code, ArrowLeft, Github, Moon, Sun } from "lucide-react"
import Image from "next/image"
import icashLogo from "@/public/icash-logo.png"
import { useTheme } from "next-themes"

// Form schemas
const emailSchema = z.object({
  email: z.string().email("Email invalide"),
})

const otpSchema = z.object({
  otp: z.string().min(4, "Le code OTP doit contenir au moins 4 caractères"),
})

const passwordSchema = z.object({
  new_password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirm_new_password: z.string().min(6, "La confirmation doit contenir au moins 6 caractères"),
}).refine((data) => data.new_password === data.confirm_new_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_new_password"],
})

type EmailFormData = z.infer<typeof emailSchema>
type OtpFormData = z.infer<typeof otpSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

type ForgotPasswordStep = "email" | "otp" | "password"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [step, setStep] = useState<ForgotPasswordStep>("email")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [resendTimer, setResendTimer] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Email form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  })

  // OTP form
  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  })

  // Password form
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true)
    try {
      await authApi.requestOtp(data.email)
      setEmail(data.email)
      setStep("otp")
      toast.success("Code OTP envoyé à votre email")
      // Start resend timer
      setResendTimer(60)
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.email?.[0] || "Erreur lors de l'envoi du code OTP"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpSubmit = async (data: OtpFormData) => {
    setOtp(data.otp)
    setStep("password")
    otpForm.reset()
  }

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setIsLoading(true)
    try {
      await authApi.resetPassword(otp, data.new_password, data.confirm_new_password)
      toast.success("Mot de passe réinitialisé avec succès!")
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push("/login")
      }, 1500)
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.otp?.[0] ||
        error?.response?.data?.new_password?.[0] ||
        "Erreur lors de la réinitialisation du mot de passe"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendTimer > 0) return

    setIsLoading(true)
    try {
      await authApi.requestOtp(email)
      toast.success("Code OTP renvoyé à votre email")
      setResendTimer(60)
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || "Erreur lors du renvoi du code OTP"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const goBack = () => {
    if (step === "email") {
      router.push("/login")
    } else if (step === "otp") {
      emailForm.reset()
      setEmail("")
      setStep("email")
    } else {
      otpForm.reset()
      setOtp("")
      setStep("otp")
    }
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative">
      {/* Logo en haut à gauche */}
      <div className="absolute top-6 left-6 z-20">
        <div className="flex items-center gap-2">
          <Image src={icashLogo} alt="iCASH logo" className="w-8 h-8" />
          <span className="text-foreground font-semibold text-lg">iCASH</span>
        </div>
      </div>

      {/* Toggle de thème en haut à droite */}
      <div className="absolute top-6 right-6 z-20">
            <Button
          variant="ghost"
          className="h-10 w-10 rounded-full bg-card hover:bg-card/80 text-foreground border border-border"
          onClick={() => {
            if (mounted) {
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
          }}
          title={`Passer en mode ${resolvedTheme === "dark" ? "clair" : "sombre"}`}
        >
          {mounted && resolvedTheme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Contenu centré */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto pt-12 sm:pt-24 pb-20 sm:pb-24">
        {/* Carte centrale */}
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl my-8">
          {/* Header avec bouton retour */}
          <div className="mb-8">
            <button
              type="button"
              onClick={goBack}
              className="mb-4 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Retour</span>
            </button>
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 text-center">
              {step === "email" && "Mot de passe oublié ?"}
              {step === "otp" && "Vérification"}
                {step === "password" && "Nouveau mot de passe"}
            </h1>
            <p className="text-sm text-muted-foreground text-center">
              {step === "email" && "Entrez votre email pour recevoir un code de réinitialisation"}
              {step === "otp" && `Un code a été envoyé à ${email}`}
              {step === "password" && "Créez un nouveau mot de passe sécurisé"}
              </p>
          </div>

          {/* Step indicator horizontal */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[
              { key: "email", icon: Mail },
              { key: "otp", icon: Code },
              { key: "password", icon: Lock }
            ].map((s, index) => {
              const Icon = s.icon
              const isActive = 
                (s.key === "email" && (step === "email" || step === "otp" || step === "password")) ||
                (s.key === "otp" && (step === "otp" || step === "password")) ||
                (s.key === "password" && step === "password")
              const isCompleted = 
                (s.key === "email" && (step === "otp" || step === "password")) ||
                (s.key === "otp" && step === "password")
              
              return (
                <div key={s.key} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-primary text-foreground"
                        : isCompleted
                        ? "bg-primary/50 text-foreground"
                        : "bg-input text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {index < 2 && (
                    <div
                      className={`h-0.5 w-8 mx-1.5 transition-all ${
                        isCompleted ? "bg-primary" : "bg-input"
                      }`}
                    ></div>
                  )}
                </div>
              )
            })}
            </div>

            {/* Email Step */}
            {step === "email" && (
            <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-5">
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    {...emailForm.register("email")}
                    disabled={isLoading}
                    className="h-10 sm:h-11 pl-10 sm:pl-12 text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary focus:bg-input"
                  />
                </div>
                  {emailForm.formState.errors.email && (
                  <p className="mt-2 text-sm text-red-400">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                className="w-full h-10 sm:h-11 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Envoi...
                    </>
                  ) : (
                  "Envoyer le code"
                  )}
                </Button>
              </form>
            )}

            {/* OTP Step */}
            {step === "otp" && (
            <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-5">
              <div className="bg-input border border-[#FF6B35]/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-muted-foreground">
                  Code envoyé à{" "}
                    <span className="font-semibold text-foreground">{email}</span>
                  </p>
                </div>

              <div>
                <div className="relative">
                  <Code className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Code OTP"
                    {...otpForm.register("otp")}
                    disabled={isLoading}
                    maxLength={6}
                    className="h-10 sm:h-11 pl-10 sm:pl-12 text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary focus:bg-input tracking-widest text-center font-semibold"
                  />
                </div>
                  {otpForm.formState.errors.otp && (
                  <p className="mt-2 text-sm text-red-400">{otpForm.formState.errors.otp.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                className="w-full h-10 sm:h-11 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                  "Continuer"
                  )}
                </Button>

                <div className="text-center">
                <p className="text-sm text-muted-foreground">
                    {resendTimer > 0 ? (
                      <>Renvoyer dans {resendTimer}s</>
                    ) : (
                      <>
                        Pas reçu le code?{" "}
                      <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={isLoading}
                        className="text-[#FF6B35] hover:text-[#FF8C42] hover:underline font-semibold"
                        >
                          Renvoyer
                      </button>
                      </>
                    )}
                  </p>
                </div>
              </form>
            )}

            {/* Password Step */}
            {step === "password" && (
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-5">
              <div>
                  <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <Input
                      id="new_password"
                      type={showPassword ? "text" : "password"}
                    placeholder="Nouveau mot de passe"
                      {...passwordForm.register("new_password")}
                      disabled={isLoading}
                    className="h-10 sm:h-11 pl-10 sm:pl-12 pr-10 sm:pr-12 text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary focus:bg-input"
                    />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                  </button>
                  </div>
                  {passwordForm.formState.errors.new_password && (
                  <p className="mt-2 text-sm text-red-400">{passwordForm.formState.errors.new_password.message}</p>
                  )}
                </div>

              <div>
                  <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    <Input
                      id="confirm_new_password"
                      type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirmer le mot de passe"
                      {...passwordForm.register("confirm_new_password")}
                      disabled={isLoading}
                    className="h-10 sm:h-11 pl-10 sm:pl-12 pr-10 sm:pr-12 text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary focus:bg-input"
                    />
                  <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                  </button>
                  </div>
                  {passwordForm.formState.errors.confirm_new_password && (
                  <p className="mt-2 text-sm text-red-400">{passwordForm.formState.errors.confirm_new_password.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                className="w-full h-10 sm:h-11 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    Réinitialisation...
                    </>
                  ) : (
                  "Réinitialiser le mot de passe"
                  )}
                </Button>
              </form>
            )}

          {/* Lien connexion */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Vous avez un compte ?{" "}
            <Link href="/login" className="text-[#FF6B35] hover:text-[#FF8C42] hover:underline font-medium">
                Se connecter
              </Link>
            </div>
          </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between z-20">
        {/* Logo et nom à gauche */}
        <div className="flex items-center gap-2">
          <Image src={icashLogo} alt="iCASH logo" className="w-6 h-6" />
          <span className="text-foreground text-sm font-medium">iCASH</span>
        </div>

        {/* Icônes sociales à droite */}
        <div className="flex items-center gap-4">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <Github className="w-5 h-5" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
          </a>
          <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.175 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}
