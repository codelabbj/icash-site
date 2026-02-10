import {Transaction} from "@/lib/types";
import {ArrowDownToLine, ArrowUpFromLine, Check, Copy} from "lucide-react";
import {Button} from "@/components/ui/button";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {toast} from "react-hot-toast";
import {useState} from "react";

interface Props {
    transaction: Transaction
}

export const TransactionCard = ({transaction} : Props) =>{
    const [copiedReference, setCopiedReference] = useState<string|null>(null)

    const copyReference = async (reference: string) => {
        try {
            await navigator.clipboard.writeText(reference)
            setCopiedReference(reference)
            toast.success("Référence copiée!")
            setTimeout(() => setCopiedReference(null), 2000)
        } catch (error) {
            toast.error("Erreur lors de la copie")
        }
    }

    const getStatusColor = (status: Transaction["status"]) => {
        const statusColors: Record<string, { bg: string; text: string; border: string }> = {
            pending: { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500", border: "border-yellow-500/30" },
            accept: { bg: "bg-green-500/20", text: "text-green-600 dark:text-green-500", border: "border-green-500/30" },
            init_payment: { bg: "bg-yellow-500/20", text: "text-yellow-600 dark:text-yellow-500", border: "border-yellow-500/30" },
            error: { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500", border: "border-red-500/30" },
            reject: { bg: "bg-red-500/20", text: "text-red-600 dark:text-red-500", border: "border-red-500/30" },
            timeout: { bg: "bg-gray-500/20", text: "text-gray-600 dark:text-gray-500", border: "border-gray-500/30" },
        }
        return statusColors[status] || { bg: "bg-gray-500/20", text: "text-gray-600 dark:text-gray-500", border: "border-gray-500/30" }
    }

    const getStatusLabel = (status: Transaction["status"]) => {
        const labels: Record<string, string> = {
            pending: "En attente",
            accept: "Accepté",
            init_payment: "En attente",
            error: "Erreur",
            reject: "Rejeté",
            timeout: "Expiré",
        }
        return labels[status] || status
    }

    const statusStyle = getStatusColor(transaction.status)
    const isDeposit = transaction.type_trans === "deposit"

    return (
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-card/70 via-card/60 to-card/50 backdrop-blur-md border border-border/40 shadow-sm hover:shadow-md hover:border-border/60 transition-all duration-300">
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isDeposit 
                    ? "bg-gradient-to-r from-green-500/5 via-transparent to-transparent" 
                    : "bg-gradient-to-r from-orange-500/5 via-transparent to-transparent"
            }`}></div>
            
            <div className="relative z-10 p-2.5">
                <div className="flex items-center justify-between gap-2">
                    {/* Left side - Icon and main info */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                            isDeposit
                                ? "bg-gradient-to-br from-green-500/20 to-green-500/10 border border-green-500/30"
                                : "bg-gradient-to-br from-orange-500/20 to-orange-500/10 border border-orange-500/30"
                        }`}>
                            {isDeposit ? (
                                <ArrowDownToLine className={`h-3.5 w-3.5 ${isDeposit ? "text-green-600 dark:text-green-500" : "text-orange-600 dark:text-orange-500"}`} />
                            ) : (
                                <ArrowUpFromLine className="h-3.5 w-3.5 text-orange-600 dark:text-orange-500" />
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                                <h3 className="font-semibold text-xs text-foreground truncate">#{transaction.reference}</h3>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 rounded-md hover:bg-muted/50 p-0"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        copyReference(transaction.reference)
                                    }}
                                    title="Copier la référence"
                                >
                                    {copiedReference === transaction.reference ? (
                                        <Check className="h-3 w-3 text-green-600" />
                                    ) : (
                                        <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    )}
                                </Button>
                            </div>
                            
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                                    isDeposit 
                                        ? "bg-green-500/20 text-green-600 dark:text-green-500 border-green-500/30" 
                                        : "bg-orange-500/20 text-orange-600 dark:text-orange-500 border-orange-500/30"
                                }`}>
                                    {isDeposit ? "Dépôt" : "Retrait"}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                                    {getStatusLabel(transaction.status)}
                                </span>
                            </div>
                            
                            <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-muted-foreground truncate">{transaction.app_details.name}</span>
                                <span className="text-[10px] text-muted-foreground">•</span>
                                <span className="text-[10px] text-muted-foreground truncate">+{transaction.phone_number.slice(0,3)} {transaction.phone_number.slice(3)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right side - Amount and date */}
                    <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <p className={`text-sm font-bold ${
                            isDeposit ? "text-green-600 dark:text-green-500" : "text-orange-600 dark:text-orange-500"
                        }`}>
                            {isDeposit ? "+" : "-"}
                            {transaction.amount.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "XOF",
                                minimumFractionDigits: 0,
                            })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                            {format(new Date(transaction.created_at), "dd MMM à HH:mm", {
                                locale: fr,
                            })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}