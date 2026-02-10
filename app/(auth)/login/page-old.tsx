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
      
      // Step 4: Redirect to dashboard v3
      // Wait a bit more to ensure notification prompt completes if shown
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push("/dashboardv3")
    } catch (error) {
      // Error is handled by api interceptor
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url('/placeholder.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/90 via-[#FF8C42]/85 to-[#2563EB]/90"></div>
        
        {/* Animated background elements */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Centered Form */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 shadow-2xl flex items-center justify-center">
              <Image src={logo} alt="logo" className="w-20 h-20 rounded-xl" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2 bg-gradient-to-r from-white via-white/95 to-white/80 bg-clip-text text-transparent">
            iCASH
          </h1>
          <p className="text-base sm:text-lg text-white/90 font-medium">
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Form without border container */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Input
              id="email_or_phone"
              type="text"
              placeholder="Email ou Téléphone"
              {...register("email_or_phone")}
              disabled={isLoading}
              className="h-12 text-sm bg-white/90 backdrop-blur-sm border-0 focus:ring-4 focus:ring-white/50 transition-all duration-300 rounded-2xl shadow-lg placeholder:text-muted-foreground/60"
            />
            {errors.email_or_phone && (
              <p className="mt-2 text-sm text-white font-medium bg-red-500/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                {errors.email_or_phone.message}
              </p>
            )}
          </div>

          <div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mot de passe"
                {...register("password")}
                disabled={isLoading}
                className="h-14 text-base bg-white/90 backdrop-blur-sm border-0 focus:ring-4 focus:ring-white/50 transition-all duration-300 pr-14 rounded-2xl shadow-lg placeholder:text-muted-foreground/60"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-[#FF6B35]/20 rounded-lg"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-[#FF6B35]" />
                ) : (
                  <Eye className="h-5 w-5 text-[#FF6B35]" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-white font-medium bg-red-500/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                {errors.password.message}
              </p>
            )}
            <div className="flex justify-end mt-3">
              <Link 
                href="/forgot-password" 
                className="text-white/90 hover:text-white hover:underline font-semibold text-sm transition-colors"
              >
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-[#FF6B35] via-[#FF8C42] to-[#FF6B35] hover:from-[#FF8C42] hover:via-[#FF6B35] hover:to-[#FF8C42] text-white shadow-2xl shadow-[#FF6B35]/40 hover:shadow-[#FF6B35]/50 transition-all duration-300 rounded-2xl transform hover:scale-[1.02]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>

        <div className="mt-8 text-center space-y-6">
          <div className="text-white/90 text-xs sm:text-sm">
            Pas encore de compte?{" "}
            <Link 
              href="/signup" 
              className="text-white font-bold hover:underline transition-colors"
            >
              Créer un compte
            </Link>
          </div>

          <div className="flex justify-center">
            <MobileAppDownload
              variant="outline"
              className="border-2 border-white/40 hover:border-white/60 hover:bg-white/20 backdrop-blur-sm bg-white/10 text-white [&_*]:text-white [&_span]:text-white [&_svg]:text-white transition-all duration-300 rounded-2xl"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
