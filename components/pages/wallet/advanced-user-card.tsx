"use client";

import React, { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  MoreVertical,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Share2,
  Download,
  QrCode,
  Smartphone,
  Mail,
  CreditCard,
  Shield,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
// import { QRCodeDisplay } from "@/components/shared/qr-code";
import { QRCodeDisplay } from "@/components/shared/qr-code-2";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { formatWalletNumber } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { User, UserWallet, UserWithRelations } from "@/database/schema";
import { getWalletBalance } from "@/actions/wallets";

interface AdvancedUserCardProps {
  wallet: UserWallet;
  user: UserWithRelations & { ledgerBalance?: string };
  balance?: string; // Optionnel: solde calculé via ledger
  showBalance?: boolean;
  onRefresh?: () => Promise<void>;
  className?: string;
}

export function AdvancedUserCard({
  wallet,
  user,
  balance,
  showBalance = true,
  onRefresh,
  className,
}: AdvancedUserCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showQRDrawer, setShowQRDrawer] = useState(false);
  const [copied, setCopied] = useState(false);
  const [realBalance, setRealBalance] = useState<string | null>(null);

  // Fetch real balance on mount
  React.useEffect(() => {
    const fetchBalance = async () => {
      if (wallet?.id) {
        try {
          const bal = await getWalletBalance(wallet.id);
          setRealBalance(bal.toString());
        } catch (error) {
          console.error("Failed to fetch wallet balance", error);
        }
      }
    };
    fetchBalance();
  }, [wallet?.id]);

  const appInfo = {
    name: "GAMES TRAFICS",
    logo: "/icons/gt-primary.png",
    email: "games-trafics@gmail.com",
    phoneNumber: "+227 96021553",
    address: "Tahoua-Niger",
    socialMedia: [
      { name: "Facebook", url: "https://facebook.com/games.trafics", icon: "facebook" },
      { name: "Tiktok", url: "https://tiktok.com/games.trafics", icon: "tiktok" },
      { name: "Youtube", url: "https://youtube.com/games.trafics", icon: "youtube" },
      { name: "Twitter", url: "https://twitter.com/games_trafics", icon: "twitter" },
      { name: "Instagram", url: "https://instagram.com/games.trafics", icon: "instagram" },
      { name: "LinkedIn", url: "https://linkedin.com/company/games-trafics", icon: "linkedin" },
    ]
  };

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setIsRefreshing(true);
    try {
      await onRefresh();
      toast.success("Wallet actualisé");
    } catch (error) {
      toast.error("Erreur lors de l'actualisation");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${type} copié!`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Mon Wallet ${appInfo.name}`,
        text: `Découvrez mon wallet sur ${appInfo.name}`,
        url: window.location.href,
      });
    } else {
      handleCopy(window.location.href, "Lien");
    }
  };

  const getWalletStatus = () => {
    if (wallet.isLocked) {
      return {
        variant: "destructive" as const,
        icon: XCircle,
        text: "Bloqué",
        color: "text-red-600",
      };
    }

    if (!wallet.isActive) {
      return {
        variant: "secondary" as const,
        icon: Clock,
        text: "Inactif",
        color: "text-yellow-600",
      };
    }

    if (wallet.verificationStatus === "PENDING") {
      return {
        variant: "secondary" as const,
        icon: Clock,
        text: "En vérification",
        color: "text-yellow-600",
      };
    }

    if (wallet.verificationStatus === "REJECTED") {
      return {
        variant: "destructive" as const,
        icon: XCircle,
        text: "Rejeté",
        color: "text-red-600",
      };
    }

    return {
      variant: "default" as const,
      icon: CheckCircle,
      text: "Actif",
      color: "text-green-600",
    };
  };

  const walletStatus = getWalletStatus();
  const StatusIcon = walletStatus.icon;

  if (isRefreshing) {
    return <CardSkeleton />;
  }

  // Utiliser le solde passé en prop, ou le solde réel récupéré, ou celui de l'utilisateur, ou 0
  const displayBalance = balance || realBalance || user.ledgerBalance || "0";
  const formattedBalance = parseFloat(displayBalance).toLocaleString(
    "fr-FR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

  return (
    <>
      <div className="relative w-full mx-auto">
        {/* Carte 3D */}
        <motion.div
          className={cn(
            "relative w-full h-56 min-h-fit max-w-md mx-auto transition-transform duration-600 preserve-3d cursor-pointer",
            isFlipped && "rotate-y-180",
            "hover:shadow-2xl rounded-2xl transition-all duration-300",
            className
          )}
          style={{ perspective: "1000px" }}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Recto */}
          <div
            className={cn(
              "absolute inset-0 backface-hidden w-full h-full rounded-2xl",
              "bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 bg-mesh-1",
              "text-white shadow-2xl"
            )}
          >
            <CardContent className="p-6 h-full flex flex-col justify-between">
              {/* En-tête */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {appInfo.logo && (
                    <Image
                      src={appInfo.logo}
                      alt={appInfo.name}
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded"
                    />
                  )}
                  <Typography variant="body-sm" weight="medium" theme="white">
                    {appInfo.name}
                  </Typography>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRefresh();
                    }}
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""
                        }`}
                    />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/20"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleCopy(wallet.id, "ID du wallet")}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copier l'ID
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowQRDrawer(true)}>
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.print()}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Informations wallet */}
              <div className="space-y-4">
                <div>
                  <Typography variant="caption2" theme="white" className="opacity-80">
                    NUMÉRO DE WALLET
                  </Typography>
                  <Typography
                    variant="h5"
                    weight="bold"
                    className="font-mono tracking-widest select-all"
                    copyable
                    hasTooltip
                    tooltipContent="Cliquez pour copier"
                    onClick={() => handleCopy(wallet.cardNumberHash || wallet.id, "Numéro de wallet")}
                  >
                    {formatWalletNumber(wallet.cardNumberHash || wallet.id)}
                  </Typography>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <Typography
                      variant="caption2"
                      theme="white"
                      className="opacity-80"
                    >
                      TITULAIRE
                    </Typography>
                    <Typography variant="body-sm" weight="medium">
                      {user?.fullName?.toUpperCase() ||
                        user?.username?.toUpperCase() ||
                        "UTILISATEUR"}
                    </Typography>
                  </div>

                  {showBalance && (
                    <div className="text-right">
                      <Typography variant="caption2" className="opacity-80">
                        SOLDE
                      </Typography>
                      <Typography variant="h4" weight="bold">
                        {formattedBalance} GTC
                      </Typography>
                    </div>
                  )}
                </div>
              </div>

              {/* Badge de statut */}
              <div className="absolute bottom-4 right-4">
                <Badge variant={walletStatus.variant} className="gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {walletStatus.text}
                </Badge>
              </div>
            </CardContent>
          </div>

          {/* Verso */}
          <div
            className={cn(
              "absolute inset-0 backface-hidden w-full h-full rounded-2xl rotate-y-180",
              "bg-gradient-to-br from-slate-800 to-slate-900 bg-mesh-9",
              "text-white shadow-2xl"
            )}
          >
            <CardContent className="p-6 h-full flex flex-col justify-center items-center text-center space-y-4">
              {/* Logo et nom */}
              <div className="flex flex-col items-center gap-2">
                {appInfo.logo && (
                  <Image
                    src={appInfo.logo}
                    alt={appInfo.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-lg"
                  />
                )}
                <Typography
                  variant="h4"
                  weight="bold"
                  theme="white"
                >
                  {appInfo.name}
                </Typography>
              </div>

              {/* Informations de contact */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <Mail className="h-4 w-4 opacity-70" />
                  <Typography
                    variant="body-sm"
                    theme="white"
                    className="opacity-90"
                  >
                    {appInfo.email}
                  </Typography>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <Smartphone className="h-4 w-4 opacity-70" />
                  <Typography
                    variant="body-sm"
                    theme="white"
                    className="opacity-90"
                  >
                    {appInfo.phoneNumber}
                  </Typography>
                </div>
              </div>

              {/* Indication */}
              <Typography
                variant="caption2"
                theme="white"
                className="opacity-60"
              >
                Cliquez pour retourner la carte
              </Typography>
            </CardContent>
          </div>
        </motion.div>

        {/* Indicateurs rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-800">
                <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <Typography variant="caption2" theme="muted">
                Revenus
              </Typography>
            </div>
            <Typography variant="h4" weight="bold">
              0 GTC
            </Typography>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-800">
                <ArrowDownLeft className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <Typography variant="caption2" theme="muted">
                Dépenses
              </Typography>
            </div>
            <Typography variant="h4" weight="bold">
              0 GTC
            </Typography>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-800">
                <CreditCard className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <Typography variant="caption2" theme="muted">
                Transactions
              </Typography>
            </div>
            <Typography variant="h4" weight="bold">
              0
            </Typography>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-800">
                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <Typography variant="caption2" theme="muted">
                Sécurité
              </Typography>
            </div>
            <Typography variant="body-sm" weight="medium" theme="success">
              Excellent
            </Typography>
          </motion.div>
        </div>
      </div>

      {/* Drawer QR Code */}
      <Drawer open={showQRDrawer} onOpenChange={setShowQRDrawer}>
        <DrawerContent className="max-w-md mx-auto">
          <DrawerHeader>
            <DrawerTitle>QR Code du Wallet</DrawerTitle>
          </DrawerHeader>
          <div className="p-6 flex flex-col items-center">
            <QRCodeDisplay
              data={{
                type: "wallet",
                cardNumber: wallet.cardNumberHash || "",
                walletId: wallet.id,
                userId: user?.id || "",
              }}
              size={200}
              title={`Wallet ${user?.fullName || user?.username}`}
              description={`${appInfo.name} - ${formattedBalance} GTC`}
              showActions
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function CardSkeleton() {
  return (
    <Card className="w-full max-w-md mx-auto bg-gradient-to-br from-slate-100 to-slate-200 border-0 shadow-xl">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-7 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Styles CSS pour les animations 3D
const styles = `
.preserve-3d {
  transform-style: preserve-3d;
}

.backface-hidden {
  backface-visibility: hidden;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}
`;

// Injection des styles
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
