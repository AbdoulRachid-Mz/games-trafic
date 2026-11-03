"use client";

import React, { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  Lock,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Ban,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { WalletNavigation } from "@/components/pages/wallet/wallet-navigation";
import { useUserProfile } from "@/hooks/use-profile";
import CreateWalletPage from "./create/page";

interface WalletLayoutProps {
  children: React.ReactNode;
}
export default function WalletLayout({ children }: WalletLayoutProps) {
  const { user, loading, isAuthenticated } = useAuthContext();
  const { data: completeData } = useUserProfile({
    enabled: true,
    mode: "partial",
    relations: ["wallet"],
  });
  const router = useRouter();
  const pathname = usePathname();
  const [walletCheckComplete, setWalletCheckComplete] = useState(false);
  const [walletStatus, setWalletStatus] = useState<{
    hasWallet: boolean;
    is_locked: boolean;
    is_active: boolean;
    verification_status: "PENDING" | "VERIFIED" | "REJECTED";
    failed_attempts: number;
    is_default_pin: boolean;
  } | null>(null);

  // Vérifier l'état du wallet
  useEffect(() => {
    const checkWallet = async () => {
      if (!completeData || loading) return;

      const wallet = completeData.wallet;
      const hasWallet = !!wallet || !!(completeData as any)?.hasWallet;

      setWalletStatus({
        hasWallet,
        is_locked: wallet?.isLocked ?? false,
        is_active: wallet?.isActive ?? false,
        verification_status: (wallet as any)?.verificationStatus ?? "PENDING",
        failed_attempts: (wallet as any)?.failedAttempts ?? 0,
        is_default_pin: (wallet as any)?.isDefaultPin ?? false,
      });
      setWalletCheckComplete(true);
    };

    checkWallet();
  }, [completeData, loading]);

  // Redirection si non authentifié ou pas de wallet
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    if (
      walletCheckComplete &&
      !walletStatus?.hasWallet &&
      pathname !== "/wallet/create"
    ) {
      router.replace("/wallet/create");
    }
  }, [
    loading,
    isAuthenticated,
    walletCheckComplete,
    walletStatus,
    pathname,
    router,
  ]);

  const handleRefreshStatus = () => {
    router.refresh();
  };

  // États de chargement
  if (loading || (!walletCheckComplete && isAuthenticated)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Skeleton className="h-12 w-48 mb-8" />
            <div className="grid gap-8">
              <Skeleton className="h-64 rounded-2xl" />
              <Skeleton className="h-32 rounded-2xl" />
              <Skeleton className="h-96 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si pas de wallet, on retourne null en attendant la redirection (pour éviter le flash)
  if (
    !walletStatus?.hasWallet
  ) {
    if(pathname === "/wallet/create") {
      return children
    } 
    return <WalletCreationScreen user={user} />
  }

  if (walletStatus?.is_locked) {
    return <WalletLockedScreen walletStatus={walletStatus} onRefresh={handleRefreshStatus} />;
  }

  if (walletStatus?.is_active === false) {
    // Explicite false check
    return <WalletInactiveScreen walletStatus={walletStatus} onRefresh={handleRefreshStatus} />;
  }

  if (
    walletStatus?.verification_status &&
    walletStatus.verification_status !== "VERIFIED"
  ) {
    if (pathname === "/wallet/verification") {
      return children;
    }
    return <WalletVerificationScreen walletStatus={walletStatus} onRefresh={handleRefreshStatus} />;
  }

  // Tout est bon, afficher le layout normal
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="mx-auto p-3">
        <Suspense fallback={<WalletSkeleton />}>
          <AnimatePresence mode="wait">
            {/* Navigation spécifique au wallet */}
            {/* <WalletNavigation /> */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto space-y-6"
            >
              {/* Security Warning for default PIN */}
              {walletStatus?.is_default_pin && pathname !== "/wallet/settings" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mb-6 overflow-hidden"
                  >
                    <Card className="bg-yellow-500/10 border-yellow-500/20">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-3 text-yellow-600 dark:text-yellow-500">
                                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                <div>
                                    <Typography variant="body-sm" weight="bold">Sécurité : PIN par défaut détecté</Typography>
                                    <Typography variant="caption1">Votre wallet utilise le code par défaut (123456). Pour protéger vos fonds, veuillez le changer dès maintenant.</Typography>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-yellow-500/50 text-yellow-600 hover:bg-yellow-500/10"
                                onClick={() => router.push("/wallet/settings")}
                            >
                                <Lock className="h-4 w-4 mr-2" />
                                Changer mon PIN
                            </Button>
                        </CardContent>
                    </Card>
                  </motion.div>
              )}

              {children}
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </div>
    </div>
  );
}

