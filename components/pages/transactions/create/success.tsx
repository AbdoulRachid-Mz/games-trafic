"use client";

import React, { useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Download,
  Share2,
  Home,
  FileText,
  ExternalLink,
  Clock,
  User,
  ShoppingBag,
  Palette,
  Trophy,
  GamepadIcon,
  Star,
  Wallet,
  CreditCard,
  ArrowRight,
} from "lucide-react";
import { TransactionType, TransactionEntity } from "@/types/transaction-types";
import { fireConfettiPreset } from "@/utils/confetti";
import { generateEnhancedReceipt } from "@/utils/receipt-templates";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface TransactionSuccessProps {
  transactionId: string | null;
  transactionData: {
    type: TransactionType;
    amount: number;
    entity?: TransactionEntity;
    metadata?: Record<string, any>;
  };
  newBalance: number;
  isRequest?: boolean;
  /** Frais réels calculés côté serveur (reçus hardcodés à 0 avant). */
  fees?: number;
  /** Montant total débité (amount + fees). */
  totalAmount?: number;
  onReturnHome: () => void;
  onViewHistory: () => void;
}

export function TransactionSuccess({
  transactionId,
  transactionData,
  newBalance,
  isRequest = false,
  fees = 0,
  totalAmount,
  onReturnHome,
  onViewHistory,
}: TransactionSuccessProps) {
  // Référence déterministe (jamais un id issu de Date.now()).
  const transactionReference = transactionId
    ? `${isRequest ? "REQ" : "TX"}-${transactionId.slice(-8)}`
    : `${isRequest ? "REQ" : "TX"}`;

  const router = useRouter();

  useEffect(() => {
    // Confettis UNE seule fois, ici au montage du succès. (La page appelante
    // en relançait un à la confirmation → double effet visuel.)
    fireConfettiPreset("success");
  }, []);

  const getTypeIcon = () => {
    switch (transactionData.type) {
      case "THEME_PURCHASE":
        return Palette;
      case "VIP_SUBSCRIPTION":
        return Star;
      case "ORDER_PURCHASE":
        return ShoppingBag;
      case "TOURNAMENT_PARTICIPATION":
        return Trophy;
      case "GAME_ITEM_PURCHASE":
        return GamepadIcon;
      case "DEPOSIT":
        return Wallet;
      case "WITHDRAWAL":
        return CreditCard;
      case "TRANSFER":
        return User;
      default:
        return ShoppingBag;
    }
  };

  const getNextSteps = () => {
    if (isRequest) {
      return [
        "Votre demande sera traitée par un administrateur",
        "Vous recevrez une notification lors de la validation",
        "Le traitement peut prendre 24-48 heures",
      ];
    }

    switch (transactionData.type) {
      case "ORDER_PURCHASE":
        return [
          "Le vendeur vous contactera pour la livraison",
          "Vous pouvez suivre l'état dans vos commandes",
          "Contactez le support en cas de problème",
        ];
      case "THEME_PURCHASE":
        return [
          "Le thème est maintenant disponible dans vos paramètres",
          "Appliquez-le depuis la section 'Apparence'",
          "Vous pouvez l'utiliser sur toutes vos boutiques",
        ];
      case "VIP_SUBSCRIPTION":
        return [
          "Vos bénéfices VIP sont maintenant actifs",
          "Accédez aux fonctionnalités premium",
          "L'abonnement sera renouvelé automatiquement",
        ];
      case "TOURNAMENT_PARTICIPATION":
        return [
          "Votre inscription est confirmée",
          "Consultez les détails du tournoi",
          "Préparez-vous pour la compétition!",
        ];
      case "TRANSFER":
        return [
          "Le destinataire a été crédité",
          "La transaction est définitive",
          "Conservez ce reçu comme preuve",
        ];
      default:
        return ["Transaction complétée avec succès"];
    }
  };

  const nextSteps = getNextSteps();
  const TypeIcon = getTypeIcon();

  const handleDownloadReceipt = () => {
    void generateEnhancedReceipt({
      transactionId: transactionId || transactionReference,
      amount: transactionData.amount,
      type: transactionData.type,
      status: isRequest ? "PENDING" : "COMPLETED",
      fees,
      totalAmount: totalAmount ?? transactionData.amount + fees,
      date: new Date(),
      reference: transactionReference,
      newBalance,
      entityData: transactionData.entity,
      metadata: transactionData.metadata,
    }).catch(() => {
      toast.error("Impossible de générer le reçu pour le moment.");
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: isRequest ? "Demande créée" : "Transaction réussie",
          text: isRequest
            ? `J'ai créé une demande de ${transactionData.amount} GTC sur Games Trafics!`
            : `J'ai effectué une transaction de ${transactionData.amount} GTC sur Games Trafics!`,
          url: window.location.href,
        });
      } catch {
        // Annulation utilisateur — silence volontaire (pas de console.log)
      }
    }
  };

  return (
    <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
      <div className="w-full h-1 bg-linear-to-r from-green-500 via-emerald-400 to-green-500" />
      <CardContent className="p-8 pt-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="flex flex-col items-center"
        >
          {/* Animated Success Check */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20 rounded-full" />
            <motion.div
              initial={{ scale: 0.85, rotate: -4 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="relative w-24 h-24 rounded-full bg-linear-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30"
            >
              <CheckCircle className="h-10 w-10 text-white" strokeWidth={3} />
            </motion.div>
          </div>

          <Typography
            variant="h2"
            weight="extrabold"
            className="mb-2 text-transparent bg-clip-text bg-linear-to-r from-foreground to-foreground/70"
          >
            {isRequest ? "Demande Envoyée !" : "Transaction Réussie !"}
          </Typography>
          <Typography
            variant="body-base"
            theme="muted"
            className="text-center max-w-sm mb-8"
          >
            {isRequest
              ? "Votre demande a été soumise avec succès et est en cours de traitement."
              : "Les fonds ont été transférés avec succès. Voici votre reçu."}
          </Typography>

          {/* Receipt Card */}
          <div className="w-full max-w-sm bg-muted/30 rounded-2xl p-6 border border-border/50 mb-8 relative overflow-hidden group">
            {/* Decorative circles */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all" />
            <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-all" />

            <div className="relative space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-background shadow-sm border border-border/50">
                    <TypeIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Typography variant="body-sm" weight="bold">
                      Montant
                    </Typography>
                    <Typography variant="caption1" theme="muted">
                      {format(new Date(), "dd MMM yyyy, HH:mm", { locale: fr })}
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="text-center py-2">
                <Typography variant="h2" weight="extrabold">
                  {transactionData.amount.toFixed(2)}{" "}
                  <span className="text-lg text-muted-foreground font-bold">
                    GTC
                  </span>
                </Typography>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 border border-border/50 mt-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <Typography variant="caption1" className="font-mono">
                    {transactionReference}
                  </Typography>
                </div>
              </div>

              {!isRequest && (
                <>
                  <Separator className="bg-border/50" />
                  <div className="flex justify-between items-center">
                    <Typography variant="body-sm" theme="muted">
                      Nouveau solde
                    </Typography>
                    <Typography
                      variant="body-lg"
                      weight="bold"
                      className="text-green-600"
                    >
                      {newBalance.toFixed(2)} GTC
                    </Typography>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="w-full max-w-sm mb-8 space-y-3">
            <Typography
              variant="caption1"
              weight="bold"
              className="uppercase tracking-wider text-muted-foreground/70 ml-1"
            >
              À savoir
            </Typography>
            {nextSteps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex gap-3 text-sm text-muted-foreground"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                {step}
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="w-full max-w-sm grid grid-cols-2 gap-3">
            {!isRequest && (
              <Button
                variant="outline"
                onClick={handleDownloadReceipt}
                className="rounded-xl h-11"
              >
                <Download className="mr-2 h-4 w-4" /> Reçu
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleShare}
              className={cn("rounded-xl h-11", isRequest ? "col-span-2" : "")}
            >
              <Share2 className="mr-2 h-4 w-4" /> Partager
            </Button>
            <Button
  onClick={() => {
    if (transactionId) {
      router.push(`/wallet/transactions/${transactionId}`);
    } else {
      onReturnHome();
    }
  }}
  className="col-span-2 rounded-xl h-12 shadow-lg shadow-primary/20"
>
  Voir le détail de la transaction
  <ExternalLink className="ml-2 h-4 w-4" />
</Button>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}
