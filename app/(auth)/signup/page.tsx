"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, UserPlus, CheckCircle, Eye, EyeOff } from "lucide-react"
import { normalizePhoneNumber } from "@/lib/utils"
import { useSettings } from "@/lib/hooks/use-settings"

const createSignupSchema = (includeReferralCode: boolean) => {
  const baseSchema = z.object({
    first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    email: z.string().email("Email invalide"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    re_password: z.string().min(6, "Confirmation requise"),
  })

  if (includeReferralCode) {
    return baseSchema.extend({
      referral_code: z.string().optional(),
    }).refine((data) => data.password === data.re_password, {
      message: "Les mots de passe ne correspondent pas",
      path: ["re_password"],
    })
  }

  return baseSchema.refine((data) => data.password === data.re_password, {
    message: "Les mots de passe ne correspondent pas",
    path: ["re_password"],
  })
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showRePassword, setShowRePassword] = useState(false)
  const { referralBonus, isLoading: isLoadingSettings } = useSettings()

  // Use referralBonus only if settings loaded successfully, otherwise default to false
  const shouldShowReferralCode = !isLoadingSettings && referralBonus

  const signupSchema = createSignupSchema(shouldShowReferralCode)
  type SignupFormData = z.infer<typeof signupSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      const registerData: {
        first_name: string
        last_name: string
        email: string
        phone: string
        password: string
        re_password: string
        referral_code?: string
      } = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: normalizePhoneNumber(data.phone),
        password: data.password,
        re_password: data.re_password,
      }

      // Only include referral_code if referral_bonus is enabled and code is provided
      // Proceed without referral_code if settings API failed
      if (shouldShowReferralCode && 'referral_code' in data) {
        const referralCode = data.referral_code as string | undefined
        if (referralCode && referralCode.trim() !== "") {
          registerData.referral_code = referralCode.trim()
        }
      }

      await authApi.register(registerData)
      toast.success("Compte créé avec succès! Veuillez vous connecter.")
      router.push("/login")
    } catch (error) {
      // Error is handled by api interceptor
      console.error("Signup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Don't block the form if settings are loading - proceed without referral field
  // If settings API fails, referralBonus will be false and form works normally

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-x-hidden">
      {/* Left Side - Visual Design */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-accent to-primary/50">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"></div>

            {/* Animated background elements */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-8 xl:p-12 w-full">
          <div className="mb-6 xl:mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 xl:w-20 xl:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4 xl:mb-6">
              <UserPlus className="w-8 h-8 xl:w-10 xl:h-10 text-white" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold mb-3 xl:mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Rejoignez-nous
            </h1>
            <p className="text-lg xl:text-xl text-white/90 max-w-md">
              Créez votre compte et commencez à gérer vos transactions en toute simplicité
            </p>
          </div>

          <div className="mt-8 xl:mt-12 space-y-3 xl:space-y-4 w-full max-w-md">
            <div className="flex items-center gap-3 text-white/80 text-sm xl:text-base">
              <CheckCircle className="w-5 h-5 text-white/60 flex-shrink-0" />
              <span>Inscription rapide et simple</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm xl:text-base">
              <CheckCircle className="w-5 h-5 text-white/60 flex-shrink-0" />
              <span>Accès immédiat à toutes les fonctionnalités</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm xl:text-base">
              <CheckCircle className="w-5 h-5 text-white/60 flex-shrink-0" />
              <span>Gestion complète de vos transactions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-6 xl:p-8 bg-gradient-to-br from-background via-background to-primary/5 min-h-screen lg:min-h-0 w-full">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
          <div className="mb-6 sm:mb-8 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary to-accent mb-3 sm:mb-4 lg:hidden">
              <UserPlus className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Créer un compte
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">Remplissez le formulaire pour créer votre compte</p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-xs sm:text-sm font-semibold">Prénom</Label>
                  <Input 
                    id="first_name" 
                    type="text" 
                    placeholder="Jean" 
                    {...register("first_name")} 
                    disabled={isLoading} 
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {errors.first_name && <p className="text-xs sm:text-sm text-destructive">{errors.first_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-xs sm:text-sm font-semibold">Nom</Label>
                  <Input 
                    id="last_name" 
                    type="text" 
                    placeholder="Dupont" 
                    {...register("last_name")} 
                    disabled={isLoading} 
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {errors.last_name && <p className="text-xs sm:text-sm text-destructive">{errors.last_name.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  {...register("email")}
                  disabled={isLoading}
                  className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {errors.email && <p className="text-xs sm:text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold">Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+225 01 02 03 04 05"
                  {...register("phone")}
                  disabled={isLoading}
                  className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {errors.phone && <p className="text-xs sm:text-sm text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("password")}
                    disabled={isLoading}
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && <p className="text-xs sm:text-sm text-destructive">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="re_password" className="text-xs sm:text-sm font-semibold">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Input
                    id="re_password"
                    type={showRePassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register("re_password")}
                    disabled={isLoading}
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowRePassword(!showRePassword)}
                    tabIndex={-1}
                  >
                    {showRePassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.re_password && <p className="text-xs sm:text-sm text-destructive">{errors.re_password.message}</p>}
              </div>

              {shouldShowReferralCode && (
                <div className="space-y-2">
                  <Label htmlFor="referral_code" className="text-xs sm:text-sm font-semibold">Code de parrainage (optionnel)</Label>
                  <Input
                    id="referral_code"
                    type="text"
                    placeholder="Entrez votre code de parrainage"
                    {...(register("referral_code" as any))}
                    disabled={isLoading}
                    className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {(errors as any).referral_code ? (
                    <p className="text-xs sm:text-sm text-destructive">
                      {(errors as any).referral_code?.message || "Erreur"}
                    </p>
                  ) : null}
                </div>
              )}

              <Button 
                type="submit"
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">Création en cours...</span>
                    <span className="sm:hidden">Création...</span>
                  </>
                ) : (
                  <>
                    {/* <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> */}
                    Créer mon compte
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground text-center">
              Vous avez déjà un compte?{" "}
              <Link href="/login" className="text-primary hover:underline font-semibold">
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
