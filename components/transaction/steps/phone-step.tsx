"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2, Plus, Edit, Trash2, CheckCircle } from "lucide-react"
import { phoneApi } from "@/lib/api-client"
import type { UserPhone, Network } from "@/lib/types"
import { toast } from "react-hot-toast"
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

const COUNTRIES = [
    { code: "225", name: "Côte d'Ivoire" },
    { code: "229", name: "Bénin" },
    { code: "221", name: "Sénégal" },
    { code: "226", name: "Burkina Faso" },
]

interface PhoneStepProps {
  selectedNetwork: Network | null
  selectedPhone: UserPhone | null
  onSelect: (phone: UserPhone) => void
  onNext: () => void
}

export function PhoneStep({ selectedNetwork, selectedPhone, onSelect }: PhoneStepProps) {
  const [phones, setPhones] = useState<UserPhone[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingPhone, setEditingPhone] = useState<UserPhone | null>(null)
  const [newPhone, setNewPhone] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedCountry, setSelectedCountry] = useState<string>("225")
    const [selectedEditCountry, setSelectedEditCountry] = useState<string>("225")

  // Helper function to extract validation error messages from API response
  const getErrorMessage = (error: any): string => {
    // Check if error has response data with field-specific errors
    if (error?.response?.data && typeof error.response.data === 'object') {
      const errorData = error.response.data

      // Check for phone field errors
      if (errorData.phone && Array.isArray(errorData.phone) && errorData.phone.length > 0) {
        return errorData.phone[0] // Return the first error message for phone field
      }

      // Check for other common field errors
      const errorFields = ['phone', 'network', 'user']
      for (const field of errorFields) {
        if (errorData[field] && Array.isArray(errorData[field]) && errorData[field].length > 0) {
          return errorData[field][0]
        }
      }
    }

    // Fallback to generic error message
    return "Une erreur inattendue s'est produite"
  }

  useEffect(() => {
    if (selectedNetwork) {
      fetchPhones()
    }
  }, [selectedNetwork])

  const fetchPhones = async () => {
    if (!selectedNetwork) return
    
    setIsLoading(true)
    try {
      const data = await phoneApi.getAll()
      // Filter phones by selected network
      const networkPhones = data.filter(phone => phone.network === selectedNetwork.id)
      setPhones(networkPhones)
    } catch (error) {
      toast.error("Erreur lors du chargement des numéros de téléphone")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPhone = async () => {
      if (!newPhone.trim() || !selectedNetwork) return

      // Validate and clean phone number
      const cleanedPhone = newPhone.trim().replace(/\s+/g, "")

      // Check if phone number contains only digits
      if (!/^\d+$/.test(cleanedPhone)) {
          toast.error("Veuillez entrer uniquement des chiffres")
          return
      }

      // Check if phone number length is not more than 10 digits
      if (cleanedPhone.length > 10) {
          toast.error("Le numéro de téléphone ne doit pas dépasser 10 chiffres")
          return
      }

      setIsSubmitting(true)
      try {
          const phone = selectedCountry + cleanedPhone
          const newPhoneData = await phoneApi.create(phone, selectedNetwork.id)
          setPhones(prev => [...prev, newPhoneData])
          setNewPhone("")
          setIsAddDialogOpen(false)
          toast.success("Numéro de téléphone ajouté avec succès")
      } catch (error) {
          toast.error(getErrorMessage(error))
      } finally {
          setIsSubmitting(false)
      }
  }

  const handleEditPhone = async () => {
      if (!newPhone.trim() || !editingPhone || !selectedNetwork) return

      // Validate and clean phone number
      const cleanedPhone = newPhone.trim().replace(/\s+/g, "")

      // Check if phone number contains only digits
      if (!/^\d+$/.test(cleanedPhone)) {
          toast.error("Veuillez entrer uniquement des chiffres")
          return
      }

      // Check if phone number length is not more than 10 digits
      if (cleanedPhone.length > 10) {
          toast.error("Le numéro de téléphone ne doit pas dépasser 10 chiffres")
          return
      }

      setIsSubmitting(true)
      try {
          const phone = selectedEditCountry + cleanedPhone
          const updatedPhone = await phoneApi.update(
              editingPhone.id,
              phone,
              selectedNetwork.id
          )
          setPhones(prev => prev.map(phone =>
              phone.id === editingPhone.id ? updatedPhone : phone
          ))
          setNewPhone("")
          setEditingPhone(null)
          setIsEditDialogOpen(false)
          toast.success("Numéro de téléphone modifié avec succès")
      } catch (error) {
          toast.error(getErrorMessage(error))
      } finally {
          setIsSubmitting(false)
      }
  }

  const handleDeletePhone = async (phone: UserPhone) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce numéro de téléphone ?")) return
    
    try {
      await phoneApi.delete(phone.id)
      setPhones(prev => prev.filter(p => p.id !== phone.id))
      if (selectedPhone?.id === phone.id) {
        onSelect(null as any)
      }
      toast.success("Numéro de téléphone supprimé avec succès")
    } catch (error) {
      toast.error("Erreur lors de la suppression du numéro de téléphone")
    }
  }

  const openEditDialog = (phone: UserPhone) => {
    setEditingPhone(phone)
    // Extract country code (first 3 characters) and phone number (remaining characters)
    const countryCode = phone.phone.slice(0, 3)
    const phoneNumber = phone.phone.slice(3)
    setSelectedEditCountry(countryCode)
    setNewPhone(phoneNumber)
    setIsEditDialogOpen(true)
  }

  if (!selectedNetwork) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-muted-foreground">Veuillez d'abord sélectionner un réseau</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">Choisir un numéro de téléphone</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
              <Loader2 className="h-6 w-6 animate-spin text-primary relative z-10" />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {phones.map((phone) => (
              <div
                key={phone.id}
                className={`relative overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer group ${
                  selectedPhone?.id === phone.id
                    ? "border-primary/60 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent shadow-lg shadow-primary/10 scale-[0.98]"
                    : "border-border/40 bg-gradient-to-br from-card/50 to-card/30 hover:border-border/60 hover:shadow-md"
                }`}
                onClick={() => onSelect(phone)}
              >
                {/* Selected indicator */}
                {selectedPhone?.id === phone.id && (
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
                        selectedPhone?.id === phone.id ? "text-foreground" : "text-foreground/90"
                      }`}>
                        +{phone.phone.slice(0,3)} {phone.phone.slice(3)}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ajouté le {new Date(phone.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditDialog(phone)
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
                          handleDeletePhone(phone)
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
            
            {phones.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">Aucun numéro de téléphone trouvé</p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  <span className="text-xs">Ajouter un numéro</span>
                </Button>
              </div>
            )}
            
            {phones.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(true)}
                className="w-full h-9 border-border/40"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                <span className="text-xs">Ajouter un autre numéro</span>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Add Phone Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold">Ajouter un numéro de téléphone</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Entrez votre numéro {selectedNetwork.public_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
              <div>
                  <Label htmlFor="country" className="text-xs">Pays</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                      <SelectTrigger id="country" className="h-8 text-xs">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          {COUNTRIES.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                  {country.name}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
            <div>
              <Label htmlFor="phone" className="text-xs">Numéro de téléphone</Label>
              <Input
                id="phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Ex: 0712345678"
                maxLength={10}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Maximum 10 chiffres (sans le code pays)
              </p>
            </div>
          </div>
          <DialogFooter className="pt-3">
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
              className="h-9 border-border/40"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleAddPhone} 
              disabled={!newPhone.trim() || isSubmitting}
              className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">Ajout...</span>
                </>
              ) : (
                <span className="text-xs">Ajouter</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Phone Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="border border-border/40 bg-gradient-to-br from-card/95 via-card/90 to-card/85 backdrop-blur-xl shadow-2xl rounded-2xl">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-base font-bold">Modifier le numéro de téléphone</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifiez votre numéro {selectedNetwork.public_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
              <div>
                  <Label htmlFor="editCountry" className="text-xs">Pays</Label>
                  <Select value={selectedEditCountry} onValueChange={setSelectedEditCountry}>
                      <SelectTrigger id="editCountry" className="h-8 text-xs">
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          {COUNTRIES.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                  {country.name}
                              </SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
            <div>
              <Label htmlFor="editPhone" className="text-xs">Numéro de téléphone</Label>
              <Input
                id="editPhone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Ex: 0712345678"
                maxLength={10}
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Maximum 10 chiffres (sans le code pays)
              </p>
            </div>
          </div>
          <DialogFooter className="pt-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="h-9 border-border/40"
            >
              Annuler
            </Button>
            <Button 
              onClick={handleEditPhone} 
              disabled={!newPhone.trim() || isSubmitting}
              className="h-9 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">Modification...</span>
                </>
              ) : (
                <span className="text-xs">Modifier</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
