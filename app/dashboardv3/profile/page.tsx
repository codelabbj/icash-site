"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit, Save, X, Loader2, Eye, EyeOff, Bell, Moon, Sun, LogOut } from "lucide-react"
import { toast } from "react-hot-toast"
import { normalizePhoneNumber } from "@/lib/utils"
import { authApi } from "@/lib/api-client"
import type { User } from "@/lib/types"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import icashLogo from "@/public/icash-logo.png"

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, logout } = useAuth()
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [particles, setParticles] = useState<Array<{
    id: number
    left: number
    top: number
    delay: number
    duration: number
    x: number
  }>>([])
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  })

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_new_password: "",
  })

  useEffect(() => {
    setMounted(true)
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

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }
    fetchProfile()
  }, [authUser, router])

  const fetchProfile = async () => {
    try {
      setIsLoadingProfile(true)
      const profileData = await authApi.getProfile()
      setUser(profileData)
      setFormData({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        email: profileData.email || "",
        phone: profileData.phone || "",
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Erreur lors du chargement du profil")
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleEdit = () => {
    if (!user) return
    setIsEditing(true)
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
    })
  }

  const handleCancel = () => {
    if (!user) return
    setIsEditing(false)
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      phone: user.phone || "",
    })
  }

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error("Le prénom et le nom sont requis")
      return
    }
    if (!formData.email.trim()) {
      toast.error("L'email est requis")
      return
    }
    setIsLoading(true)
    try {
      const updatedUser = await authApi.updateProfile({
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim(),
        phone: normalizePhoneNumber(formData.phone),
      })
      setUser(updatedUser)
      toast.success("Profil mis à jour avec succès!")
      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Erreur lors de la mise à jour du profil")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))
  }

  const handleChangePassword = async () => {
    if (!passwordData.old_password.trim()) {
      toast.error("Veuillez entrer votre mot de passe actuel")
      return
    }
    if (!passwordData.new_password.trim()) {
      toast.error("Veuillez entrer un nouveau mot de passe")
      return
    }
    if (passwordData.new_password.length < 6) {
      toast.error("Le nouveau mot de passe doit contenir au moins 6 caractères")
      return
    }
    if (passwordData.new_password !== passwordData.confirm_new_password) {
      toast.error("Les nouveaux mots de passe ne correspondent pas")
      return
    }
    setIsLoadingPassword(true)
    try {
      await authApi.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
        confirm_new_password: passwordData.confirm_new_password,
      })
      toast.success("Mot de passe modifié avec succès!")
      setIsChangingPassword(false)
      setPasswordData({ old_password: "", new_password: "", confirm_new_password: "" })
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Erreur lors de la modification du mot de passe")
    } finally {
      setIsLoadingPassword(false)
    }
  }

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false)
    setPasswordData({ old_password: "", new_password: "", confirm_new_password: "" })
  }

  if (!authUser) {
    return null
  }

  if (isLoadingProfile || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative">
      {/* Animated Background - same as dashboardv3 */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-[#FF6B35] rounded-full blur-3xl opacity-50 animate-pulse"></div>
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-[#2563EB] rounded-full blur-3xl opacity-50 animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#FF8C42] rounded-full blur-3xl opacity-40 animate-pulse" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-20 left-10 w-40 h-40 bg-[#FF6B35] rounded-full blur-2xl opacity-40" style={{ animation: "float 6s ease-in-out infinite" }}></div>
        <div className="absolute top-40 right-20 w-32 h-32 bg-[#2563EB] rounded-full blur-2xl opacity-40" style={{ animation: "float-delayed 8s ease-in-out infinite 1s" }}></div>
        <div className="absolute bottom-32 left-1/4 w-48 h-48 bg-[#FF8C42] rounded-full blur-2xl opacity-40" style={{ animation: "float-slow 10s ease-in-out infinite 2s" }}></div>
        <div className="absolute bottom-20 right-1/3 w-36 h-36 bg-[#FF6B35] rounded-full blur-2xl opacity-40" style={{ animation: "float 7s ease-in-out infinite 0.5s" }}></div>
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(255, 107, 53, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 53, 0.5) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
            animation: "gridMove 20s linear infinite"
          }}></div>
        </div>
        {particles.length > 0 && (
          <div className="absolute inset-0">
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute w-4 h-4 bg-[#FF6B35] rounded-full opacity-70"
                style={{
                  left: `${p.left}%`,
                  top: `${p.top}%`,
                  animation: `particle ${p.duration}s linear infinite`,
                  animationDelay: `${p.delay}s`,
                  ["--random-x" as string]: `${p.x}px`
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex items-start justify-center p-3 sm:p-4 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[420px] flex flex-col pt-2 sm:pt-3 pb-8">
          {/* Header - style dashboardv3 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboardv3")}
                className="h-9 w-9 rounded-xl bg-card/60 backdrop-blur-md hover:bg-card/80 text-foreground border border-border/40 shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1.5">
                <Image src={icashLogo} alt="iCASH" className="w-7 h-7" />
                <span className="text-foreground font-bold text-base">Mon Profil</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-9 rounded-xl bg-card/60 backdrop-blur-md hover:bg-card/80 text-foreground border border-border/40"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
              ) : null}
              <Button variant="ghost" className="h-9 w-9 rounded-xl bg-card/60 backdrop-blur-md hover:bg-card/80 text-foreground border border-border/40" asChild>
                <Link href="/dashboardv3/notifications" title="Notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-xl bg-card/60 backdrop-blur-md hover:bg-card/80 text-foreground border border-border/40"
                onClick={() => mounted && setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                title={mounted ? (resolvedTheme === "dark" ? "Mode clair" : "Mode sombre") : "Thème"}
              >
                {mounted ? (resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Card Infos personnelles */}
          <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/40 p-4 sm:p-5 mb-4">
            <h2 className="text-sm font-semibold text-foreground mb-1">Informations personnelles</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {isEditing ? "Modifiez puis enregistrez" : "Vos informations de compte"}
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="first_name" className="text-xs">Prénom</Label>
                  {isEditing ? (
                    <Input id="first_name" name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="Prénom" className="rounded-xl h-9 text-sm" />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-muted/50 text-sm font-medium">{user.first_name || "—"}</div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="last_name" className="text-xs">Nom</Label>
                  {isEditing ? (
                    <Input id="last_name" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Nom" className="rounded-xl h-9 text-sm" />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-muted/50 text-sm font-medium">{user.last_name || "—"}</div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                {isEditing ? (
                  <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="email@exemple.com" className="rounded-xl h-9 text-sm" />
                ) : (
                  <div className="p-2.5 rounded-xl bg-muted/50 text-sm font-medium">{user.email || "—"}</div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs">Téléphone</Label>
                {isEditing ? (
                  <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleInputChange} placeholder="Numéro" className="rounded-xl h-9 text-sm" />
                ) : (
                  <div className="p-2.5 rounded-xl bg-muted/50 text-sm font-medium">{user.phone || "—"}</div>
                )}
              </div>
              {isEditing && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={isLoading} className="flex-1 rounded-xl h-9 text-sm">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Enregistrer
                  </Button>
                  <Button onClick={handleCancel} variant="outline" disabled={isLoading} className="flex-1 rounded-xl h-9 text-sm">
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Card Mot de passe */}
          <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/40 p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-foreground mb-1">Changer le mot de passe</h2>
            <p className="text-xs text-muted-foreground mb-4">
              {isChangingPassword ? "Saisissez et enregistrez" : "Sécurisez votre compte"}
            </p>
            {!isChangingPassword ? (
              <Button onClick={() => setIsChangingPassword(true)} variant="outline" className="w-full rounded-xl h-9 text-sm">
                Changer le mot de passe
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="old_password" className="text-xs">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="old_password"
                      name="old_password"
                      type={showOldPassword ? "text" : "password"}
                      value={passwordData.old_password}
                      onChange={handlePasswordInputChange}
                      placeholder="Mot de passe actuel"
                      className="rounded-xl h-9 text-sm pr-9"
                      disabled={isLoadingPassword}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowOldPassword(!showOldPassword)}>
                      {showOldPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new_password" className="text-xs">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      name="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={handlePasswordInputChange}
                      placeholder="Min. 6 caractères"
                      className="rounded-xl h-9 text-sm pr-9"
                      disabled={isLoadingPassword}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowNewPassword(!showNewPassword)}>
                      {showNewPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm_new_password" className="text-xs">Confirmer</Label>
                  <div className="relative">
                    <Input
                      id="confirm_new_password"
                      name="confirm_new_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirm_new_password}
                      onChange={handlePasswordInputChange}
                      placeholder="Confirmer le mot de passe"
                      className="rounded-xl h-9 text-sm pr-9"
                      disabled={isLoadingPassword}
                    />
                    <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleChangePassword} disabled={isLoadingPassword} className="flex-1 rounded-xl h-9 text-sm">
                    {isLoadingPassword ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                    Enregistrer
                  </Button>
                  <Button onClick={handleCancelPasswordChange} variant="outline" disabled={isLoadingPassword} className="flex-1 rounded-xl h-9 text-sm">
                    <X className="h-4 w-4 mr-1" />
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Bouton Déconnexion */}
          <Button
            variant="destructive"
            className="w-full mt-6 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-medium shadow-md"
            onClick={() => {
              logout()
              router.push("/login")
            }}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  )
}
