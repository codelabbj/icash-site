"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react"
import { userAppIdApi } from "@/lib/api-client"
import type { UserAppId, Platform } from "@/lib/types"
import { toast } from "react-hot-toast"

interface BetIdStepProps {
  selectedPlatform: Platform | null
  selectedBetId: UserAppId | null
  onSelect: (betId: UserAppId) => void
  onNext: () => void
}

export function BetIdStep({ selectedPlatform, selectedBetId, onSelect, onNext }: BetIdStepProps) {
  const [betIds, setBetIds] = useState<UserAppId[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingBetId, setEditingBetId] = useState<UserAppId | null>(null)
  const [newBetId, setNewBetId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Search functionality states
  const [isSearching, setIsSearching] = useState(false)
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false)
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [pendingBetId, setPendingBetId] = useState<{ appId: string; betId: string; userName: string } | null>(null)

  // Edit search functionality states
  const [isEditSearching, setIsEditSearching] = useState(false)
  const [isEditConfirmationModalOpen, setIsEditConfirmationModalOpen] = useState(false)
  const [isEditErrorModalOpen, setIsEditErrorModalOpen] = useState(false)
  const [editErrorMessage, setEditErrorMessage] = useState("")
  const [pendingEditBetId, setPendingEditBetId] = useState<{ id: number; appId: string; betId: string; userName: string } | null>(null)

  useEffect(() => {
    if (selectedPlatform) {
      fetchBetIds()
    }
  }, [selectedPlatform])

  const fetchBetIds = async () => {
    if (!selectedPlatform) return
    
    setIsLoading(true)
    try {
      const data = await userAppIdApi.getByPlatform(selectedPlatform.id)
      setBetIds(data)
    } catch (error) {
      toast.error("Erreur lors du chargement des IDs de pari")
    } finally {
      setIsLoading(false)
    }
  }


  const handleConfirmAddBetId = async () => {
    if (!pendingBetId) return

    setIsSubmitting(true)
    try {
      const newBetIdData = await userAppIdApi.create(pendingBetId.betId, pendingBetId.appId)
      setBetIds(prev => [...prev, newBetIdData])
      setNewBetId("")
      setPendingBetId(null)
      setIsConfirmationModalOpen(false)
      toast.success("ID de pari ajouté avec succès")
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

  const handleAddBetId = async () => {
    if (!newBetId.trim() || !selectedPlatform) {
      toast.error("Veuillez entrer un ID de pari")
      return
    }

    // First, search/validate the bet ID
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
        appId: selectedPlatform.id,
        betId: newBetId.trim(),
        userName: searchResult.Name
      })
      setIsConfirmationModalOpen(true)
      setIsAddDialogOpen(false) // Close the add dialog
    } catch (error: any) {
      // Handle API errors
      if (error?.response?.status === 400) {
        // Parse field-specific errors
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
    if (!newBetId.trim() || !editingBetId || !selectedPlatform) return
      
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
        id: editingBetId.id,
        appId: selectedPlatform.id,
        betId: newBetId.trim(),
        userName: searchResult.Name
      })
      setIsEditConfirmationModalOpen(true)
      setIsEditDialogOpen(false) // Close the edit dialog
    } catch (error: any) {
      // Handle API errors
      if (error?.response?.status === 400) {
        // Parse field-specific errors
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

  const handleConfirmEditBetId = async () => {
    if (!pendingEditBetId) return

    setIsSubmitting(true)
    try {
      const updatedBetId = await userAppIdApi.update(
        pendingEditBetId.id,
        pendingEditBetId.betId,
        pendingEditBetId.appId
      )
      setBetIds(prev => prev.map(betId =>
        betId.id === pendingEditBetId.id ? updatedBetId : betId
      ))
      setNewBetId("")
      setEditingBetId(null)
      setPendingEditBetId(null)
      setIsEditConfirmationModalOpen(false)
      toast.success("ID de pari modifié avec succès")
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

  const handleDeleteBetId = async (betId: UserAppId) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet ID de pari ?")) return
    
    try {
      await userAppIdApi.delete(betId.id)
      setBetIds(prev => prev.filter(b => b.id !== betId.id))
      if (selectedBetId?.id === betId.id) {
        onSelect(null as any)
      }
      toast.success("ID de pari supprimé avec succès")
    } catch (error) {
      toast.error("Erreur lors de la suppression de l'ID de pari")
    }
  }

  const openEditDialog = (betId: UserAppId) => {
    setEditingBetId(betId)
    setNewBetId(betId.user_app_id)
    setIsEditDialogOpen(true)
  }

  if (!selectedPlatform) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Veuillez d'abord sélectionner une plateforme</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Choisir votre ID de pari</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {betIds.map((betId) => (
                <Card
                  key={betId.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedBetId?.id === betId.id
                      ? "ring-2 ring-primary bg-primary/10"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => onSelect(betId)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{betId.user_app_id}</h3>
                        <p className="text-sm text-muted-foreground">
                          Ajouté le {new Date(betId.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(betId)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBetId(betId)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {betIds.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Aucun ID de pari trouvé</p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un ID de pari
                  </Button>
                </div>
              )}
              
              {betIds.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un autre ID de pari
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Bet ID Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un ID de pari</DialogTitle>
            <DialogDescription>
              Recherchez et validez votre ID de compte pour {selectedPlatform.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="betId">ID de pari</Label>
              <Input
                id="betId"
                value={newBetId}
                onChange={(e) => setNewBetId(e.target.value)}
                placeholder="Entrez votre ID de pari"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isSearching && !isSubmitting) {
                    handleAddBetId()
                  }
                }}
                disabled={isSearching || isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false)
              setNewBetId("")
            }} disabled={isSearching || isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleAddBetId} disabled={!newBetId.trim() || isSearching || isSubmitting}>
              {isSearching || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isSearching ? "Recherche..." : "Ajout..."}
                </>
              ) : (
                "Rechercher"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={isConfirmationModalOpen} onOpenChange={setIsConfirmationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirmer l'ajout
            </DialogTitle>
            <DialogDescription>
              Voulez-vous ajouter cet ID de pari à vos IDs sauvegardés ?
            </DialogDescription>
          </DialogHeader>
          {pendingBetId && (
            <div className="space-y-2 py-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nom:</span>
                <span className="text-sm font-medium">{pendingBetId.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">ID de pari:</span>
                <span className="text-sm font-medium">{pendingBetId.betId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plateforme:</span>
                <span className="text-sm font-medium">{selectedPlatform?.name}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsConfirmationModalOpen(false)
                setPendingBetId(null)
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleConfirmAddBetId} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ajout...
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={isErrorModalOpen} onOpenChange={setIsErrorModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Erreur
            </DialogTitle>
            <DialogDescription>
              {errorMessage || "Une erreur est survenue"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => {
                setIsErrorModalOpen(false)
                setErrorMessage("")
              }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bet ID Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'ID de pari</DialogTitle>
            <DialogDescription>
              Recherchez et validez votre nouvel ID de compte pour {selectedPlatform.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editBetId">ID de pari</Label>
              <Input
                id="editBetId"
                value={newBetId}
                onChange={(e) => setNewBetId(e.target.value)}
                placeholder="Entrez votre nouvel ID de pari"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isEditSearching && !isSubmitting) {
                    handleSearchEditBetId()
                  }
                }}
                disabled={isEditSearching || isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false)
              setNewBetId("")
            }} disabled={isEditSearching || isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleSearchEditBetId} disabled={!newBetId.trim() || isEditSearching || isSubmitting}>
              {isEditSearching || isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditSearching ? "Recherche..." : "Modification..."}
                </>
              ) : (
                "Rechercher"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Confirmation Modal */}
      <Dialog open={isEditConfirmationModalOpen} onOpenChange={setIsEditConfirmationModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Confirmer la modification
            </DialogTitle>
            <DialogDescription>
              Voulez-vous modifier cet ID de pari ?
            </DialogDescription>
          </DialogHeader>
          {pendingEditBetId && (
            <div className="space-y-2 py-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nom:</span>
                <span className="text-sm font-medium">{pendingEditBetId.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Nouvel ID de pari:</span>
                <span className="text-sm font-medium">{pendingEditBetId.betId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Plateforme:</span>
                <span className="text-sm font-medium">{selectedPlatform?.name}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditConfirmationModalOpen(false)
                setPendingEditBetId(null)
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleConfirmEditBetId} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification...
                </>
              ) : (
                "Confirmer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Error Modal */}
      <Dialog open={isEditErrorModalOpen} onOpenChange={setIsEditErrorModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Erreur
            </DialogTitle>
            <DialogDescription>
              {editErrorMessage || "Une erreur est survenue"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setIsEditErrorModalOpen(false)
                setEditErrorMessage("")
              }}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
