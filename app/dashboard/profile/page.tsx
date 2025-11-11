"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit, Save, X, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "react-hot-toast"
import { normalizePhoneNumber } from "@/lib/utils"
import { authApi } from "@/lib/api-client"
import type { User } from "@/lib/types"

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser } = useAuth()
  const [user, setUser] = useState<User | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoadingPassword, setIsLoadingPassword] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  })

  // Password change form state
  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_new_password: "",
  })

  // Redirect if not authenticated
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
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
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
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
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_new_password: "",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Erreur lors de la modification du mot de passe")
    } finally {
      setIsLoadingPassword(false)
    }
  }

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false)
    setPasswordData({
      old_password: "",
      new_password: "",
      confirm_new_password: "",
    })
  }

  if (isLoadingProfile || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
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
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Mon Profil</h1>
              <p className="text-sm text-muted-foreground mt-1">Gérez vos informations personnelles</p>
            </div>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit} className="rounded-xl">
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </Button>
          )}
        </div>

        {/* Profile Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Informations personnelles</CardTitle>
            <CardDescription>
              {isEditing
                ? "Modifiez vos informations et cliquez sur enregistrer"
                : "Vos informations de compte"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* First Name */}
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                {isEditing ? (
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Votre prénom"
                    className="rounded-xl"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-muted/50 text-sm font-medium">
                    {user.first_name || "Non renseigné"}
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                {isEditing ? (
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Votre nom"
                    className="rounded-xl"
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-muted/50 text-sm font-medium">
                    {user.last_name || "Non renseigné"}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="votre@email.com"
                  className="rounded-xl"
                />
              ) : (
                <div className="p-3 rounded-xl bg-muted/50 text-sm font-medium">
                  {user.email || "Non renseigné"}
                </div>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Votre numéro de téléphone"
                  className="rounded-xl"
                />
              ) : (
                <div className="p-3 rounded-xl bg-muted/50 text-sm font-medium">
                  {user.phone || "Non renseigné"}
                </div>
              )}
            </div>

            {/* Action buttons when editing */}
            {isEditing && (
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Enregistrer
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  disabled={isLoading}
                  className="flex-1 rounded-xl"
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Changer le mot de passe</CardTitle>
            <CardDescription>
              {isChangingPassword
                ? "Modifiez votre mot de passe et cliquez sur enregistrer"
                : "Sécurisez votre compte en changeant régulièrement votre mot de passe"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!isChangingPassword ? (
              <Button
                onClick={() => setIsChangingPassword(true)}
                variant="outline"
                className="w-full rounded-xl"
              >
                Changer le mot de passe
              </Button>
            ) : (
              <div className="space-y-4">
                {/* Old Password */}
                <div className="space-y-2">
                  <Label htmlFor="old_password">Mot de passe actuel</Label>
                  <div className="relative">
                    <Input
                      id="old_password"
                      name="old_password"
                      type={showOldPassword ? "text" : "password"}
                      value={passwordData.old_password}
                      onChange={handlePasswordInputChange}
                      placeholder="Entrez votre mot de passe actuel"
                      className="rounded-xl pr-10"
                      disabled={isLoadingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="new_password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      name="new_password"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.new_password}
                      onChange={handlePasswordInputChange}
                      placeholder="Minimum 6 caractères"
                      className="rounded-xl pr-10"
                      disabled={isLoadingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm_new_password">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Input
                      id="confirm_new_password"
                      name="confirm_new_password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirm_new_password}
                      onChange={handlePasswordInputChange}
                      placeholder="Confirmez votre nouveau mot de passe"
                      className="rounded-xl pr-10"
                      disabled={isLoadingPassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isLoadingPassword}
                    className="flex-1 rounded-xl"
                  >
                    {isLoadingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Modification...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Enregistrer
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleCancelPasswordChange}
                    variant="outline"
                    disabled={isLoadingPassword}
                    className="flex-1 rounded-xl"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}