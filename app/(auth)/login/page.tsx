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
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { setupNotifications } from "@/lib/fcm-helper"
import Image from "next/image";
import logo from "@/public/logo.png"
import { normalizePhoneNumber } from "@/lib/utils"
import { MobileAppDownload } from "@/components/mobile-app-download"

const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Email ou téléphone requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Step 1: Authenticate user
      // Normalize phone number if it looks like a phone (contains + or starts with digits)
      const emailOrPhone = data.email_or_phone.includes('@') 
        ? data.email_or_phone 
        : normalizePhoneNumber(data.email_or_phone)
      const response = await authApi.login(emailOrPhone, data.password)
      login(response.access, response.refresh, response.data)
      
      // Step 2: Show success toast first
      toast.success("Connexion réussie!")
      
      // Step 3: Request notification permission (shows native browser prompt)
      try {
        const userId = response.data?.id
        
        // Add small delay to ensure page is ready
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('[Login] Setting up notifications for user:', userId)
        const fcmToken = await setupNotifications(userId)
        
        if (fcmToken) {
          toast.success("Notifications activées!")
          console.log('[Login] FCM Token registered:', fcmToken.substring(0, 20) + '...')
        } else {
          console.log('[Login] No FCM token - permission might be denied or not granted')
        }
      } catch (fcmError) {
        // Non-critical error - don't block login
        console.error('[Login] Error setting up notifications:', fcmError)
      }
      
      // Step 4: Redirect to dashboard
      // Wait a bit more to ensure notification prompt completes if shown
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push("/dashboard")
    } catch (error) {
      // Error is handled by api interceptor
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-x-hidden">
      {/* Left Side - Visual Design */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#4f270f] via-[#28150c] to-[#5f402f]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#4f270f]/30 via-transparent to-[#28150c]/30"></div>

            {/* Animated background elements */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-[#41281a]/25 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#5c341d]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

            <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <div className="mb-6 xl:mb-8">
              <Image src={logo} alt="logo" className="w-20 h-20 rounded-lg border-white/20 mb-6" />
            <h1 className="text-4xl xl:text-5xl font-bold mb-3 xl:mb-4 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              ZEFAST
            </h1>
            <p className="text-lg xl:text-xl text-white/90 max-w-md">
              Gérez vos dépôts et retraits en toute simplicité
            </p>
          </div>

          <div className="mt-8 xl:mt-12 space-y-3 xl:space-y-4 w-full max-w-md">
            <div className="flex items-center gap-3 text-white/80 text-sm xl:text-base">
              <div className="w-2 h-2 rounded-full bg-white/60 flex-shrink-0"></div>
              <span>Transactions sécurisées</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm xl:text-base">
              <div className="w-2 h-2 rounded-full bg-white/60 flex-shrink-0"></div>
              <span>Gestion rapide et intuitive</span>
            </div>
            <div className="flex items-center gap-3 text-white/80 text-sm xl:text-base">
              <div className="w-2 h-2 rounded-full bg-white/60 flex-shrink-0"></div>
              <span>Support 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-6 xl:p-8 bg-gradient-to-br from-background via-background to-[#4f270f]/5 min-h-screen lg:min-h-0 w-full">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl">
          <div className="mb-6 sm:mb-8 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-primary to-accent mb-3 sm:mb-4 lg:hidden">
              {/* <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> */}
              <Image src={logo} alt="logo" className="w-20 h-20 rounded-lg border-white/20 mb-6" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Connexion
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">Entrez vos identifiants pour accéder à votre compte</p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5 md:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email_or_phone" className="text-xs sm:text-sm font-semibold">
                  Email ou Téléphone
                </Label>
                <Input
                  id="email_or_phone"
                  type="text"
                  placeholder="exemple@email.com ou +225..."
                  {...register("email_or_phone")}
                  disabled={isLoading}
                  className="h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-primary/20 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                {errors.email_or_phone && <p className="text-xs sm:text-sm text-destructive">{errors.email_or_phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">
                  Mot de passe
                </Label>
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
                  <Link href="/forgot-password" className="text-primary hover:underline font-semibold">
                      Mot de passe oublié ?
                  </Link>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                    <span className="hidden sm:inline">Connexion en cours...</span>
                    <span className="sm:hidden">Connexion...</span>
                  </>
                ) : (
                  <>
                    {/* <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> */}
                    Se connecter
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground text-center">
              Pas encore de compte?{" "}
              <Link href="/signup" className="text-primary hover:underline font-semibold">
                Créer un compte
              </Link>
            </div>

            <div className="mt-4 sm:mt-6 flex justify-center">
              <MobileAppDownload
                variant="outline"
                className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
