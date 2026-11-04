// app/(protected)/wallet/transactions/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Copy,
  Share2,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  CreditCard,
  User,
  ShoppingBag,
  Palette,
  Trophy,
  GamepadIcon,
  Star,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getTransactionById } from "@/actions/transactions";
import { generateEnhancedReceipt } from "@/utils/receipt-templates";
import type { WalletTransaction } from "@/database/schema";

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [transaction, setTransaction] = useState<WalletTransaction | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTransaction();
  }, [params.id]);

  const loadTransaction = async () => {
    try {
      const data = await getTransactionById(params.id as string);
      setTransaction(data);
    } catch (error) {
      console.error("Error loading transaction:", error);
      toast.error("Erreur lors du chargement de la transaction");
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return {
          icon: CheckCircle,
          color: "text-green-500",
          bg: "bg-green-500/10",
          label: "Complété",
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-yellow-500",
          bg: "bg-yellow-500/10",
          label: "En attente",
        };
      case "FAILED":
        return {
          icon: XCircle,
          color: "text-red-500",
          bg: "bg-red-500/10",
          label: "Échoué",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-500",
          bg: "bg-gray-500/10",
          label: status,
        };
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "DEPOSIT":
        return { icon: Wallet, label: "Dépôt", color: "text-green-500" };
      case "WITHDRAWAL":
        return { icon: CreditCard, label: "Retrait", color: "text-red-500" };
      case "TRANSFER":
        return { icon: User, label: "Transfert", color: "text-blue-500" };
      case "THEME_PURCHASE":
        return {
          icon: Palette,
          label: "Achat thème",
          color: "text-purple-500",
        };
      case "ORDER_PURCHASE":
        return {
          icon: ShoppingBag,
          label: "Achat produit",
          color: "text-pink-500",
        };
      case "TOURNAMENT_PARTICIPATION":
        return {
          icon: Trophy,
          label: "Participation tournoi",
          color: "text-yellow-500",
        };
      case "GAME_ITEM_PURCHASE":
        return {
          icon: GamepadIcon,
          label: "Achat item jeu",
          color: "text-cyan-500",
        };
      case "VIP_SUBSCRIPTION":
        return { icon: Star, label: "Abonnement VIP", color: "text-amber-500" };
      default:
        return { icon: Wallet, label: type, color: "text-gray-500" };
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadReceipt = () => {
    if (!transaction) return;
    if (transaction.status !== "COMPLETED") {
      toast.error("Le reçu n'est disponible que pour les transactions complétées.");
      return;
    }

    generateEnhancedReceipt({
      transactionId: transaction.id,
      amount: parseFloat(transaction.amount),
      type: transaction.type as any,
      fees: parseFloat(transaction.fees || "0"),
      totalAmount: parseFloat(transaction.netAmount),
      date: transaction.createdAt
        ? new Date(transaction.createdAt)
        : new Date(),
      reference: `TX-${transaction.id.slice(-8)}`,
      newBalance: parseFloat(transaction.balanceAfter),
      entityData: (transaction.metadata as Record<string, any>)?.entity,
      metadata: transaction.metadata as Record<string, any> | undefined,
    });
  };

  const handleShare = async () => {
    if (!transaction) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Détail transaction",
          text: `Transaction de ${transaction.amount} GTC - ${transaction.type}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share cancelled");
      }
    } else {
      handleCopy(window.location.href);
    }
  };

  if (loading) {
    return <TransactionDetailSkeleton />;
  }

  if (!transaction) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <Typography variant="h2" weight="bold">
          Transaction non trouvée
        </Typography>
        <Button onClick={() => router.back()} className="mt-4">
          Retour
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(transaction.status ?? "PENDING");
  const typeConfig = getTypeConfig(transaction.type);
  const StatusIcon = statusConfig.icon;
  const TypeIcon = typeConfig.icon;
  const amountNum = parseFloat(transaction.amount);
  const isCredit = ["DEPOSIT", "BONUS", "REFUND"].includes(transaction.type);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleDownloadReceipt}
            className="gap-2"
            disabled={transaction.status !== "COMPLETED"}
          >
            <Download className="h-4 w-4" />
            Reçu PDF
          </Button>
          <Button variant="outline" onClick={handleShare} className="gap-2">
            <Share2 className="h-4 w-4" />
            Partager
          </Button>
        </div>
      </div>

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Status Banner */}
            <div
              className={`p-4 ${statusConfig.bg} border-b border-border/50 flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                <Typography variant="body-sm" weight="bold">
                  {statusConfig.label}
                </Typography>
              </div>
              <Typography
                variant="caption1"
                theme="muted"
                className="font-mono"
              >
                ID: {transaction.id.slice(0, 8)}...
              </Typography>
            </div>

            <div className="p-8">
              {/* Transaction Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-3 rounded-xl ${statusConfig.bg}`}>
                  <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
                </div>
                <div>
                  <Typography variant="h3" weight="bold">
                    {typeConfig.label}
                  </Typography>
                  <Typography variant="caption1" theme="muted">
                    {format(
                      transaction.createdAt
                        ? new Date(transaction.createdAt)
                        : new Date(),
                      "EEEE d MMMM yyyy 'à' HH:mm",
                      { locale: fr },
                    )}
                  </Typography>
                </div>
              </div>

              {/* Amount Section */}
              <div className="text-center py-6 mb-6 bg-muted/20 rounded-2xl">
                <Typography
                  variant="caption1"
                  theme="muted"
                  className="uppercase tracking-wider"
                >
                  Montant
                </Typography>
                <Typography
                  variant="h1"
                  weight="extrabold"
                  className={`${isCredit ? "text-green-500" : "text-red-500"}`}
                >
                  {isCredit ? "+" : "-"}
                  {amountNum.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  GTC
                </Typography>
                {parseFloat(transaction.fees || "0") > 0 && (
                  <Typography variant="caption1" theme="muted">
                    Frais:{" "}
                    {parseFloat(transaction.fees || "0").toLocaleString(
                      "fr-FR",
                      { minimumFractionDigits: 2 },
                    )}{" "}
                    GTC
                  </Typography>
                )}
              </div>

              <Separator className="my-6" />

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Typography
                      variant="caption2"
                      theme="muted"
                      className="uppercase tracking-wider"
                    >
                      Référence
                    </Typography>
                    <div className="flex items-center gap-2 mt-1">
                      <Typography variant="body-sm" className="font-mono">
                        TX-{transaction.id.slice(-8)}
                      </Typography>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() =>
                          handleCopy(`TX-${transaction.id.slice(-8)}`)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {transaction.description && (
                    <div>
                      <Typography
                        variant="caption2"
                        theme="muted"
                        className="uppercase tracking-wider"
                      >
                        Description
                      </Typography>
                      <Typography variant="body-sm" className="mt-1">
                        {transaction.description}
                      </Typography>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Typography
                      variant="caption2"
                      theme="muted"
                      className="uppercase tracking-wider"
                    >
                      Solde après transaction
                    </Typography>
                    <Typography variant="h4" weight="bold" className="mt-1">
                      {parseFloat(transaction.balanceAfter).toLocaleString(
                        "fr-FR",
                        { minimumFractionDigits: 2 },
                      )}{" "}
                      GTC
                    </Typography>
                  </div>

                  <div>
                    <Typography
                      variant="caption2"
                      theme="muted"
                      className="uppercase tracking-wider"
                    >
                      Date & Heure
                    </Typography>
                    <Typography variant="body-sm" className="mt-1">
                      {format(
                        transaction.createdAt
                          ? new Date(transaction.createdAt)
                          : new Date(),
                        "dd/MM/yyyy HH:mm:ss",
                        { locale: fr },
                      )}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Entity Details if present */}
              {(transaction.metadata as Record<string, any>)?.entity && (
                <>
                  <Separator className="my-6" />
                  <div>
                    <Typography variant="h5" weight="bold" className="mb-4">
                      Détails de l'élément
                    </Typography>
                    <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Nom
                        </Typography>
                        <Typography variant="body-sm" weight="medium">
                          {
                            (transaction.metadata as Record<string, any>).entity
                              .name
                          }
                        </Typography>
                      </div>
                      {(transaction.metadata as Record<string, any>).entity
                        .description && (
                        <div className="flex justify-between">
                          <Typography variant="body-sm" theme="muted">
                            Description
                          </Typography>
                          <Typography variant="body-sm">
                            {
                              (transaction.metadata as Record<string, any>)
                                .entity.description
                            }
                          </Typography>
                        </div>
                      )}
                      {(transaction.metadata as Record<string, any>).entity
                        .price && (
                        <div className="flex justify-between">
                          <Typography variant="body-sm" theme="muted">
                            Prix unitaire
                          </Typography>
                          <Typography
                            variant="body-sm"
                            weight="bold"
                            className="text-primary"
                          >
                            {
                              (transaction.metadata as Record<string, any>)
                                .entity.price
                            }{" "}
                            GTC
                          </Typography>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Payment Details for Deposit/Withdrawal */}
              {(transaction.type === "DEPOSIT" ||
                transaction.type === "WITHDRAWAL") &&
                transaction.metadata && (
                  <>
                    <Separator className="my-6" />
                    <div>
                      <Typography variant="h5" weight="bold" className="mb-4">
                        Détails de paiement
                      </Typography>
                      <div className="bg-muted/20 rounded-xl p-4 space-y-3">
                        {(transaction.metadata as Record<string, any>)
                          ?.paymentMethod && (
                          <div className="flex justify-between">
                            <Typography variant="body-sm" theme="muted">
                              Méthode
                            </Typography>
                            <Typography variant="body-sm">
                              {
                                (transaction.metadata as Record<string, any>)
                                  .paymentMethod
                              }
                            </Typography>
                          </div>
                        )}
                        {(transaction.metadata as Record<string, any>)
                          ?.paymentProvider && (
                          <div className="flex justify-between">
                            <Typography variant="body-sm" theme="muted">
                              Fournisseur
                            </Typography>
                            <Typography variant="body-sm">
                              {
                                (transaction.metadata as Record<string, any>)
                                  .paymentProvider
                              }
                            </Typography>
                          </div>
                        )}
                        {(transaction.metadata as Record<string, any>)
                          ?.paymentAccountId && (
                          <div className="flex justify-between">
                            <Typography variant="body-sm" theme="muted">
                              Compte
                            </Typography>
                            <Typography variant="body-sm" className="font-mono">
                              {
                                (transaction.metadata as Record<string, any>)
                                  .paymentAccountId
                              }
                            </Typography>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function TransactionDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between mb-8">
        <Skeleton className="h-10 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Skeleton className="h-[500px] w-full rounded-2xl" />
    </div>
  );
}
