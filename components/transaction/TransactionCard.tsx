import {Transaction} from "@/lib/types";
import {Card, CardContent} from "@/components/ui/card";
import {ArrowDownToLine, ArrowUpFromLine, Check, Copy} from "lucide-react";
import {Button} from "@/components/ui/button";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {toast} from "react-hot-toast";
import {useState} from "react";
import {Badge} from "@/components/ui/badge";

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

    const getStatusBadge = (status: Transaction["status"]) => {
        const statusConfig: Record<string, { variant:"pending" |"default" | "secondary" | "destructive" | "outline"; label: string }> = {
            pending: { variant: "pending", label: "En attente" },
            accept: { variant: "default", label: "Accepté" },
            init_payment: { variant: "pending", label: "En attente" },
            error: { variant: "destructive", label: "Erreur" },
            reject: { variant: "destructive", label: "Rejeté" },
            timeout: { variant: "outline", label: "Expiré" },
        }

        const config = statusConfig[status] || { variant: "outline" as const, label: status }
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const getTypeBadge = (type: Transaction["type_trans"]) => {
        return (
            <Badge variant={type === "deposit" ? "default" : "secondary"}>
                {type === "deposit" ? "Dépôt" : "Retrait"}
            </Badge>
        )
    }

    return (
        <Card key={transaction.id} className="group hover:shadow-xl hover:scale-[1.01] transition-all duration-300 border-2 border-transparent hover:border-primary/20 bg-gradient-to-r from-card via-card to-transparent hover:via-primary/5">
            <CardContent className="p-3 sm:p-4 lg:p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full">
                        <div className={`p-2 sm:p-3 rounded-xl shrink-0 ${
                            transaction.type_trans === "deposit"
                                ? "bg-gradient-to-br from-deposit/20 to-deposit/10 text-deposit ring-2 ring-deposit/10"
                                : "bg-gradient-to-br from-withdrawal/20 to-withdrawal/10 text-withdrawal ring-2 ring-withdrawal/10"
                        }`}>
                            {transaction.type_trans === "deposit" ? (
                                <ArrowDownToLine className="h-4 w-4 sm:h-5 sm:w-5" />
                            ) : (
                                <ArrowUpFromLine className="h-4 w-4 sm:h-5 sm:w-5" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <h3 className="font-bold text-sm sm:text-base text-foreground">#{transaction.reference}</h3>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 sm:h-6 sm:w-6 rounded-md hover:bg-muted"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            copyReference(transaction.reference)
                                        }}
                                        title="Copier la référence"
                                    >
                                        {copiedReference === transaction.reference ? (
                                            <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
                                        ) : (
                                            <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground hover:text-foreground" />
                                        )}
                                    </Button>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    {getTypeBadge(transaction.type_trans)}
                                    {getStatusBadge(transaction.status)}
                                </div>

                            </div>
                            <div className="flex flex-row items-start sm:items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                <span className="font-medium">{transaction.app_details.name}</span>
                                <span>•</span>
                                <span className="truncate">+{transaction.phone_number.slice(0,3)} {transaction.phone_number.slice(3)}</span>
                            </div>
                        </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-1 sm:gap-1">
                        <p className={`text-base sm:text-lg font-bold ${
                            transaction.type_trans === "deposit" ? "text-deposit" : "text-withdrawal"
                        }`}>
                            {transaction.type_trans === "deposit" ? "+" : "-"}
                            {transaction.amount.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "XOF",
                                minimumFractionDigits: 0,
                            })}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                            {format(new Date(transaction.created_at), "dd MMM à HH:mm", {
                                locale: fr,
                            })}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}