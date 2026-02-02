"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Wallet,
  CreditCard,
  QrCode,
  Smartphone,
  Globe,
  Zap,
  Shield,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface WalletPreviewProps {
  user: any;
  settings: {
    currency: string;
    enableBiometrics: boolean;
    enableNotifications: boolean;
  };
  className?: string;
}

export function WalletPreview({
  user,
  settings,
  className,
}: WalletPreviewProps) {
  const appInfo = {
    name: "GAMES TRAFICS",
    logo: "/images/icons/logo/game_logo.png",
  };

  const features = [
    {
      icon: Zap,
      label: "Transactions instantanées",
      enabled: true,
    },
    {
      icon: Shield,
      label: "Protection avancée",
      enabled: settings.enableBiometrics,
    },
    {
      icon: Globe,
      label: "Support multi-devises",
      enabled: true,
    },
    {
      icon: Smartphone,
      label: "Notifications push",
      enabled: settings.enableNotifications,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("relative", className)}
    >
      <Card className="border-0 shadow-2xl overflow-hidden">
        {/* Carte principale */}
        <div className="relative h-48 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
          <div className="absolute inset-0 bg-black/10" />
          <CardContent className="relative h-full p-6 flex flex-col justify-between">
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
              <Badge variant="secondary" className="bg-white/20 text-white">
                NOUVEAU
              </Badge>
            </div>

            {/* Informations centrales */}
            <div className="text-center">
              <Typography variant="caption2" theme="white" className="opacity-80 mb-2">
                WALLET VIRTUEL
              </Typography>
              <Typography
                variant="h3"
                weight="bold"
                theme="white"
                className="font-mono tracking-widest"
              >
                WLT-••••-••••-••••
              </Typography>
            </div>

            {/* Pied de carte */}
            <div className="flex justify-between items-center">
              <div>
                <Typography variant="caption2" theme="white" className="opacity-80">
                  TITULAIRE
                </Typography>
                <Typography variant="body-sm" weight="medium" theme="white">
                  {user?.fullName?.toUpperCase() || user?.username?.toUpperCase() || "UTILISATEUR"}
                </Typography>
              </div>
              <div className="text-right">
                <Typography variant="caption2" theme="white" className="opacity-80">
                  SOLDE INITIAL
                </Typography>
                <Typography variant="h4" weight="bold" theme="white" threeD>
                  0.00 {settings.currency}
                </Typography>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Informations supplémentaires */}
        <CardContent className="p-6 space-y-6">
          <div>
            <Typography variant="body-sm" weight="medium" className="mb-3">
              Fonctionnalités incluses:
            </Typography>
            <div className="grid grid-cols-2 gap-3">
              {features.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg",
                      feature.enabled
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-muted/50"
                    )}
                  >
                    <FeatureIcon
                      className={cn(
                        "h-4 w-4",
                        feature.enabled
                          ? "text-green-600"
                          : "text-muted-foreground"
                      )}
                    />
                    <Typography
                      variant="caption2"
                      className={cn(
                        feature.enabled ? "text-green-800 dark:text-green-400" : "text-muted-foreground"
                      )}
                    >
                      {feature.label}
                    </Typography>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" theme="muted">
                Statut de vérification
              </Typography>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                EN ATTENTE
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" theme="muted">
                Limite de transaction
              </Typography>
              <Typography variant="body-sm" weight="medium">
                5,000 {settings.currency}/jour
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" theme="muted">
                Frais mensuels
              </Typography>
              <Typography variant="body-sm" weight="medium">
                Gratuit
              </Typography>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 gap-2">
              <CreditCard className="h-4 w-4" />
              Ajouter une carte
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <QrCode className="h-4 w-4" />
              QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Effet de brillance */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/20 to-purple-600/20 blur-3xl opacity-30" />
    </motion.div>
  );
}