// Écran de création de wallet amélioré
function WalletCreationScreen({ user }: { user: any }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-2xl">
        <CardContent className="p-4 text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center mb-4">
              <Wallet className="h-10 w-10 text-white" />
            </div>
          </motion.div>

          <Typography variant="h3" weight="bold">
            Bienvenue sur Games Trafics Wallet
          </Typography>

          <Typography
            variant="body-base"
            theme="muted"
            className="max-w-sm mx-auto"
          >
            {user?.fullName || user?.username}, créez votre wallet sécurisé pour
            :
          </Typography>

          <div className="space-y-4 pt-4">
            {[
              {
                icon: CheckCircle,
                text: "Transactions instantanées et sécurisées",
                color: "text-green-500",
              },
              {
                icon: Shield,
                text: "Protection maximale de vos fonds",
                color: "text-blue-500",
              },
              {
                icon: Wallet,
                text: "Achats rapides sur la plateforme",
                color: "text-purple-500",
              },
              {
                icon: ArrowLeft,
                text: "Transferts vers d'autres utilisateurs",
                color: "text-orange-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <feature.icon className={`h-5 w-5 ${feature.color}`} />
                <Typography variant="body-sm">{feature.text}</Typography>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="pt-6 space-y-3"
          >
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={() => router.push("/wallet/create")}
            >
              <Wallet className="h-5 w-5" />
              Créer mon Wallet
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Plus tard
            </Button>
          </motion.div>

          <Typography variant="caption2" theme="muted" className="pt-4">
            En créant un wallet, vous acceptez nos{" "}
            <a href="/terms" className="text-primary hover:underline">
              conditions d'utilisation
            </a>
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}

// Écran wallet verrouillé
function WalletLockedScreen({ walletStatus, onRefresh }: { walletStatus: any; onRefresh?: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/20 border-2">
        <CardContent className="p-4 text-center space-y-4">
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={onRefresh} title="Rafraîchir">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-20 h-20 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Lock className="h-10 w-10 text-destructive" />
          </div>

          <Typography variant="h3" weight="bold" theme="danger">
            Wallet Verrouillé
          </Typography>

          <Typography
            variant="body-base"
            theme="muted"
            className="max-w-sm mx-auto"
          >
            Votre wallet a été temporairement verrouillé pour des raisons de
            sécurité. Veuillez contacter le support ou attendre le
            déverrouillage automatique.
          </Typography>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <Typography variant="body-sm" theme="muted">
                Tentatives échouées:
              </Typography>
              <Typography variant="body-sm" weight="bold">
                {walletStatus.failedAttempts}
              </Typography>
            </div>
            <div className="flex justify-between">
              <Typography variant="body-sm" theme="muted">
                Statut:
              </Typography>
              <Badge variant="destructive">VERROUILLÉ</Badge>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => router.push("/support")}
            >
              <Shield className="h-4 w-4" />
              Contacter le Support
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Retour à l'accueil
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Écran wallet inactif
function WalletInactiveScreen({ walletStatus, onRefresh }: { walletStatus: any; onRefresh?: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-4 text-center space-y-4">
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={onRefresh} title="Rafraîchir">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-4">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>

          <Typography variant="h3" weight="bold">
            Wallet en Attente
          </Typography>

          <Typography
            variant="body-base"
            theme="muted"
            className="max-w-sm mx-auto"
          >
            Votre wallet est en cours d'activation. Cette procédure peut prendre
            jusqu'à 24 heures. Vous serez notifié dès qu'il sera actif.
          </Typography>

          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "60%" }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            </div>
            <Typography variant="caption1" theme="muted">
              Activation en cours...
            </Typography>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push("/")}
          >
            Retour à l'accueil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Écran vérification wallet
function WalletVerificationScreen({ walletStatus, onRefresh }: { walletStatus: any; onRefresh?: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-4 text-center space-y-4">
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={onRefresh} title="Rafraîchir">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>

          <Typography variant="h3" weight="bold">
            Vérification Requise
          </Typography>

          <Typography
            variant="body-base"
            theme="muted"
            className="max-w-sm mx-auto"
          >
            Pour des raisons de sécurité et de conformité, votre wallet
            nécessite une vérification d'identité.
          </Typography>

          <div className="space-y-3">
            <Typography variant="body-sm" weight="semibold">
              Statut: {walletStatus.verificationStatus}
            </Typography>
            <div className="flex items-center justify-center gap-2">
              {walletStatus.verificationStatus === "PENDING" && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  EN ATTENTE
                </Badge>
              )}
              {walletStatus.verificationStatus === "REJECTED" && (
                <Badge variant="destructive" className="gap-1">
                  <Ban className="h-3 w-3" />
                  REJETÉ
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              className="w-full gap-2"
              onClick={() => router.push("/wallet/verification")}
            >
              <Shield className="h-4 w-4" />
              Compléter la Vérification
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.push("/")}
            >
              Plus tard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Skeleton pour le chargement
function WalletSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
