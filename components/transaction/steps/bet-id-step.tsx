"use client"

import { useState, useEffect } from "react"
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

export function BetIdStep({ selectedPlatform, selectedBetId, onSelect}: BetIdStepProps) {
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
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Veuillez d'abord sélectionner une plateforme</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Choisir votre ID de pari</h3>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
              <Loader2 className="h-6 w-6 animate-spin text-primary relative z-10" />
            </div>
            </div>
          ) : (
          <div className="space-y-2">
              {betIds.map((betId) => (
              <div
                  key={betId.id}
                className={`relative overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer group ${
                    selectedBetId?.id === betId.id
                    ? "border-primary/60 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-lg shadow-primary/10 scale-[0.98]"
                    : "border-border/40 bg-gradient-to-br from-card/50 to-card/30 hover:border-border/60 hover:shadow-md"
                  }`}
                  onClick={() => onSelect(betId)}
                >
                {/* Selected indicator */}
                {selectedBetId?.id === betId.id && (
                  <div className="absolute top-2 right-2 z-10">
                    <div className="p-1.5 rounded-full bg-primary border border-primary/30">
                      <CheckCircle className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
                
                <div className="p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm truncate ${
                        selectedBetId?.id === betId.id ? "text-foreground" : "text-foreground/90"
                      }`}>
                        {betId.user_app_id}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                          Ajouté le {new Date(betId.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditDialog(betId)
                          }}
                        className="h-7 w-7 p-0 rounded-lg bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80"
                        >
                        <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteBetId(betId)
                          }}
                        className="h-7 w-7 p-0 rounded-lg bg-card/60 backdrop-blur-sm border border-border/40 hover:bg-card/80 hover:text-destructive"
                        >
                        <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                </div>
              </div>
              ))}
              
              {betIds.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">Aucun ID de pari trouvé</p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  <span className="text-xs">Ajouter un ID de pari</span>
                  </Button>
                </div>
              )}
              
              {betIds.length > 0 && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(true)}
                className="w-full h-9 border-border/40"
                >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                <span className="text-xs">Ajouter un autre ID de pari</span>
                </Button>
              )}
            </div>
          )}
      </div>

      {/* Add Bet ID Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold">Ajouter un ID de pari</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Recherchez et validez votre ID de compte pour {selectedPlatform.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="betId" className="text-xs">ID de pari</Label>
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
                className="h-8 text-xs"
              />
            </div>
          </div>
          <DialogFooter className="pt-3">
            <Button 
              variant="outline" 
              onClick={() => {
              setIsAddDialogOpen(false)
              setNewBetId("")
              }} 
              disabled={isSearching || isSubmitting}
              className="h-9 border-border/40"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleAddBetId} 
              disabled={!newBetId.trim() || isSearching || isSubmitting}
              className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              {isSearching || isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">{isSearching ? "Recherche..." : "Ajout..."}</span>
                </>
              ) : (
                <span className="text-xs">Rechercher</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
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
                <span className="text-xs font-semibold">{selectedPlatform?.name}</span>
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
            <Button 
              onClick={handleConfirmAddBetId} 
              disabled={isSubmitting}
              className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
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

      {/* Error Modal */}
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

      {/* Edit Bet ID Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold">Modifier l'ID de pari</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Recherchez et validez votre nouvel ID de compte pour {selectedPlatform.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="editBetId" className="text-xs">ID de pari</Label>
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
                className="h-9 text-sm"
              />
            </div>
          </div>
          <DialogFooter className="pt-3">
            <Button 
              variant="outline" 
              onClick={() => {
              setIsEditDialogOpen(false)
              setNewBetId("")
              }} 
              disabled={isEditSearching || isSubmitting}
              className="h-9 border-border/40"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSearchEditBetId} 
              disabled={!newBetId.trim() || isEditSearching || isSubmitting}
              className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              {isEditSearching || isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">{isEditSearching ? "Recherche..." : "Modification..."}</span>
                </>
              ) : (
                <span className="text-xs">Rechercher</span>
              )}
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
                <span className="text-xs font-semibold">{selectedPlatform?.name}</span>
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
            <Button 
              onClick={handleConfirmEditBetId} 
              disabled={isSubmitting}
              className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
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
    </>
  )
}
