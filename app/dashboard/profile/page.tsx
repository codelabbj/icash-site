"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Edit, Save, X, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "react-hot-toast"

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    password: "",
    confirm_password: "",
  })

  // Redirect if not authenticated
  if (!user) {
    router.push("/login")
    return null
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleEdit = () => {
    setIsEditing(true)
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      password: "",
      confirm_password: "",
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      password: "",
      confirm_password: "",
    })
  }

  const handleSave = async () => {
    // Validate passwords match if password is being changed
    if (formData.password && formData.password !== formData.confirm_password) {
      toast.error("Les mots de passe ne correspondent pas")
      return
    }

    // Validate password length if provided
    if (formData.password && formData.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères")
      return
    }

    setIsLoading(true)
    try {
      // Prepare update data
      const updateData: any = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
      }

      // Only include password if it's being changed
      if (formData.password) {
        updateData.password = formData.password
      }

      // TODO : Api call to update the user datas

      toast.success("Profil mis à jour avec succès!")
      setIsEditing(false)

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirm_password: "",
      }))
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Erreur lors de la mise à jour du profil")
    } finally {
      setIsLoading(false)
    }
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

            {/* Password fields - only show when editing */}
            {isEditing && (
              <>
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold mb-4">Changer le mot de passe (optionnel)</h3>
                  <div className="space-y-4">
                    {/* New Password */}
                    <div className="space-y-2">
                      <Label htmlFor="password">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={handleInputChange}
                          placeholder="Minimum 8 caractères"
                          className="rounded-xl pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          name="confirm_password"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirm_password}
                          onChange={handleInputChange}
                          placeholder="Confirmez votre mot de passe"
                          className="rounded-xl pr-10"
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
                  </div>
                </div>
              </>
            )}

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
      </div>
    </div>
  )
}