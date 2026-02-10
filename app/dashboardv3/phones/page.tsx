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
  DialogFooter,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { phoneApi, userAppIdApi, networkApi, platformApi } from "@/lib/api-client"
import type { UserPhone, UserAppId, Network, Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { Loader2, Phone, Plus, Trash2, Edit, Smartphone, ArrowLeft, CheckCircle, XCircle, Bell, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import icashLogo from "@/public/icash-logo.png"
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

  // Search functionality states for add
  const [isSearching, setIsSearching] = useState(false)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [pendingBetId, setPendingBetId] = useState<{ appId: string; betId: string; userName: string } | null>(null)

  // Search functionality states for edit
  const [isEditSearching, setIsEditSearching] = useState(false)
  const [isEditConfirmationModalOpen, setIsEditConfirmationModalOpen] = useState(false)
  const [isEditErrorModalOpen, setIsEditErrorModalOpen] = useState(false)
  const [editErrorMessage, setEditErrorMessage] = useState("")
  const [pendingEditBetId, setPendingEditBetId] = useState<{ id: number; appId: string; betId: string; userName: string } | null>(null)

  const phoneForm = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  })

  const appIdForm = useForm<AppIdFormData>({
    resolver: zodResolver(appIdSchema),
  })

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
      app: appId.app_details.id,
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
    setErrorMessage("")
    setEditErrorMessage("")
  }

  const handleAddBetId = async () => {
    const newBetId = appIdForm.getValues("user_app_id")
    const appId = appIdForm.getValues("app")

    if (!newBetId.trim() || !appId) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    const selectedPlatform = platforms.find(p => p.id === appId)
    if (!selectedPlatform) {
      toast.error("Plateforme non trouvée")
      return
    }

    setIsSearching(true)
    try {
      const searchResult = await userAppIdApi.searchUser(selectedPlatform.id, newBetId.trim())

      // Validate user exists
      if (searchResult.UserId === 0) {
        setErrorMessage("Utilisateur non trouvé. Veuillez vérifier l'ID de pari.")
        setIsErrorModalOpen(true)
        setIsSearching(false)
        return
      }

      // Validate currency (CurrencyId === 27 for XOF)
      if (searchResult.CurrencyId !== 27) {
        setErrorMessage("Cet utilisateur n'utilise pas la devise XOF. Veuillez vérifier votre compte.")
        setIsErrorModalOpen(true)
        setIsSearching(false)
        return
      }

      // Valid user - show confirmation modal with search result
      setPendingBetId({
        appId: appId,
        betId: newBetId.trim(),
        userName: searchResult.Name
      })
      setIsConfirmationModalOpen(true)
      setIsAppIdDialogOpen(false) // Close the add dialog
    } catch (error: any) {
      // Handle API errors
      if (error?.response?.status === 400) {
        const errorData = error.response.data
        if (errorData?.error_time_message) {
          const timeMessage = Array.isArray(errorData.error_time_message)
            ? errorData.error_time_message[0]
            : errorData.error_time_message
          setErrorMessage(`Veuillez patienter ${timeMessage} avant de créer une nouvelle transaction`)
        } else if (errorData?.userid) {
          setErrorMessage(Array.isArray(errorData.userid) ? errorData.userid[0] : errorData.userid)
        } else if (errorData?.app_id) {
          setErrorMessage(Array.isArray(errorData.app_id) ? errorData.app_id[0] : errorData.app_id)
        } else if (errorData?.detail) {
          setErrorMessage(errorData.detail)
        } else {
          setErrorMessage("Erreur lors de la recherche. Veuillez réessayer.")
        }
      } else {
        setErrorMessage("Erreur lors de la recherche. Veuillez réessayer.")
      }
      setIsErrorModalOpen(true)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchEditBetId = async () => {
    const newBetId = appIdForm.getValues("user_app_id")
    const appId = appIdForm.getValues("app")

    if (!newBetId.trim() || !appId || !editingAppId) return

    const selectedPlatform = platforms.find(p => p.id === appId)
    if (!selectedPlatform) {
      toast.error("Plateforme non trouvée")
      return
    }

    setIsEditSearching(true)
    try {
      const searchResult = await userAppIdApi.searchUser(selectedPlatform.id, newBetId.trim())

      // Validate user exists
      if (searchResult.UserId === 0) {
        setEditErrorMessage("Utilisateur non trouvé. Veuillez vérifier l'ID de pari.")
        setIsEditErrorModalOpen(true)
        setIsEditSearching(false)
        return
      }

      // Validate currency (CurrencyId === 27 for XOF)
      if (searchResult.CurrencyId !== 27) {
        setEditErrorMessage("Cet utilisateur n'utilise pas la devise XOF. Veuillez vérifier votre compte.")
        setIsEditErrorModalOpen(true)
        setIsEditSearching(false)
        return
      }

      // Valid user - show confirmation modal with search result
      setPendingEditBetId({
        id: editingAppId.id,
        appId: appId,
        betId: newBetId.trim(),
        userName: searchResult.Name
      })
      setIsEditConfirmationModalOpen(true)
      setIsAppIdDialogOpen(false) // Close the edit dialog
    } catch (error: any) {
      // Handle API errors
      if (error?.response?.status === 400) {
        const errorData = error.response.data
        if (errorData?.error_time_message) {
          const timeMessage = Array.isArray(errorData.error_time_message)
            ? errorData.error_time_message[0]
            : errorData.error_time_message
          setEditErrorMessage(`Veuillez patienter ${timeMessage} avant de créer une nouvelle transaction`)
        } else if (errorData?.userid) {
          setEditErrorMessage(Array.isArray(errorData.userid) ? errorData.userid[0] : errorData.userid)
        } else if (errorData?.app_id) {
          setEditErrorMessage(Array.isArray(errorData.app_id) ? errorData.app_id[0] : errorData.app_id)
        } else if (errorData?.detail) {
          setEditErrorMessage(errorData.detail)
        } else {
          setEditErrorMessage("Erreur lors de la recherche. Veuillez réessayer.")
        }
      } else {
        setEditErrorMessage("Erreur lors de la recherche. Veuillez réessayer.")
      }
      setIsEditErrorModalOpen(true)
    } finally {
      setIsEditSearching(false)
    }
  }

  const handleConfirmAddBetId = async () => {
    if (!pendingBetId) return

    setIsSubmitting(true)
    try {
      await userAppIdApi.create(pendingBetId.betId, pendingBetId.appId)
      appIdForm.reset()
      setPendingBetId(null)
      setIsConfirmationModalOpen(false)
      toast.success("ID de pari ajouté avec succès")
      loadData()
    } catch (error: any) {
      // Handle API errors
      if (error?.response?.status === 400) {
        const errorData = error.response.data
        if (errorData?.error_time_message) {
          const timeMessage = Array.isArray(errorData.error_time_message)
            ? errorData.error_time_message[0]
            : errorData.error_time_message
          toast.error(`Veuillez patienter ${timeMessage} avant de créer une nouvelle transaction`)
        } else if (errorData?.user_app_id) {
          const errorMsg = Array.isArray(errorData.user_app_id) ? errorData.user_app_id[0] : errorData.user_app_id
          toast.error(errorMsg)
        } else {
          toast.error("Erreur lors de l'ajout de l'ID de pari")
        }
      } else {
        toast.error("Erreur lors de l'ajout de l'ID de pari")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmEditBetId = async () => {
    if (!pendingEditBetId) return

    setIsSubmitting(true)
    try {
      await userAppIdApi.update(pendingEditBetId.id, pendingEditBetId.betId, pendingEditBetId.appId)
      appIdForm.reset()
      setEditingAppId(null)
      setPendingEditBetId(null)
      setIsEditConfirmationModalOpen(false)
      toast.success("ID de pari modifié avec succès")
      loadData()
    } catch (error: any) {
      // Handle API errors
      if (error?.response?.status === 400) {
        const errorData = error.response.data
        if (errorData?.error_time_message) {
          const timeMessage = Array.isArray(errorData.error_time_message)
            ? errorData.error_time_message[0]
            : errorData.error_time_message
          toast.error(`Veuillez patienter ${timeMessage} avant de créer une nouvelle transaction`)
        } else if (errorData?.user_app_id) {
          const errorMsg = Array.isArray(errorData.user_app_id) ? errorData.user_app_id[0] : errorData.user_app_id
          toast.error(errorMsg)
        } else {
          toast.error("Erreur lors de la modification de l'ID de pari")
        }
      } else {
        toast.error("Erreur lors de la modification de l'ID de pari")
      }
    } finally {
      setIsSubmitting(false)
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
                <span className="text-foreground font-bold text-base bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">Numéros & IDs</span>
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

          <Tabs defaultValue="phones" className="space-y-3">
        <TabsList className="w-full grid grid-cols-2 bg-card/60 backdrop-blur-md border border-border/40 rounded-xl p-1">
          <TabsTrigger value="phones" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">Numéros</TabsTrigger>
          <TabsTrigger value="appIds" className="text-xs data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg">IDs de pari</TabsTrigger>
        </TabsList>

        {/* Phone Numbers Tab */}
        <TabsContent value="phones" className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
            <div className="relative z-10">
              <div className="p-3 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/30">
                    <Phone className="h-4 w-4 text-primary" />
                </div>
                  <div>
                    <h3 className="text-sm font-bold">Numéros de téléphone</h3>
                    <p className="text-xs text-muted-foreground hidden sm:block">Gérez vos numéros de téléphone mobile</p>
                </div>
              </div>
              <Dialog open={isPhoneDialogOpen} onOpenChange={setIsPhoneDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => setEditingPhone(null)} size="sm" className="h-8 text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Ajouter
                  </Button>
                </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:w-full max-w-md border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
                  <DialogHeader className="pb-3">
                    <DialogTitle className="text-base font-bold">{editingPhone ? "Modifier le numéro" : "Ajouter un numéro"}</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground">
                      {editingPhone
                        ? "Modifiez les informations de votre numéro"
                        : "Ajoutez un nouveau numéro de téléphone"}
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={phoneForm.handleSubmit(handlePhoneSubmit)} className="space-y-3">
                      <div className="flex gap-2 w-full">
                          <div className="space-y-1.5 w-full">
                              <Label htmlFor="network" className="text-xs">Réseau mobile</Label>
                              <Select
                                  onValueChange={(value) => phoneForm.setValue("network", Number.parseInt(value))}
                                  defaultValue={editingPhone?.network.toString()}
                                  disabled={isSubmitting}
                              >
                                  <SelectTrigger id="network" className="w-full h-8 text-xs">
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
                                  <p className="text-[10px] text-destructive">{phoneForm.formState.errors.network.message}</p>
                              )}
                          </div>

                          <div className="space-y-1.5 w-full">
                              <Label htmlFor="country" className="text-xs">Pays</Label>
                              <Select
                                  onValueChange={(value) => phoneForm.setValue("country", value)}
                                  defaultValue={editingPhone ? phoneForm.getValues("country") : "225"}
                                  disabled={isSubmitting}
                              >
                                  <SelectTrigger id="country" className="w-full h-8 text-xs">
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
                                  <p className="text-[10px] text-destructive">{phoneForm.formState.errors.country.message}</p>
                              )}
                          </div>
                      </div>

                      <div className="space-y-1.5 w-full">
                          <Label htmlFor="phone" className="text-xs">Numéro de téléphone</Label>
                          <Input
                              id="phone"
                              type="tel"
                              placeholder="+225 01 02 03 04 05"
                              {...phoneForm.register("phone")}
                              disabled={isSubmitting}
                              className="h-8 text-xs"
                          />
                          {phoneForm.formState.errors.phone && (
                              <p className="text-[10px] text-destructive">{phoneForm.formState.errors.phone.message}</p>
                          )}
                      </div>

                    <DialogFooter className="pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closePhoneDialog}
                        className="h-9 border-border/40"
                      >
                        Annuler
                      </Button>
                      <Button type="submit" disabled={isSubmitting} className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            <span className="text-xs">Enregistrement...</span>
                          </>
                        ) : editingPhone ? (
                          <span className="text-xs">Modifier</span>
                        ) : (
                          <span className="text-xs">Ajouter</span>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
              <div className="p-3">
              {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                      <Loader2 className="h-6 w-6 animate-spin text-primary relative z-10" />
                    </div>
                </div>
              ) : userPhones.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-full border-2 border-primary/30">
                        <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">Aucun numéro enregistré</p>
                    <p className="text-xs text-muted-foreground">Ajoutez votre premier numéro pour commencer</p>
                </div>
              ) : (
                    <div className="space-y-2">
                          {userPhones.map((phone) => (
                            <div
                              key={phone.id}
                              className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm hover:border-border/60 hover:shadow-md transition-all"
                            >
                              <div className="p-2.5">
                                <div className="flex items-center justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-0.5">Numéro</p>
                                    <p className="font-bold text-sm truncate">{phone.phone}</p>
                                              </div>
                                              <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-0.5">Réseau</p>
                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-border/40 bg-muted/30">
                                                      {networks.find((n) => n.id === phone.network)?.public_name || "Inconnu"}
                                                  </Badge>
                                              </div>
                                  <div className="flex gap-1 shrink-0">
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                      onClick={() => openEditPhoneDialog(phone)}
                                      className="h-7 w-7 p-0 rounded-lg bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80"
                                    >
                                      <Edit className="h-3 w-3" />
                                                      </Button>
                                                      <Button
                                                          variant="ghost"
                                      size="sm"
                                                          onClick={() => setDeleteTarget({ type: "phone", id: phone.id })}
                                      className="h-7 w-7 p-0 rounded-lg bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80 hover:text-destructive"
                                                      >
                                      <Trash2 className="h-3 w-3" />
                                                      </Button>
                                                  </div>
                                </div>
                              </div>
                            </div>
                                      ))}
                          </div>
                      )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* App IDs Tab */}
        <TabsContent value="appIds" className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5"></div>
            <div className="relative z-10">
              <div className="p-3 border-b border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/20 border border-primary/30">
                    <Smartphone className="h-4 w-4 text-primary" />
                </div>
                  <div>
                    <h3 className="text-sm font-bold">IDs de pari</h3>
                    <p className="text-xs text-muted-foreground hidden sm:block">Gérez vos identifiants de plateformes de pari</p>
                </div>
              </div>
              <Dialog open={isAppIdDialogOpen} onOpenChange={setIsAppIdDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() =>{
                      setEditingAppId(null)
                      appIdForm.reset({
                          user_app_id: undefined,
                          app: undefined,
                      })
                    }} size="sm" className="h-8 text-xs bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Ajouter
                  </Button>
                </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:w-full max-w-md border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
                    <DialogHeader className="pb-3">
                      <DialogTitle className="text-base font-bold">{editingAppId ? "Modifier l'ID" : "Ajouter un ID"}</DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                      {editingAppId ? "Modifiez votre ID de pari" : "Ajoutez un nouvel ID de pari"}
                    </DialogDescription>
                  </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="app" className="text-xs">Plateforme de pari</Label>
                      <Select
                        onValueChange={(value) => appIdForm.setValue("app", value)}
                        defaultValue={editingAppId?.app_details.id}
                        disabled={isSearching || isEditSearching || isSubmitting}
                      >
                          <SelectTrigger className="h-8 text-xs">
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
                          <p className="text-[10px] text-destructive">{appIdForm.formState.errors.app.message}</p>
                      )}
                    </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="user_app_id" className="text-xs">ID de pari</Label>
                      <Input
                        id="user_app_id"
                        type="text"
                        placeholder="Votre ID sur la plateforme"
                        {...appIdForm.register("user_app_id")}
                        disabled={isSearching || isEditSearching || isSubmitting}
                          className="h-8 text-xs"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !isSearching && !isEditSearching && !isSubmitting) {
                            editingAppId ? handleSearchEditBetId() : handleAddBetId()
                          }
                        }}
                      />
                      {appIdForm.formState.errors.user_app_id && (
                          <p className="text-[10px] text-destructive">{appIdForm.formState.errors.user_app_id.message}</p>
                      )}
                    </div>

                      <DialogFooter className="pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={closeAppIdDialog}
                          className="h-9 border-border/40"
                        disabled={isSearching || isEditSearching || isSubmitting}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        onClick={editingAppId ? handleSearchEditBetId : handleAddBetId}
                        disabled={isSearching || isEditSearching || isSubmitting}
                          className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                      >
                        {(isSearching || isEditSearching) ? (
                          <>
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                              <span className="text-xs">Recherche...</span>
                          </>
                        ) : (
                            <span className="text-xs">Rechercher</span>
                        )}
                      </Button>
                      </DialogFooter>
                  </div>
                </DialogContent>
              </Dialog>
              </div>
              <div className="p-3">
              {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                      <Loader2 className="h-6 w-6 animate-spin text-primary relative z-10" />
                    </div>
                </div>
              ) : userAppIds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
                      <div className="relative bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-full border-2 border-primary/30">
                        <Smartphone className="h-8 w-8 text-primary" />
                  </div>
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">Aucun ID enregistré</p>
                    <p className="text-xs text-muted-foreground">Ajoutez votre premier ID pour commencer</p>
                </div>
              ) : (
                    <div className="space-y-2">
                          {userAppIds.map((appId, index) => (
                            <div
                              key={`appId-${appId.id}-${appId.app_details.name || 'unknown'}-${index}`}
                              className="relative overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm hover:border-border/60 hover:shadow-md transition-all"
                            >
                              <div className="p-2.5">
                                <div className="flex items-center justify-between gap-2">
                                              <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-0.5">ID de pari</p>
                                    <p className="font-bold text-sm truncate font-mono">{appId.user_app_id}</p>
                                              </div>
                                              <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground mb-0.5">Plateforme</p>
                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 h-5 border-border/40 bg-muted/30">
                                                      {appId.app_details.name !=="" ? appId.app_details.name : "Inconnu"}
                                                  </Badge>
                                              </div>
                                  <div className="flex gap-1 shrink-0">
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                      onClick={() => openEditAppIdDialog(appId)}
                                      className="h-7 w-7 p-0 rounded-lg bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80"
                                    >
                                      <Edit className="h-3 w-3" />
                                                      </Button>
                                                      <Button
                                                          variant="ghost"
                                      size="sm"
                                                          onClick={() => setDeleteTarget({ type: "appId", id: appId.id })}
                                      className="h-7 w-7 p-0 rounded-lg bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80 hover:text-destructive"
                                                      >
                                      <Trash2 className="h-3 w-3" />
                                                      </Button>
                                                  </div>
                                </div>
                              </div>
                            </div>
                                      ))}
                          </div>
                      )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
            <AlertDialogContent className="border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
          <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-bold">Êtes-vous sûr?</AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground">
              Cette action est irréversible. Cela supprimera définitivement{" "}
              {deleteTarget?.type === "phone" ? "ce numéro" : "cet ID"}.
            </AlertDialogDescription>
          </AlertDialogHeader>
              <AlertDialogFooter className="pt-3">
                <AlertDialogCancel className="h-9 border-border/40">Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="h-9 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Bet ID Confirmation Modal */}
      <Dialog open={isConfirmationModalOpen} onOpenChange={setIsConfirmationModalOpen}>
            <DialogContent className="sm:max-w-md border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
              <DialogHeader className="pb-3">
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <div className="p-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span>Confirmer l'ajout</span>
            </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
              Voulez-vous ajouter cet ID de pari à vos IDs sauvegardés ?
            </DialogDescription>
          </DialogHeader>
          {pendingBetId && (
                <div className="space-y-2 py-3 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-3 border border-border/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Nom:</span>
                    <span className="text-xs font-semibold">{pendingBetId.userName}</span>
              </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">ID de pari:</span>
                    <span className="text-xs font-semibold font-mono">{pendingBetId.betId}</span>
              </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Plateforme:</span>
                    <span className="text-xs font-semibold">{platforms.find(p => p.id === pendingBetId.appId )?.name}</span>
              </div>
            </div>
          )}
              <DialogFooter className="pt-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmationModalOpen(false)
                setPendingBetId(null)
              }}
                  className="h-9 border-border/40"
            >
              Annuler
            </Button>
                <Button onClick={handleConfirmAddBetId} disabled={isSubmitting} className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
              {isSubmitting ? (
                <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      <span className="text-xs">Ajout...</span>
                </>
              ) : (
                    <span className="text-xs">Confirmer</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Error Modal */}
      <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
            <DialogContent className="sm:max-w-md border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
              <DialogHeader className="pb-3">
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <div className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <span>Erreur</span>
            </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
              {errorMessage || "Une erreur est survenue"}
            </DialogDescription>
          </DialogHeader>
              <DialogFooter className="pt-3">
            <Button
              onClick={() => {
                setIsErrorModalOpen(false)
                setErrorMessage("")
              }}
                  className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
                  <span className="text-xs">Fermer</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Modal */}
      <Dialog open={isEditConfirmationModalOpen} onOpenChange={setIsEditConfirmationModalOpen}>
            <DialogContent className="sm:max-w-md border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
              <DialogHeader className="pb-3">
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <div className="p-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span>Confirmer la modification</span>
            </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
              Voulez-vous modifier cet ID de pari ?
            </DialogDescription>
          </DialogHeader>
          {pendingEditBetId && (
                <div className="space-y-2 py-3 bg-gradient-to-br from-muted/30 to-muted/10 rounded-xl p-3 border border-border/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Nom:</span>
                    <span className="text-xs font-semibold">{pendingEditBetId.userName}</span>
              </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Nouvel ID de pari:</span>
                    <span className="text-xs font-semibold font-mono">{pendingEditBetId.betId}</span>
              </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Plateforme:</span>
                    <span className="text-xs font-semibold">{platforms.find(p => p.id === pendingEditBetId.appId)?.name}</span>
              </div>
            </div>
          )}
              <DialogFooter className="pt-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditConfirmationModalOpen(false)
                setPendingEditBetId(null)
              }}
                  className="h-9 border-border/40"
            >
              Annuler
            </Button>
                <Button onClick={handleConfirmEditBetId} disabled={isSubmitting} className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg">
              {isSubmitting ? (
                <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      <span className="text-xs">Modification...</span>
                </>
              ) : (
                    <span className="text-xs">Confirmer</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Error Modal */}
      <Dialog open={isEditErrorModalOpen} onOpenChange={setIsEditErrorModalOpen}>
            <DialogContent className="sm:max-w-md border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
              <DialogHeader className="pb-3">
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <div className="p-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
                    <XCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <span>Erreur</span>
            </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
              {editErrorMessage || "Une erreur est survenue"}
            </DialogDescription>
          </DialogHeader>
              <DialogFooter className="pt-3">
            <Button
              onClick={() => {
                setIsEditErrorModalOpen(false)
                setEditErrorMessage("")
              }}
                  className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
                  <span className="text-xs">Fermer</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  )
}
