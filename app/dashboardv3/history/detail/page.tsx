"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bell, Moon, Sun, Copy, Check, ExternalLink, Loader2 } from "lucide-react"
import { transactionApi, networkApi, settingsApi } from "@/lib/api-client"
import type { Transaction, Network, Settings } from "@/lib/types"
import { getTransactionTypeLabel, getTransactionStatusLabel } from "@/lib/constants"
import { toast } from "react-hot-toast"
import { useTheme } from "next-themes"
import Image from "next/image"
import Link from "next/link"
import icashLogo from "@/public/icash-logo.png"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const TX_STORAGE_KEY_PREFIX = "tx_detail"

function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex justify-between items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs font-medium text-foreground text-right break-all ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  )
}

export default function TransactionDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const idParam = searchParams?.get("id")
  const id = idParam ? Number(idParam) : null
  const { user } = useAuth()
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedRef, setCopiedRef] = useState(false)
  const [networks, setNetworks] = useState<Network[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!id || !user) return

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [data, networksList, settingsData] = await Promise.all([
          transactionApi.getById(id),
          networkApi.getAll(),
          settingsApi.get(),
        ])
        setTransaction(data)
        setNetworks(networksList)
        setSettings(settingsData)
      } catch {
        const cached = typeof window !== "undefined" ? sessionStorage.getItem(`${TX_STORAGE_KEY_PREFIX}_${id}`) : null
        if (cached) {
          try {
            setTransaction(JSON.parse(cached))
            try {
              const [networksList, settingsData] = await Promise.all([
                networkApi.getAll(),
                settingsApi.get(),
              ])
              setNetworks(networksList)
              setSettings(settingsData)
            } catch {
              // ignore
            }
          } catch {
            setError("Transaction introuvable")
          }
        } else {
          setError("Transaction introuvable")
        }
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [id, user])

  const copyReference = () => {
    if (!transaction) return
    navigator.clipboard.writeText(transaction.reference)
    setCopiedRef(true)
    toast.success("Référence copiée !")
    setTimeout(() => setCopiedRef(false), 2000)
  }

  if (!user) {
    router.push("/login")
    return null
  }

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Identifiant invalide</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col relative">
      {/* Background simplifié */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-[#FF6B35] rounded-full blur-3xl opacity-30" />
        <div className="absolute bottom-0 -right-4 w-96 h-96 bg-[#2563EB] rounded-full blur-3xl opacity-30" />
      </div>

      <div className="flex-1 flex items-start justify-center p-3 sm:p-4 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[420px] flex flex-col pt-2 sm:pt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="h-9 w-9 rounded-xl bg-card/70 backdrop-blur-md border border-border/40"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1.5">
                <Image src={icashLogo} alt="iCASH" className="w-7 h-7" />
                <span className="font-bold text-base text-foreground">Détail transaction</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl border border-border/40" asChild>
                <Link href="/dashboardv3/notifications">
                  <Bell className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-xl border border-border/40"
                onClick={() => mounted && setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {mounted ? (resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Chargement...</p>
            </div>
          )}

          {error && !isLoading && (
            <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/40 p-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button variant="outline" onClick={() => router.push("/dashboardv3/history")}>
                Retour à l'historique
              </Button>
            </div>
          )}

          {transaction && !isLoading && (() => {
            const networkInfo = networks.find((n) => n.id === transaction.network)
            const appName = transaction.app_details?.name ?? transaction.app
            const appImage = transaction.app_details?.image
            const isDeposit = transaction.type_trans === "deposit"
            const whatsappSupportUrl = (() => {
              const phone = settings?.whatsapp_phone?.replace(/\D/g, "")
              if (!phone) return null
              const userName = [transaction.user?.first_name, transaction.user?.last_name].filter(Boolean).join(" ") || "Client"
              const typeLabel = isDeposit ? "dépôt" : "retrait"
              const message = [
                `Bonjour, moi c'est ${userName}, j'ai besoin d'aide concernant mon ${typeLabel}.`,
                `Date: ${format(new Date(transaction.created_at), "dd MMM yyyy à HH:mm", { locale: fr })}`,
                `Référence: ${transaction.reference}`,
                `Montant: ${transaction.amount.toLocaleString("fr-FR")} FCFA`,
                `Réseau: ${networkInfo?.public_name ?? "—"}`,
                `Téléphone: ${transaction.phone_number}`,
                `*${appName || "Plateforme"} ID:* ${transaction.user_app_id}`,
              ].join("\n")
              return `https://api.whatsapp.com/send/?phone=${phone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`
            })()

            return (
            <div className="space-y-4">
              {/* Bloc principal : type, statut, montant */}
              <div className="rounded-2xl bg-card/70 backdrop-blur-md border border-border/40 overflow-hidden shadow-lg">
                <div className="p-4 border-b border-border/40">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      transaction.type_trans === "deposit"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-primary/20 text-primary border border-primary/30"
                    }`}>
                      {getTransactionTypeLabel(transaction.type_trans)}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                      transaction.status === "accept"
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : transaction.status === "init_payment" || transaction.status === "pending"
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30"
                    }`}>
                      {getTransactionStatusLabel(transaction.status)}
                    </span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    transaction.type_trans === "deposit" ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
                  }`}>
                    {transaction.type_trans === "deposit" ? "+" : "−"}
                    {transaction.amount.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })} FCFA
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground font-mono">#{transaction.reference}</span>
                    <button
                      type="button"
                      onClick={copyReference}
                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                      title="Copier la référence"
                    >
                      {copiedRef ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Application & Réseau */}
                <div className="p-4 border-b border-border/40">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Application & Réseau</p>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="w-12 h-12 rounded-xl bg-background border border-border overflow-hidden flex items-center justify-center shrink-0">
                        {appImage ? (
                          <img src={appImage} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">{(appName || "?")[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Plateforme de pari</p>
                        <p className="text-sm font-semibold text-foreground truncate">{appName || "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <div className="w-12 h-12 rounded-xl bg-background border border-border overflow-hidden flex items-center justify-center shrink-0">
                        {networkInfo?.image ? (
                          <img src={networkInfo.image} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-sm font-bold text-muted-foreground">{(networkInfo?.public_name || "R")[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Réseau utilisé</p>
                        <p className="text-sm font-semibold text-foreground">{networkInfo?.public_name ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-0">
                  <DetailRow label="Date de création" value={format(new Date(transaction.created_at), "dd MMMM yyyy à HH:mm", { locale: fr })} />
                  {transaction.validated_at && (
                    <DetailRow label="Date de validation" value={format(new Date(transaction.validated_at), "dd MMMM yyyy à HH:mm", { locale: fr })} />
                  )}
                  <DetailRow label="Plateforme" value={appName || "—"} />
                  <DetailRow label="Réseau" value={networkInfo?.public_name ?? "—"} />
                  <DetailRow label="ID de pari" value={transaction.user_app_id} mono />
                  <DetailRow label="Numéro" value={transaction.phone_number} mono />
                  {transaction.deposit_reward_amount != null && transaction.deposit_reward_amount > 0 && (
                    <DetailRow label="Bonus dépôt" value={`${transaction.deposit_reward_amount.toLocaleString("fr-FR")} FCFA`} />
                  )}
                  {transaction.net_payable_amout != null && (
                    <DetailRow label="Montant net" value={`${transaction.net_payable_amout.toLocaleString("fr-FR")} FCFA`} />
                  )}
                  {transaction.transaction_link && (
                    <div className="flex justify-between items-center py-2.5 border-b border-border/40">
                      <span className="text-xs text-muted-foreground">Lien de paiement</span>
                      <a
                        href={transaction.transaction_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-primary flex items-center gap-1 hover:underline"
                      >
                        Ouvrir <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                  {transaction.error_message && (
                    <div className="pt-2.5">
                      <span className="text-xs text-muted-foreground block mb-1">Message d'erreur</span>
                      <p className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                        {transaction.error_message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contacter le support */}
              <div className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-md p-4">
                <p className="text-sm font-semibold text-foreground mb-3 text-center">
                  Un problème avec cette transaction ?
                </p>
                {whatsappSupportUrl ? (
                  <Button
                    className="w-full rounded-xl h-11 font-semibold bg-[#25D366] hover:bg-[#20BD5A] text-white border-0"
                    onClick={() => window.open(whatsappSupportUrl, "_blank", "noopener,noreferrer")}
                  >
                    Contacter le support (WhatsApp)
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground text-center">Support non configuré.</p>
                )}
              </div>

              <Button variant="outline" className="w-full" onClick={() => router.push("/dashboardv3/history")}>
                Retour à l'historique
              </Button>
            </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
