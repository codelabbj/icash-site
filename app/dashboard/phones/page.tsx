"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { phoneApi, userAppIdApi, networkApi, platformApi } from "@/lib/api-client"
import type { UserPhone, UserAppId, Network, Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { Loader2, Phone, Plus, Trash2, Edit, Smartphone, ArrowLeft } from "lucide-react"
import { normalizePhoneNumber } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const COUNTRIES = [
    { code: "225", name: "Côte d'Ivoire" },
    { code: "229", name: "Bénin" },
    { code: "221", name: "Sénégal" },
    { code: "226", name: "Burkina Faso" },
]

const phoneSchema = z.object({
    country: z.string().min(1, "Pays requis"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
  network: z.number().min(1, "Réseau requis"),
})

const appIdSchema = z.object({
  user_app_id: z.string().min(1, "ID de pari requis"),
  app: z.string().min(1, "Plateforme requise"),
})

type PhoneFormData = z.infer<typeof phoneSchema>
type AppIdFormData = z.infer<typeof appIdSchema>

export default function PhonesPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userPhones, setUserPhones] = useState<UserPhone[]>([])
  const [userAppIds, setUserAppIds] = useState<UserAppId[]>([])
  const [networks, setNetworks] = useState<Network[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isPhoneDialogOpen, setIsPhoneDialogOpen] = useState(false)
  const [isAppIdDialogOpen, setIsAppIdDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPhone, setEditingPhone] = useState<UserPhone | null>(null)
  const [editingAppId, setEditingAppId] = useState<UserAppId | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: "phone" | "appId"; id: number } | null>(null)

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  })

  const appIdForm = useForm<AppIdFormData>({
    resolver: zodResolver(appIdSchema),
  })

  useEffect(() => {
    loadData()
  }, [])

  // Refetch data when the page gains focus to ensure fresh data
  useEffect(() => {
    const handleFocus = () => {
      loadData()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [phonesData, networksData, platformsData, betIdData] = await Promise.all([
        phoneApi.getAll(),
        networkApi.getAll(),
        platformApi.getAll(),
          userAppIdApi.getAll(),
      ])
      setUserPhones(phonesData)
      setNetworks(networksData)
      setPlatforms(platformsData)
      setUserAppIds(betIdData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneSubmit = async (data: PhoneFormData) => {
      setIsSubmitting(true)
      try {
          // Validate and clean phone number
          const cleanedPhone = data.phone.trim().replace(/\s+/g, "")

          // Check if phone number contains only digits
          if (!/^\d+$/.test(cleanedPhone)) {
              toast.error("Veuillez entrer uniquement des chiffres")
              setIsSubmitting(false)
              return
          }

          // Combine country code with cleaned phone number
          const fullPhone = data.country + cleanedPhone

          if (editingPhone) {
              await phoneApi.update(editingPhone.id, fullPhone, data.network)
              toast.success("Numéro modifié avec succès!")
          } else {
              await phoneApi.create(fullPhone, data.network)
              toast.success("Numéro ajouté avec succès!")
          }
          setIsPhoneDialogOpen(false)
          phoneForm.reset()
          setEditingPhone(null)
          loadData()
      } catch (error) {
          console.error("Phone operation error:", error)
          toast.error("Erreur lors de l'opération téléphone")
      } finally {
          setIsSubmitting(false)
      }
  }

  const handleAppIdSubmit = async (data: AppIdFormData) => {
    setIsSubmitting(true)
    try {
      if (editingAppId) {
        await userAppIdApi.update(editingAppId.id, data.user_app_id, data.app)
        toast.success("ID de pari modifié avec succès!")
      } else {
        await userAppIdApi.create(data.user_app_id, data.app)
        toast.success("ID de pari ajouté avec succès!")
      }
      setIsAppIdDialogOpen(false)
      appIdForm.reset()
      setEditingAppId(null)
      loadData()
    } catch (error) {
      console.error("App ID operation error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === "phone") {
        await phoneApi.delete(deleteTarget.id)
        toast.success("Numéro supprimé avec succès!")
      } else {
        await userAppIdApi.delete(deleteTarget.id)
        toast.success("ID de pari supprimé avec succès!")
      }
      setDeleteTarget(null)
      loadData()
    } catch (error) {
      console.error("Delete error:", error)
    }
  }

  const openEditPhoneDialog = (phone: UserPhone) => {
    setEditingPhone(phone)
    phoneForm.reset({
      phone: phone.phone,
      network: phone.network,
    })
    setIsPhoneDialogOpen(true)
  }

  const openEditAppIdDialog = (appId: UserAppId) => {
    setEditingAppId(appId)
    appIdForm.reset({
      user_app_id: appId.user_app_id,
      app: appId.app.toString(),
    })
    setIsAppIdDialogOpen(true)
  }

  const closePhoneDialog = () => {
    setIsPhoneDialogOpen(false)
    setEditingPhone(null)
    phoneForm.reset()
  }

  const closeAppIdDialog = () => {
    setIsAppIdDialogOpen(false)
    setEditingAppId(null)
    appIdForm.reset()
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-0">
      <div className="flex items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-xl hover:bg-muted shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Phone className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 shrink-0" />
            <span className="truncate">Mes numéros et IDs</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 hidden sm:block">Gérez vos numéros de téléphone et IDs de pari</p>
        </div>
      </div>

      <Tabs defaultValue="phones" className="space-y-4">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="phones" className="text-xs sm:text-sm">Numéros</TabsTrigger>
          <TabsTrigger value="appIds" className="text-xs sm:text-sm">IDs de pari</TabsTrigger>
        </TabsList>

        {/* Phone Numbers Tab */}
        <TabsContent value="phones" className="space-y-4">
          <Card className="border-2 border-transparent bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 space-y-0 pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">Numéros de téléphone</CardTitle>
                  <CardDescription className="text-xs sm:text-sm hidden sm:block">Gérez vos numéros de téléphone mobile</CardDescription>
                </div>
              </div>
              <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingPhone(null)} size="sm" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Ajouter</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">{editingPhone ? "Modifier le numéro" : "Ajouter un numéro"}</DialogTitle>
                    <DialogDescription className="text-sm">
                      {editingPhone
                        ? "Modifiez les informations de votre numéro"
                        : "Ajoutez un nouveau numéro de téléphone"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-4">
                      <div className="flex gap-2 w-full">
                          <div className="space-y-2 w-full">
                              <Label htmlFor="network">Réseau mobile</Label>
                              <Select
                                  onValueChange={(value) => phoneForm.setValue("network", Number.parseInt(value))}
                                  defaultValue={editingPhone?.network.toString()}
                                  disabled={isSubmitting}
                              >
                                  <SelectTrigger id="network" className="w-full">
                                      <SelectValue placeholder="Sélectionnez un réseau" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {networks.map((network) => (
                                          <SelectItem key={network.id} value={network.id.toString()}>
                                              {network.name}
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              {phoneForm.formState.errors.network && (
                                  <p className="text-sm text-destructive">{phoneForm.formState.errors.network.message}</p>
                              )}
                          </div>

                          <div className="space-y-2 w-full">
                              <Label htmlFor="country">Pays</Label>
                              <Select
                                  onValueChange={(value) => phoneForm.setValue("country", value)}
                                  defaultValue={editingPhone ? phoneForm.getValues("country") : "225"}
                                  disabled={isSubmitting}
                              >
                                  <SelectTrigger id="country" className="w-full">
                                      <SelectValue placeholder="Sélectionnez votre pays" />
                                  </SelectTrigger>
                                  <SelectContent>
                                      {COUNTRIES.map((country) => (
                                          <SelectItem key={country.code} value={country.code}>
                                              {country.name}
                                          </SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              {phoneForm.formState.errors.country && (
                                  <p className="text-sm text-destructive">{phoneForm.formState.errors.country.message}</p>
                              )}
                          </div>
                      </div>

                      <div className="space-y-2 w-full">
                          <Label htmlFor="phone">Numéro de téléphone</Label>
                          <Input
                              id="phone"
                              type="tel"
                              placeholder="+225 01 02 03 04 05"
                              {...phoneForm.register("phone")}
                              disabled={isSubmitting}
                          />
                          {phoneForm.formState.errors.phone && (
                              <p className="text-sm text-destructive">{phoneForm.formState.errors.phone.message}</p>
                          )}
                      </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closePhoneDialog}
                        className="flex-1 bg-transparent"
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : editingPhone ? (
                          "Modifier"
                        ) : (
                          "Ajouter"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userPhones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <div className="p-3 sm:p-4 rounded-2xl bg-muted/50 mb-3 sm:mb-4">
                    <Smartphone className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-muted-foreground mb-1">Aucun numéro enregistré</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Ajoutez votre premier numéro pour commencer</p>
                </div>
              ) : (
                  <>
                      <div className="space-y-3 sm:hidden">
                          {userPhones.map((phone) => (
                              <Card key={phone.id} className="border-2">
                                  <CardContent className="p-4">
                                      <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                              <div className="flex-1 min-w-0">
                                                  <p className="text-xs text-muted-foreground mb-1">Numéro</p>
                                                  <p className="font-medium text-sm truncate">{phone.phone}</p>
                                              </div>
                                          </div>
                                          <div className="flex items-center justify-between">
                                              <div className="flex-1 min-w-0">
                                                  <p className="text-xs text-muted-foreground mb-1">Réseau</p>
                                                  <Badge variant="outline" className="text-xs">
                                                      {networks.find((n) => n.id === phone.network)?.public_name || "Inconnu"}
                                                  </Badge>
                                              </div>
                                          </div>
                                          <div className="flex justify-end gap-2 pt-2 border-t">
                                              <Button variant="ghost" size="sm" onClick={() => openEditPhoneDialog(phone)}>
                                                  <Edit className="h-4 w-4 mr-1" />
                                                  <span className="text-xs">Modifier</span>
                                              </Button>
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setDeleteTarget({ type: "phone", id: phone.id })}
                                              >
                                                  <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                                                  <span className="text-xs">Supprimer</span>
                                              </Button>
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>
                          ))}
                      </div>
                      {userPhones.length > 0 && (
                          <div className="hidden sm:block rounded-xl border-2 overflow-hidden">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>Numéro</TableHead>
                                          <TableHead>Réseau</TableHead>
                                          <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {userPhones.map((phone) => (
                                          <TableRow key={phone.id}>
                                              <TableCell className="font-medium">{phone.phone}</TableCell>
                                              <TableCell>
                                                  <Badge variant="outline">
                                                      {networks.find((n) => n.id === phone.network)?.public_name || "Inconnu"}
                                                  </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                  <div className="flex justify-end gap-2">
                                                      <Button variant="ghost" size="icon" onClick={() => openEditPhoneDialog(phone)}>
                                                          <Edit className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          onClick={() => setDeleteTarget({ type: "phone", id: phone.id })}
                                                      >
                                                          <Trash2 className="h-4 w-4 text-destructive" />
                                                      </Button>
                                                  </div>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </div>
                      )}
                  </>
              )}

            </CardContent>
          </Card>
        </TabsContent>

        {/* App IDs Tab */}
        <TabsContent value="appIds" className="space-y-4">
          <Card className="border-2 border-transparent bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 space-y-0 pb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
                  <Smartphone className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base sm:text-lg">IDs de pari</CardTitle>
                  <CardDescription className="text-xs sm:text-sm hidden sm:block">Gérez vos identifiants de plateformes de pari</CardDescription>
                </div>
              </div>
              <Dialog open={isAppIdDialogOpen} onOpenChange={setIsAppIdDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingAppId(null)} size="sm" className="w-full sm:w-auto">
                    <Plus className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Ajouter</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:w-full max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">{editingAppId ? "Modifier l'ID" : "Ajouter un ID"}</DialogTitle>
                    <DialogDescription className="text-sm">
                      {editingAppId ? "Modifiez votre ID de pari" : "Ajoutez un nouvel ID de pari"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={appIdForm.handleSubmit(handleAppIdSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="app">Plateforme de pari</Label>
                      <Select
                        onValueChange={(value) => appIdForm.setValue("app", value)}
                        defaultValue={editingAppId?.app.toString()}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une plateforme" />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id.toString()}>
                              {platform.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {appIdForm.formState.errors.app && (
                        <p className="text-sm text-destructive">{appIdForm.formState.errors.app.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="user_app_id">ID de pari</Label>
                      <Input
                        id="user_app_id"
                        type="text"
                        placeholder="Votre ID sur la plateforme"
                        {...appIdForm.register("user_app_id")}
                        disabled={isSubmitting}
                      />
                      {appIdForm.formState.errors.user_app_id && (
                        <p className="text-sm text-destructive">{appIdForm.formState.errors.user_app_id.message}</p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeAppIdDialog}
                        className="flex-1 bg-transparent"
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="flex-1">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enregistrement...
                          </>
                        ) : editingAppId ? (
                          "Modifier"
                        ) : (
                          "Ajouter"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : userAppIds.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <div className="p-3 sm:p-4 rounded-2xl bg-muted/50 mb-3 sm:mb-4">
                    <Smartphone className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                  </div>
                  <p className="text-base sm:text-lg font-semibold text-muted-foreground mb-1">Aucun ID enregistré</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Ajoutez votre premier ID pour commencer</p>
                </div>
              ) : (
                  <>
                      <div className="space-y-3 sm:hidden">
                          {userAppIds.map((appId, index) => (
                              <Card key={`appId-mobile-${appId.id}-${appId.app || 'unknown'}-${index}`} className="border-2">
                                  <CardContent className="p-4">
                                      <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                              <div className="flex-1 min-w-0">
                                                  <p className="text-xs text-muted-foreground mb-1">ID de pari</p>
                                                  <p className="font-medium text-sm truncate">{appId.user_app_id}</p>
                                              </div>
                                          </div>
                                          <div className="flex items-center justify-between">
                                              <div className="flex-1 min-w-0">
                                                  <p className="text-xs text-muted-foreground mb-1">Plateforme</p>
                                                  <Badge variant="outline" className="text-xs">
                                                      {platforms.find((p) => p.id === appId.app)?.name || "Inconnu"}
                                                  </Badge>
                                              </div>
                                          </div>
                                          <div className="flex justify-end gap-2 pt-2 border-t">
                                              <Button variant="ghost" size="sm" onClick={() => openEditAppIdDialog(appId)}>
                                                  <Edit className="h-4 w-4 mr-1" />
                                                  <span className="text-xs">Modifier</span>
                                              </Button>
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => setDeleteTarget({ type: "appId", id: appId.id })}
                                              >
                                                  <Trash2 className="h-4 w-4 mr-1 text-destructive" />
                                                  <span className="text-xs">Supprimer</span>
                                              </Button>
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>
                          ))}
                      </div>
                      {userAppIds.length > 0 && (
                          <div className="hidden sm:block rounded-xl border-2 overflow-hidden">
                              <Table>
                                  <TableHeader>
                                      <TableRow>
                                          <TableHead>ID de pari</TableHead>
                                          <TableHead>Plateforme</TableHead>
                                          <TableHead className="text-right">Actions</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {userAppIds.map((appId, index) => (
                                          <TableRow key={`appId-table-${appId.id}-${appId.app || 'unknown'}-${index}`}>
                                              <TableCell className="font-medium">{appId.user_app_id}</TableCell>
                                              <TableCell>
                                                  <Badge variant="outline">
                                                      {platforms.find((p) => p.id === appId.app)?.name || "Inconnu"}
                                                  </Badge>
                                              </TableCell>
                                              <TableCell className="text-right">
                                                  <div className="flex justify-end gap-2">
                                                      <Button variant="ghost" size="icon" onClick={() => openEditAppIdDialog(appId)}>
                                                          <Edit className="h-4 w-4" />
                                                      </Button>
                                                      <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          onClick={() => setDeleteTarget({ type: "appId", id: appId.id })}
                                                      >
                                                          <Trash2 className="h-4 w-4 text-destructive" />
                                                      </Button>
                                                  </div>
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </div>
                      )}
                  </>
              )}

            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement{" "}
              {deleteTarget?.type === "phone" ? "ce numéro" : "cet ID"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
