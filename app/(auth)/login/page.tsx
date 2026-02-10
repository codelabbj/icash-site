"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff, Mail, Lock, Github, Moon, Sun } from "lucide-react"
import { setupNotifications } from "@/lib/fcm-helper"
import Image from "next/image"
import icashLogo from "@/public/icash-logo.png"
import { normalizePhoneNumber } from "@/lib/utils"
import { MobileAppDownload } from "@/components/mobile-app-download"
import { useTheme } from "next-themes"

const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Email ou téléphone requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [particles, setParticles] = useState<Array<{
    id: number
    left: number
    top: number
    delay: number
    duration: number
    x: number
  }>>([])

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
    <div className="min-h-screen w-full bg-background flex flex-col relative overflow-hidden">
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
          title={mounted ? `Passer en mode ${resolvedTheme === "dark" ? "clair" : "sombre"}` : "Changer le thème"}
        >
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>
          </div>

      {/* Contenu centré */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 overflow-y-auto pt-12 sm:pt-24 pb-20 sm:pb-24 relative z-10">
        {/* Carte centrale */}
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 sm:p-8 md:p-10 shadow-2xl my-8">
          {/* Titre */}
          <h1 className="text-2xl sm:text-3xl font-semibold text-card-foreground mb-6 sm:mb-8 text-center">
            Connexion
          </h1>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
            {/* Email Input */}
            <div>
              <div className="relative">
                <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  id="email_or_phone"
                  type="text"
                  placeholder="Email ou Téléphone"
                  {...register("email_or_phone")}
                  disabled={isLoading}
                  className="h-10 sm:h-11 pl-10 sm:pl-12 text-sm bg-input border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:ring-2 focus:ring-primary focus:bg-input"
                />
              </div>
              {errors.email_or_phone && (
                <p className="mt-2 text-sm text-red-400">{errors.email_or_phone.message}</p>
              )}
              </div>

            {/* Password Input */}
            <div>
                <div className="relative">
                <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre mot de passe"
                    {...register("password")}
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
              {errors.password && (
                <p className="mt-2 text-sm text-red-400">{errors.password.message}</p>
              )}
              <div className="mt-2 flex justify-end">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-[#FF6B35] hover:text-[#FF8C42] hover:underline"
                >
                      Mot de passe oublié ?
                  </Link>
              </div>
              </div>

            {/* Bouton Sign in */}
              <Button 
                type="submit" 
              className="w-full h-10 sm:h-11 text-sm sm:text-base bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  Connexion...
                  </>
                ) : (
                "Se connecter"
                )}
              </Button>
            </form>

          {/* Séparateur */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-4 text-sm text-muted-foreground">ou</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Lien inscription */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-[#FF6B35] hover:text-[#FF8C42] hover:underline font-medium">
              S'inscrire
              </Link>
            </div>

          {/* Bouton télécharger l'app */}
          <div className="mt-6 flex justify-center">
              <MobileAppDownload
                variant="outline"
              className="border-2 border-border hover:border-primary hover:bg-primary/10 text-foreground [&_*]:text-foreground [&_span]:text-foreground [&_svg]:text-foreground transition-all duration-300 rounded-xl bg-card"
              />
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

